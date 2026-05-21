<template>
    <!--
        Picture 派生（design.md §3.3，[预留]｜后续内容）
        ────────────────────────────────────────────────────────────
        本期 (Avatar) 不投产、不被 NativeImage/index.js re-export、不被任何生产路径引用。
        本文件只是"接入形态"伪代码：
          - 让接 chat-msg-list/msg/image.vue 的 PR 一比一对照即可落地；
          - 让 design.md §3.3 / §13.6 不再是纯文字，便于 review 时具象化。
        预留依赖：
          - persist/MsgPropertyPersist（仅写新 msg.nativeImage，不双写旧字段，§12.7 + §13.10）
          - utils/db/patchMsgNativeImage（多 slot 原子 IDB tx，§13.4）
        当 Picture 真正接入时，需要：
          1. NativeImage/index.js 重新导出 Picture
          2. 启用 MsgPropertyPersist 与 patchMsgNativeImage（仅写新字段，旧 msg.local* 同 PR 删除）
          3. 在 ESLint no-restricted-imports 里允许该文件 import core/ + ipc/（§12.2）
    -->
    <NativeImage
        :url="url"
        :encrypt-key="fileKey"
        :scope="scope"
        :resource-key="resourceKey"
        :fallback="fallbackChain"
        :persist-adapter="persistAdapter"
        :slot-index="slotIndex"
        class="com-native-picture"
        @ready="onReady"
        @error="onError"
        @onClick="handleClick"
        @onContextmenu="(e) => $emit('rightClick', { e, info: msgInfo })"
    >
        <template #loading>
            <div class="picture-loading" />
        </template>
        <template #expired>
            <div class="picture-error">{{ $t ? $t('图片已过期') : '图片已过期' }}</div>
        </template>
        <template #downloadError>
            <div class="picture-error">{{ $t ? $t('图片已过期') : '图片已过期' }}</div>
        </template>
        <template #decryptError>
            <div class="picture-error">{{ $t ? $t('图片文件解密失败') : '图片文件解密失败' }}</div>
        </template>
    </NativeImage>
</template>

<script>
// 伪代码：本期不引用
import NativeImage from './NativeImage.vue';
import { makeStateEntry, makeSlot, makeAsset } from './core/fallback';
import { SCOPE_KIND, STATE } from './core/constants';
import bigFailIcon from '@/assets/images/file/icon_fail_picture_big.png';

export default {
    name: 'Picture',
    components: { NativeImage },
    props: {
        msgInfo:    { type: Object, required: true },
        url:        { type: String, required: true },
        slotIndex:  { type: [Number, String], default: null },
        // persistAdapter 由调用方（如 MediaCaption）创建一次后透传，
        // 避免每个 Picture 实例各自 new MsgPropertyPersist。
        persistAdapter: { type: Object, default: null },
    },
    computed: {
        fileKey() {
            return this.msgInfo?.fileKey || '';
        },
        scope() {
            return {
                kind: SCOPE_KIND.PICTURE,
                id: this.msgInfo?.customMsgId || this.msgInfo?.MsgID,
                sub: this.slotIndex == null ? 'main' : String(this.slotIndex),
            };
        },
        resourceKey() {
            // 真实实现取 stripChatContentMetaSuffix(url) 后的稳定哈希
            return this.url;
        },
        fallbackChain() {
            return [
                makeStateEntry(STATE.RESOLVING, makeSlot('loading')),
                makeStateEntry(STATE.DOWNLOADING, makeSlot('loading')),
                makeStateEntry(STATE.VERIFYING, makeSlot('loading')),
                makeStateEntry(STATE.DECRYPTING, makeSlot('loading')),
                makeStateEntry(STATE.COMMITTING, makeSlot('loading')),
                makeStateEntry(STATE.EXPIRED, makeSlot('expired')),
                makeStateEntry(STATE.DOWNLOAD_ERROR, makeSlot('downloadError')),
                makeStateEntry(STATE.DECRYPT_ERROR, makeSlot('decryptError')),
                makeAsset(bigFailIcon),
            ];
        },
    },
    methods: {
        onReady(snap)  { /* 接入 progress.complete(this.msgInfo) */ },
        onError(snap)  { /* 上报 / 度量 */ },
        handleClick(e) { /* 接 description #18：打开 MediaView，[预留] */ },
    },
};
</script>

<style scoped>
.com-native-picture { display: inline-block; }
.picture-loading { width: 100%; height: 100%; background: #f2efef; }
.picture-error   { padding: 8px; color: #999; }
</style>
