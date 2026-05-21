<template>
    <!--
        MediaCaption 派生（design.md §3.4｜[预留]｜后续内容）
        ────────────────────────────────────────────────────────────
        本期 (Avatar) 不投产、不被 index.js re-export、不被任何生产路径引用。
        本文件按 §3.4.2 给出 ~50 行的布局壳伪代码：
          - 零状态、零 IPC、零生命周期 hook；
          - 内部 v-for 直接派单到 Picture/Poster，没有 MediaCell 这一层（§3.4.3）；
          - 解析靠 utils/mediasCaptionParser（[预留]，本期不存在），接入时一并落地。
    -->
    <div class="com-media-caption" @click.right="(e) => $emit('rightClick', { e, info: msgInfo })">
        <div class="grid" :style="gridStyle">
            <component
                v-for="(slot, i) in slots"
                :key="`${msgInfo.customMsgId}-${i}`"
                :is="slot.kind === 'video' ? Poster : Picture"
                :msg-info="msgInfo"
                :url="slot.kind === 'video' ? slot.videoUrl : slot.url"
                :thumb-url="slot.thumbUrl"
                :video-url="slot.videoUrl"
                :slot-index="i"
                :persist-adapter="persistAdapter"
                @rightClick="(payload) => $emit('rightClick', payload)"
            />
        </div>
        <div v-if="caption" class="caption">{{ caption }}</div>
    </div>
</template>

<script>
// 伪代码：本期不引用
import Picture from './Picture.vue';
import Poster from './Poster.vue';
// 真正落地时调 utils/mediasCaptionParser.parseMediasCaptionContent(content) 拿到 slot 数组
// import { parseMediasCaptionContent } from '@/utils/mediasCaptionParser';

export default {
    name: 'MediaCaption',
    components: { Picture, Poster },
    props: {
        msgInfo: { type: Object, required: true },
        // persistAdapter 由调用方按消息会话 (channel/group/friend) 单例创建后透传
        persistAdapter: { type: Object, default: null },
    },
    computed: {
        // pseudocode：实际从 msgInfo.content 解析；解析器单测覆盖
        parsed() {
            // return parseMediasCaptionContent(this.msgInfo.content);
            return { slots: [], caption: '' };
        },
        slots()   { return this.parsed.slots; },
        caption() { return this.parsed.caption; },
        cols()    { return Math.min(3, Math.max(1, this.slots.length)); },
        gridStyle() {
            return {
                display: 'grid',
                gridTemplateColumns: `repeat(${this.cols}, 1fr)`,
                gap: '4px',
            };
        },
    },
};
</script>

<style scoped>
.com-media-caption { padding: 4px; }
.caption { margin-top: 6px; color: #333; }
</style>
