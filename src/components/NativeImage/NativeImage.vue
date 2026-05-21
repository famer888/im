<script>
// NativeImage 基底（design.md §3.1，本期）
//
// 职责：
//   1. mount 时编码 native-image:// URL 挂到 <img :src>；触发 main 进程流水线
//   2. 通过 IPC 订阅 main 端状态机的 snapshot；renderer 仅做"观察者"
//   3. 根据当前 state + fallback 数组求值，决定挂 <img> / 调具名 slot / 渲染组件
//   4. 透传 click/contextmenu 给派生
//
// 派生组件（Avatar 本期；Picture/Poster 预留）只通过 props 接入；
// 不直接 import 'core/' / 'node/'，也不直接发 IPC（design.md §12.2）。
//
// 之所以用 render() 而不是 <template>：
//   wrapper === false 时要求"组件根 = 内部 <img>/fallback 节点本身"，
//   Vue 2 SFC 单根模板做不到"可选地不包裹"（fragment 仅在 Vue 3）。
//   render() 让我们对"包不包"完全可控，class / $attrs 由 Vue 自动合并到所选根上。

import { encode as encodeCustomUrl } from './core/customUrl';
import { evaluate as evalFallback } from './core/fallback';
import { STATE } from './core/constants';
import * as ipc from './ipc/renderer';

export default {
    name: 'NativeImage',
    props: {
        url:            { type: String, default: '' },
        encryptKey:     { type: String, default: '' },
        decrypted:      { type: Boolean, default: false },
        scope:          { type: Object, required: true }, // { kind, id, sub? }
        resourceKey:    { type: String, required: true },
        fallback:       { type: Array, default: () => [] },
        slotIndex:      { type: [Number, String], default: null },
        decryptHint:    { type: Object, default: () => ({ headerCheck: true }) },
        resultDir:      { type: String, default: null },
        // 本期 Avatar 注入 NoopPersist；Picture/Poster 接入时按 §12.3 注入 MsgPropertyPersist
        // （仅写新字段 msg.nativeImage，不双写旧 msg.local* 等字段，§12.7）
        persistAdapter: { type: Object, default: null },
        // [预留] 域名 / 解密 / 状态机插件适配器，本期由 main 端持有默认实现，组件侧不感知
        domainAdapter:  { type: Object, default: null },
        decryptAdapter: { type: Object, default: null },
        smPlugins:      { type: Array, default: null },
        // 外层容器开关：
        //   true  (默认)：保留 <span class="native-image" data-state="...">；
        //                 span 自身 display:contents 在 layout 中不可见，但保留 data-state
        //                 作为 CSS / 调试探针（Picture/Poster slot 模式必须 true，
        //                 因为多状态会切换不同子节点，需要稳定的容器锚点）
        //   false：完全不包；组件根 = 内部 <img> / 组件 fallback / slot 节点本身。
        //          class / $attrs 由 Vue 自动合并到该根，DOM 扁一层，无 display:contents
        //          相关的 a11y / inline 兼容性边界。Avatar 默认走这条（30+ 调用点的父级
        //          CSS 直接选 <img>，少一层 span 反而更贴近旧 ComImage 的 DOM 结构）。
        //   String / Object / Function：作为自定义包裹标签 / 组件，挂上同样的
        //          class="native-image" 和 data-state 属性，便于业务侧改写包裹层为
        //          带样式的容器（如 <div class="avatar-frame">）。
        wrapper:        { type: [Boolean, String, Object, Function], default: true },
    },
    data() {
        return {
            snapshot: { state: STATE.IDLE, taskId: null, error: null, resourcePath: null },
            _unsubscribe: null,
            // 锁存 acquire 时使用的 (scope, resourceKey)：watcher / beforeDestroy
            // 必须 cancel "本组件实际持有的那一项"，不能用响应式 getter（getter 读到的
            // 是新值，会把刚 acquire 的新任务误 release 掉）
            _acquired: null,
        };
    },
    computed: {
        nativeUrl() {
            if (!this.url || !this.scope || !this.resourceKey) return '';
            return encodeCustomUrl({
                scope: this.scope,
                resourceKey: this.resourceKey,
                url: this.url,
                encryptKey: this.decrypted ? null : (this.encryptKey || null),
            });
        },
        fallbackEntry() {
            // ready 且有 localPath → 不走 fallback，直接显示真图（design.md §6.1）
            const ctx = {
                state: this.snapshot.state,
                localPath: this.snapshot.state === STATE.READY ? this.snapshot.resourcePath : null,
            };
            return evalFallback(this.fallback, ctx);
        },
        imgSrc() {
            if (this.snapshot.state === STATE.READY) return this.nativeUrl;
            const e = this.fallbackEntry;
            if (e && (e.kind === 'url' || e.kind === 'asset')) return e.value;
            // 回退：让 stream protocol 自己回 4xx/5xx，<img> onerror 由派生 fallback 兜底
            return this.nativeUrl;
        },
    },
    mounted() {
        this._subscribeStatus();
    },
    beforeDestroy() {
        this._unsubscribeStatus();
        this._releaseAcquired();
    },
    watch: {
        nativeUrl(/* newUrl, oldUrl */) {
            // src / scope / resourceKey 任一变化都意味着是另一台状态机
            this._unsubscribeStatus();
            // 必须 cancel 本组件 acquire 时锁存的旧 (scope, resourceKey)，
            // 而不是当下响应式的新值；否则同一新 resourceKey 被多个组件共享时，
            // 后到的 cancel(NEW) 会把前者刚 acquire 的任务直接释放成 idle，
            // 把前者的订阅永久卡死（详见 design.md §5.7 refCount 语义）。
            this._releaseAcquired();
            this.snapshot = { state: STATE.IDLE, taskId: null, error: null, resourcePath: null };
            this._subscribeStatus();
        },
    },
    methods: {
        async _subscribeStatus() {
            if (!this.scope || !this.resourceKey || !this.url) return;
            // 锁存本次 acquire 的身份：之后无论 props 怎么变，cancel 永远命中
            // 我们真正持有的那一项；reactive getter 在 watcher 触发时已是新值，不能用。
            const acquired = { scope: this.scope, resourceKey: this.resourceKey };
            try {
                const snap = await ipc.resolve({
                    scope: acquired.scope,
                    resourceKey: acquired.resourceKey,
                    url: this.url,
                    encryptKey: this.decrypted ? null : (this.encryptKey || null),
                });
                if (!snap) return;
                this.snapshot = snap;
                this._acquired = acquired;
                this._unsubscribe = ipc.subscribe(snap.taskId, (next) => {
                    this.snapshot = next;
                    this.$emit('status', next);
                    if (next.state === STATE.READY) this.$emit('ready', next);
                    if ([STATE.EXPIRED, STATE.DOWNLOAD_ERROR, STATE.DECRYPT_ERROR].includes(next.state)) {
                        this.$emit('error', next);
                    }
                });
            } catch (e) {
                // 静默：fallback 仍会触发，不会让 UI 完全卡住
                console.warn('[NativeImage] subscribe failed', e);
            }
        },
        _unsubscribeStatus() {
            try { this._unsubscribe && this._unsubscribe(); } catch (_) {}
            this._unsubscribe = null;
        },
        _releaseAcquired() {
            const acq = this._acquired;
            this._acquired = null;
            if (acq && acq.scope && acq.resourceKey) {
                try { ipc.cancel({ scope: acq.scope, resourceKey: acq.resourceKey }); } catch (_) {}
            }
        },
        onLoad(e) {
            this.$emit('load', e);
        },
        onError(e) {
            this.$emit('error', e);
        },
        _renderInner(h) {
            const fe = this.fallbackEntry;
            const passthroughOn = {
                ...this.$listeners,
                click: (e) => this.$emit('onClick', e),
                contextmenu: (e) => this.$emit('onContextmenu', e),
            };
            if (fe && fe.kind === 'component') {
                const extra = fe.props || {};
                // 与原模板 v-bind=props 一致：既透传到 props，也兜底落到 attrs，
                // 兼容"非 props 字段"用法（如 TextAvatar 的 value/id 既可能是 props 也可能是 attrs）
                return h(fe.value, {
                    props: extra,
                    attrs: extra,
                    on: passthroughOn,
                });
            }
            if (fe && fe.kind === 'slot') {
                const slotFn = this.$scopedSlots[fe.name];
                if (slotFn) {
                    const nodes = slotFn({ snapshot: this.snapshot });
                    // 单根/多根都兼容；wrapper=false 时多根会被 Vue 2 警告 "component has more than one root"，
                    // 这是显式契约：业务侧若给 slot 多根，必须保留 wrapper（默认）
                    return Array.isArray(nodes) && nodes.length === 1 ? nodes[0] : nodes;
                }
                return null;
            }
            return h('img', {
                attrs: {
                    src: this.imgSrc,
                    draggable: false,
                },
                on: {
                    load: this.onLoad,
                    error: this.onError,
                    click: (e) => this.$emit('onClick', e),
                    contextmenu: (e) => this.$emit('onContextmenu', e),
                },
            });
        },
    },
    render(h) {
        const inner = this._renderInner(h);
        if (this.wrapper === false) {
            // inner 可能是 null（slot 缺失）；返回空 vnode 避免 "render returned null" 报错
            return inner || h();
        }
        const tag = this.wrapper === true ? 'span' : this.wrapper;
        return h(tag, {
            class: 'native-image',
            attrs: { 'data-state': this.snapshot.state },
        }, [inner]);
    },
};
</script>

<style scoped>
/*
 * display: contents 让 <span> 包裹层在 layout 中不可见 ——
 * 30+ 既有 ComImage 调用点都靠"父级 CSS 直接选 <img>"控制大小，
 * 直接套个 inline-block / inline-flex 的 span 会出现 baseline / line-height 漂移。
 *
 * 注：wrapper === false 时这条样式不生效（根本没有 .native-image 元素），
 * Avatar 走该路径，直接以 <img> 作根，DOM 结构与旧 ComImage 一致。
 */
.native-image {
    display: contents;
}
</style>
