<template>
    <!--
        Poster 派生（design.md §3.3 / §7.6 / §13.5｜[预留]｜后续内容）
        ────────────────────────────────────────────────────────────
        本期 (Avatar) 不投产、不被 index.js re-export、不被任何生产路径引用。
        本文件示意：
          - "poster 决定显示态，video 仅在点击播放时下载"（§13.5 第一行）；
          - 同 slot 两台同级状态机不互相联动（§7.6）；
          - 接 description #18 时 click 事件打开 MediaView。
    -->
    <div class="com-native-poster" @click="onClickPlay">
        <NativeImage
            :url="thumbUrl"
            :encrypt-key="fileKey"
            :scope="scopePoster"
            :resource-key="resourceKeyPoster"
            :fallback="posterFallback"
            :persist-adapter="persistAdapter"
            :slot-index="slotIndex"
        >
            <template #loading><div class="poster-overlay">…</div></template>
            <template #expired><div class="poster-overlay">{{ $t ? $t('视频已过期') : '视频已过期' }}</div></template>
            <template #downloadError><div class="poster-overlay">{{ $t ? $t('视频已过期') : '视频已过期' }}</div></template>
            <template #decryptError><div class="poster-overlay">{{ $t ? $t('视频文件解密失败') : '视频文件解密失败' }}</div></template>
        </NativeImage>

        <!--
            video 文件状态机：仅在用户点击播放后才挂上 <NativeImage>；mount 即 acquire。
            不影响外层 aggregated.state（design.md §13.5）。
        -->
        <NativeImage
            v-if="videoActive"
            :url="videoUrl"
            :encrypt-key="fileKey"
            :scope="scopeVideo"
            :resource-key="resourceKeyVideo"
            :fallback="[]"
            :persist-adapter="persistAdapter"
            @ready="onVideoReady"
            @error="onVideoError"
        />
    </div>
</template>

<script>
// 伪代码：本期不引用
import NativeImage from './NativeImage.vue';
import { makeStateEntry, makeSlot } from './core/fallback';
import { SCOPE_KIND, STATE, MACHINE } from './core/constants';

export default {
    name: 'Poster',
    components: { NativeImage },
    props: {
        msgInfo:    { type: Object, required: true },
        videoUrl:   { type: String, required: true },
        thumbUrl:   { type: String, required: true },
        slotIndex:  { type: [Number, String], default: null },
        persistAdapter: { type: Object, default: null },
    },
    data() {
        return { videoActive: false };
    },
    computed: {
        fileKey() { return this.msgInfo?.fileKey || ''; },
        slotSub() { return this.slotIndex == null ? 'main' : String(this.slotIndex); },
        scopePoster() {
            return { kind: SCOPE_KIND.POSTER, id: this.msgInfo?.customMsgId, sub: this.slotSub };
        },
        scopeVideo() {
            // 复用 picture kind + ext.machine=video 标记，让 MsgPropertyPersist 写到 slot.video
            return { kind: SCOPE_KIND.PICTURE, id: this.msgInfo?.customMsgId, sub: this.slotSub };
        },
        resourceKeyPoster() { return this.thumbUrl; },
        resourceKeyVideo()  { return this.videoUrl; },
        posterFallback() {
            return [
                makeStateEntry(STATE.RESOLVING, makeSlot('loading')),
                makeStateEntry(STATE.DOWNLOADING, makeSlot('loading')),
                makeStateEntry(STATE.VERIFYING, makeSlot('loading')),
                makeStateEntry(STATE.DECRYPTING, makeSlot('loading')),
                makeStateEntry(STATE.COMMITTING, makeSlot('loading')),
                makeStateEntry(STATE.EXPIRED, makeSlot('expired')),
                makeStateEntry(STATE.DOWNLOAD_ERROR, makeSlot('downloadError')),
                makeStateEntry(STATE.DECRYPT_ERROR, makeSlot('decryptError')),
            ];
        },
    },
    methods: {
        onClickPlay() {
            this.videoActive = true;
            // 实际 UI 调 MediaView 打开播放器；这里仅触发下载
        },
        onVideoReady(/* snap */) {
            // 打开 MediaView，传 snap.resourcePath
        },
        onVideoError(/* snap */) {
            // 提示用户视频下载失败；不影响 poster 显示
        },
    },
};
</script>

<style scoped>
.com-native-poster { position: relative; }
.poster-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(0,0,0,0.45); }
</style>
