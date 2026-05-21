<template>
    <NativeImage
        v-if="hasRealSrc"
        :url="rewrittenSrc"
        :encrypt-key="encryptKey"
        :scope="scopeObj"
        :resource-key="resourceKey"
        :fallback="fallbackChain"
        :persist-adapter="persistAdapter"
        class="com-native-avatar"
        @onClick="handleClick"
        @onContextmenu="handleContextmenu"
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
//   - 动态域名仅做"用 ossDefaultUrl 替换 host"；轮换/降权/上报为 §8.2 [预留]
//   - 默认 encryptKey = process.env.VUE_APP_HEAD_AES_KEY（头像统一 AES-128-ECB 加密），
//     业务侧可通过 prop 显式覆盖（如某些不加密的 default 头像源走 defaultUrl fallback）
//   - 不入库：persistAdapter = noopPersist（§12.3）

import NativeImage from './NativeImage.vue';
import TextAvatar from '@/components/text-avatar.vue';
import groupIcon from '@/assets/images/logo/default_group_icon.png';
import friendIcon from '@/assets/images/logo/logo-58.png';
import channelIcon from '@/assets/images/logo/channel-notice.webp';
import { makeStateEntry, makeUrl, makeAsset, makeComponent } from './core/fallback';
import { rewriteHost } from './core/domain';
import { SCOPE_KIND, STATE } from './core/constants';
import { copyToClipboard } from '@/utils/base';
import eventCommon from '@/event/common';
import { noopPersist } from './persist/NoopPersist';

const defaultIconByType = {
    friend:  friendIcon,
    group:   groupIcon,
    channel: channelIcon,
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
        type:       { type: String, default: 'friend' }, // 'friend' | 'group' | 'channel'
        defaultUrl: { type: String, default: '' },
        // 可选：仅 TextAvatar fallback 用；旧调用点没传也不影响
        name:       { type: String, default: '' },
        uid:        { type: [Number, String], default: 0 },
        // 头像 AES key：缺省读 env，业务侧可显式覆盖（如未加密源传 ''）
        encryptKey: { type: String, default: () => process.env.VUE_APP_HEAD_AES_KEY || '' },
    },
    computed: {
        hasRealSrc() {
            // 与旧 image.vue 同步："包含 default" 视作没有真实 src
            return !!this.src && !this.src.includes('default');
        },
        scopeObj() {
            return { kind: SCOPE_KIND.AVATAR, id: this.uid || 0, sub: this.type };
        },
        // 动态域名只做"用 ossDefaultUrl 替换 host"（design.md §8.1）。
        // 本期在 renderer 端完成重写：避免 main 端再读 eventCommon；
        // 重写不影响 resourceKey（见下），同一头像在 host rotation 后仍命中本地缓存。
        rewrittenSrc() {
            return rewriteHost(this.src, eventCommon);
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
            // 2. 错误终态 → defaultIcon（§6 + §3.2"全 fallback 到默认 icon"）
            const fallbackForError = makeAsset(this.defaultIcon);
            chain.push(makeStateEntry(STATE.EXPIRED, fallbackForError));
            chain.push(makeStateEntry(STATE.DOWNLOAD_ERROR, fallbackForError));
            chain.push(makeStateEntry(STATE.DECRYPT_ERROR, fallbackForError));
            // 3. TextAvatar （name 有效时优先 —— 与现 src/v-old 头像 fallback 习惯一致）
            if (this.name) chain.push(this.textAvatarEntry);
            // 4. 兜底 defaultIcon
            chain.push(makeAsset(this.defaultIcon));
            return chain;
        },
        defaultFallbackEntry() {
            // src 不可用时，组件直接渲染兜底，不挂 <NativeImage>（不发起任何 IPC/下载）
            if (this.defaultUrl) return makeUrl(this.defaultUrl);
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
