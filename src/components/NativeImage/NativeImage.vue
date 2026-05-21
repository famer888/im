<template>
    <span class="native-image" :data-state="snapshot.state">
        <component
            v-if="fallbackEntry && fallbackEntry.kind === 'component'"
            :is="fallbackEntry.value"
            v-bind="fallbackEntry.props || {}"
            v-on="$listeners"
            @click="$emit('onClick', $event)"
            @contextmenu="$emit('onContextmenu', $event)"
        />
        <slot
            v-else-if="fallbackEntry && fallbackEntry.kind === 'slot'"
            :name="fallbackEntry.name"
            :snapshot="snapshot"
        />
        <img
            v-else
            :src="imgSrc"
            :draggable="false"
            @load="onLoad"
            @error="onError"
            @click="$emit('onClick', $event)"
            @contextmenu="$emit('onContextmenu', $event)"
        />
    </span>
</template>

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
    },
    data() {
        return {
            snapshot: { state: STATE.IDLE, taskId: null, error: null, resourcePath: null },
            _unsubscribe: null,
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
        if (this.scope && this.resourceKey) {
            try { ipc.cancel({ scope: this.scope, resourceKey: this.resourceKey }); } catch (_) {}
        }
    },
    watch: {
        nativeUrl(/* newUrl, oldUrl */) {
            // src / scope / resourceKey 任一变化都意味着是另一台状态机
            this._unsubscribeStatus();
            if (this.scope && this.resourceKey) {
                try { ipc.cancel({ scope: this.scope, resourceKey: this.resourceKey }); } catch (_) {}
            }
            this.snapshot = { state: STATE.IDLE, taskId: null, error: null, resourcePath: null };
            this._subscribeStatus();
        },
    },
    methods: {
        async _subscribeStatus() {
            if (!this.scope || !this.resourceKey || !this.url) return;
            try {
                const snap = await ipc.resolve({
                    scope: this.scope,
                    resourceKey: this.resourceKey,
                    url: this.url,
                    encryptKey: this.decrypted ? null : (this.encryptKey || null),
                });
                if (!snap) return;
                this.snapshot = snap;
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
        onLoad(e) {
            this.$emit('load', e);
        },
        onError(e) {
            this.$emit('error', e);
        },
    },
};
</script>

<style scoped>
/*
 * display: contents 让 <span> 包裹层在 layout 中不可见 ——
 * 30+ 既有 ComImage 调用点都靠"父级 CSS 直接选 <img>"控制大小，
 * 直接套个 inline-block / inline-flex 的 span 会出现 baseline / line-height 漂移。
 */
.native-image {
    display: contents;
}
</style>
