<template>
    <NativeImage
        v-if="hasRealSrc"
        :url="src"
        :candidate-urls="candidateUrls"
        :encrypt-key="encryptKey"
        :scope="scopeObj"
        :decrypted="false"
        :resource-key="resourceKey"
        :fallback="fallbackChain"
        :persist-adapter="persistAdapter"
        :wrapper="false"
        class="com-native-avatar"
        @onClick="handleClick"
        @onContextmenu="handleContextmenu"
    />
    <img
        v-else-if="hasLocalSrc"
        :src="src"
        class="com-native-avatar"
        @click.stop="handleClick"
        @contextmenu.prevent="handleContextmenu"
    />
    <component
        v-else-if="defaultFallbackEntry.kind === 'component'"
        :is="defaultFallbackEntry.value"
        v-bind="defaultFallbackEntry.props"
        class="com-native-avatar"
        @click.stop="handleClick"
        @contextmenu.prevent="handleContextmenu"
    />
    <img
        v-else
        :src="defaultFallbackEntry.value"
        class="com-native-avatar"
        @click.stop="handleClick"
        @contextmenu.prevent="handleContextmenu"
    />
</template>

<script>
// Avatar 派生（design.md §3.2，本期）
//
// 兼容旧 ComImage：完全保留 props (`src` / `type` / `defaultUrl`) 与
// emits (`onClick` / `onContextmenu`)，并保持"无内联尺寸"约定 —— 30+ 调用点
// 仍由各自父级 CSS（.member-avatar / .img-head / .avatar 等）控制大小。
//
// 行为差异（与旧 ComImage 对齐 §3.2）：
//   - 无 loading / 无 failure UI；resolving / *Error 一律走 fallback 链
//     直接挂到 <img> 或 TextAvatar，不报红
//   - 动态域名两段式（§8.1）：buildAvatarCandidates 算出 [原 url, ossDefaultUrl 重写后 url]
//     作为 candidateUrls 透传给 NativeImage → ipc.resolve → main 端 drivePipeline；
//     pipeline 在 fetch 阶段按顺序失败循环，全部失败才 dispatch 错误终态。状态机和
//     fallback 链对中间错误无感知，对齐旧 image.vue 的 loadUrl → loadErr 行为，但
//     去掉旧版硬编码 r22/r33.zhenyoumei.top 的特例，交由 wouldRewrite 自动判定。
//   - 轮换 / 降权 / 上报仍是 §8.2 [预留]，未来 trendsDomain 池接入只需在 main 端
//     注入 _domainAdapter，candidateUrls 数组退化为单元素（renderer 不再算第二段），
//     adapter 在 fetch 循环内按 attempt 重写 host。
//   - 默认 encryptKey = process.env.VUE_APP_HEAD_AES_KEY：业务现状是新老头像并存
//     （早期上传的走 AES-128-ECB 加密、近期上传的灰度成明文），所以这里**默认下发 key**，
//     由 node 端 headerCheck 在 §5.4 阶段按文件头实测决定走"解密"还是"跳过解密直 commit"
//     的快路径（design.md §7.x：VERIFYING --START_COMMIT--> COMMITTING）。
//     业务侧明确知道是未加密源时可显式传 '' 直接短路 verify 阶段。
//   - 不入库：persistAdapter = noopPersist（§12.3）
//   - 不包外层 span：wrapper=false。30+ 调用点的父级 CSS 直接选 <img>（.member-avatar img / .img-head 等），
//     沿用旧 ComImage 的 DOM 结构最少惊喜；class="com-native-avatar" 由 Vue 自动合并到 <img> 上。
//     Picture/Poster 需要切换"loading/error slot ↔ 真图"多状态，保留默认 wrapper=true 作稳定容器锚点。

import NativeImage from './NativeImage.vue';
import TextAvatar from '@/components/text-avatar.vue';
import groupIcon from '@/assets/images/logo/default_group_icon.png';
import friendIcon from '@/assets/images/logo/logo-58.png';
import channelIcon from '@/assets/images/logo/channel-notice.webp';
import { makeStateEntry, makeUrl, makeAsset, makeComponent } from './core/fallback';
import { buildAvatarCandidates } from './core/domain';
import { SCOPE_KIND, STATE } from './core/constants';
import { copyToClipboard } from '@/utils/base';
import eventCommon from '@/event/common';
import { noopPersist } from './persist/NoopPersist';

// 'channel'（真实频道）默认走 TextAvatar，无静态 icon；
// 'channel-notice'（聊天列表里那条"频道通知"入口）的身份图是 channel-notice.webp。
const defaultIconByType = {
    friend:           friendIcon,
    group:            groupIcon,
    'channel-notice': channelIcon,
};

// 稳定哈希（design.md §4.1：resourceKey 必须稳定，不能让 OSS 签名变动每次都 cache miss）。
const stableHash = (str) => {
    if (!str) return '';
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return (h >>> 0).toString(36) + '-' + Math.min(str.length, 9999).toString(36);
};

// 剔除 OSS 签名 query，让同一张头像在签名 rotation 时仍命中本地结果目录缓存
const stripOssSignature = (url) => {
    if (!url) return '';
    const i = url.indexOf('?');
    return i < 0 ? url : url.slice(0, i);
};

export default {
    name: 'Avatar',
    components: { NativeImage },
    props: {
        // 与 ComImage 1:1 兼容
        src:        { type: String, default: '' },
        type:       { type: String, default: 'friend' }, // 'friend' | 'group' | 'channel' | 'channel-notice'
        defaultUrl: { type: String, default: '' },
        // 可选：仅 TextAvatar fallback 用；旧调用点没传也不影响
        name:       { type: String, default: '' },
        uid:        { type: [Number, String], default: 0 },
        // 头像 AES key：缺省读 env（兼容历史加密头像），未加密源由 node 端
        // headerCheck 自动识别走 plain 快路径，无需业务侧关心
        encryptKey: { type: String, default: () => process.env.VUE_APP_HEAD_AES_KEY || '' },
    },
    computed: {
        hasRealSrc() {
            // 仅 http(s) 远程 URL 走 NativeImage 下载管线（IPC + 解密 + OSS 重写）。
            // "包含 default" 与旧 image.vue 一致视作无真实 src。
            if (!this.src || this.src.includes('default')) return false;
            return /^https?:\/\//i.test(this.src);
        },
        hasLocalSrc() {
            // 业务侧偶尔会用 require('@/assets/...') 把 webpack bundle 资源塞进 src
            // （比如 src/event/channel.js 给"频道通知"会话的 pic）。这类相对路径
            // 没法被 NativeImage 当 URL fetch（pipeline 直接 NETWORK rejected），
            // 转用静态 <img> 直接渲染，跳过整条 IPC 管线。
            // data: / blob: / file: 也归到这一类，浏览器原生支持，不用走 fetch。
            if (!this.src || this.src.includes('default')) return false;
            return !/^https?:\/\//i.test(this.src);
        },
        scopeObj() {
            return { kind: SCOPE_KIND.AVATAR, id: this.uid || 0, sub: this.type };
        },
        // 两段式 candidateUrls（design.md §8.1）。
        // [原 url] 或 [原 url, ossDefaultUrl 重写后 url]。
        // 不影响 resourceKey（见下），同一头像在 host rotation 后仍命中本地缓存。
        candidateUrls() {
            return buildAvatarCandidates(this.src, eventCommon);
        },
        resourceKey() {
            // resourceKey 必须稳定（design.md §4.1），不能让 OSS 签名 query 每次都 cache miss
            return stableHash(stripOssSignature(this.src)) || (this.src || '');
        },
        persistAdapter() {
            return noopPersist;
        },
        defaultIcon() {
            return defaultIconByType[this.type] || friendIcon;
        },
        textAvatarEntry() {
            return makeComponent(TextAvatar, {
                value: this.name || '',
                id: Number(this.uid) || 0,
            });
        },
        fallbackChain() {
            const chain = [];
            // 1. defaultUrl（上游显式提供时优先）
            if (this.defaultUrl) chain.push(makeUrl(this.defaultUrl));
            // 2. 错误终态 → 该 type 的默认兜底（channel 没有静态图，走 TextAvatar）
            const fallbackForError = this.type === 'channel'
                ? this.textAvatarEntry
                : makeAsset(this.defaultIcon);
            chain.push(makeStateEntry(STATE.EXPIRED, fallbackForError));
            chain.push(makeStateEntry(STATE.DOWNLOAD_ERROR, fallbackForError));
            chain.push(makeStateEntry(STATE.DECRYPT_ERROR, fallbackForError));
            // 3. TextAvatar（name 有效时优先 —— 与旧 image.vue 习惯一致）。
            //    channel-notice 的静态 icon 就是身份，跳过这条规则。
            if (this.name && this.type !== 'channel-notice') chain.push(this.textAvatarEntry);
            // 4. 最终兜底
            chain.push(fallbackForError);
            return chain;
        },
        defaultFallbackEntry() {
            // src 不可用时，组件直接渲染兜底，不挂 <NativeImage>（不发起任何 IPC/下载）
            if (this.defaultUrl) return makeUrl(this.defaultUrl);
            if (this.type === 'channel') return this.textAvatarEntry;
            if (this.type === 'channel-notice') return makeAsset(this.defaultIcon);
            if (this.name) return this.textAvatarEntry;
            return makeAsset(this.defaultIcon);
        },
    },
    methods: {
        handleClick(e) {
            // ctrl+click 复制头像地址 —— 平迁旧 image.vue 行为（design.md §3.2 末段）
            if (e && e.ctrlKey && this.src) {
                copyToClipboard('头像地址:' + this.src);
                if (typeof window !== 'undefined' && typeof window.$toast === 'function') {
                    try { window.$toast(this.$t ? this.$t('复制成功') : '复制成功'); } catch (_) {}
                }
            }
            this.$emit('onClick', e);
        },
        handleContextmenu(e) {
            this.$emit('onContextmenu', e);
        },
    },
};
</script>

<style scoped>
/*
 * 不强加尺寸 / 圆角 —— 与旧 ComImage 一致，由 30+ 调用点的父级 class 决定。
 * 仅做不可拖拽 + 指针手势，避免 hover 时 user-select 抖动。
 */
.com-native-avatar {
    -webkit-user-drag: none;
    cursor: pointer;
}
</style>
