<template>
  <div class="comMsgMediasCaption" @click.right="(e) => $emit('rightClick', { e, info: msgInfo })">
    <slot></slot>
    <div class="media-grid" :style="{ '--media-grid-cols': mediaGridColumnCount }">
      <div
        v-for="item in mediaItems"
        :key="`${(msgInfo && msgInfo.customMsgId) || 'media'}-${item.mediaSlotIndex}`"
        class="media-cell"
      >
        <MediasCaptionCell
          :item="item"
          :chatContent="chatContent"
          :acquireSlot="waitMediaSlot"
          @rightClick="(value) => $emit('rightClick', value)"
        />
      </div>
    </div>
    <div v-if="caption" class="caption-text">{{ caption }}</div>
  </div>
</template>

<script>
import { createFifoConcurrencyQueue } from "./msg-type-17.js";

const CAPTION_SEP = "##caption##";

function stripMediasCaptionRefSuffix(tail) {
  if (!tail) return "";
  const idx = tail.indexOf("-||-type:");
  return (idx < 0 ? tail : tail.slice(0, idx)).trim();
}

function stripTrailingRefFromMediasBody(body) {
  if (!body) return "";
  const idx = body.indexOf("-||-type:");
  return (idx < 0 ? body : body.slice(0, idx)).trim();
}

function splitMediasCaptionBody(content) {
  if (!content || typeof content !== "string") {
    return { body: "", tailCaption: "" };
  }
  const i = content.indexOf(CAPTION_SEP);
  if (i < 0) {
    return { body: content.trim(), tailCaption: "" };
  }
  return {
    body: content.slice(0, i).trim(),
    tailCaption: stripMediasCaptionRefSuffix(content.slice(i + CAPTION_SEP.length)),
  };
}

function applySlotLocalFromParent(common, msgInfo, i) {
  const lk = `local_${i}`;
  const tk = `thumb_${i}`;
  if (msgInfo && Object.prototype.hasOwnProperty.call(msgInfo, lk)) {
    common.local = msgInfo[lk];
  }
  if (msgInfo && Object.prototype.hasOwnProperty.call(msgInfo, tk)) {
    common.localThumbUrl = msgInfo[tk];
  }
}

function applySlotPercentFromParent(common, msgInfo, i) {
  const pk = `percent_${i}`;
  if (msgInfo && Object.prototype.hasOwnProperty.call(msgInfo, pk)) {
    common.percent = msgInfo[pk];
  }
}

function buildMediaItemsFromContent(msgInfo) {
  const { body: rawBody, tailCaption } = splitMediasCaptionBody(msgInfo?.content || "");
  const body = stripTrailingRefFromMediasBody(rawBody);
  const segments = body ? body.split("|||").map((s) => s.trim()).filter(Boolean) : [];
  const items = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let chatType;
    let contentStr;
    const common = {
      ...msgInfo,
      customMsgId: msgInfo?.customMsgId || "media",
      mediaSlotIndex: i,
      MsgID: msgInfo?.MsgID,
    };
    delete common.content;
    delete common.caption;
    delete common.local;
    delete common.localThumbUrl;
    delete common.percent;
    applySlotLocalFromParent(common, msgInfo, i);
    applySlotPercentFromParent(common, msgInfo, i);

    if (seg.startsWith("video:")) {
      chatType = 3;
      contentStr = seg.slice(6);
      const meta = contentStr.split("||");
      const head = meta[0] || "";
      const p = head.split("*P");
      const thumbUrl = p[1] || "";
      items.push({
        ...common,
        chatType,
        content: contentStr,
        width: Number(meta[3]) || 0,
        height: Number(meta[4]) || 0,
        fileSize: meta[2],
        duration: Number(meta[1]) || 0,
        thumbUrl,
      });
    } else if (seg.startsWith("image:")) {
      chatType = 1;
      contentStr = seg.slice(6);
      const meta = contentStr.split("||");
      const thumbUrl = meta[1] || "";
      items.push({
        ...common,
        chatType,
        content: contentStr,
        fileSize: meta[2],
        thumbUrl: thumbUrl || undefined,
      });
    } else if (seg.startsWith("gif:")) {
      chatType = 9;
      contentStr = seg.slice(4);
      const meta = contentStr.split("||");
      const url = meta[0] || "";
      items.push({
        ...common,
        chatType,
        content: contentStr,
        thumbUrl: url || undefined,
      });
    }
  }
  return { items, tailCaption };
}

export default {
  props: ["msgInfo", "chatContent"],
  components: {
    MediasCaptionCell: () => import("./medias-caption-cell.vue"),
  },
  created() {
    this._mediaQueue = createFifoConcurrencyQueue(3);
  },
  computed: {
    _parsedMediasCaption() {
      return buildMediaItemsFromContent(this.msgInfo);
    },
    caption() {
      const fromMsg = this.msgInfo?.caption;
      if (fromMsg) return fromMsg;
      return this._parsedMediasCaption.tailCaption || "";
    },
    mediaItems() {
      return this._parsedMediasCaption.items;
    },
    /** 每行最多 3 格；总宽度随实际格子列数收缩（1～3 列） */
    mediaGridColumnCount() {
      const n = this.mediaItems.length;
      if (n <= 0) return 1;
      return Math.min(3, n);
    },
  },
  methods: {
    waitMediaSlot() {
      return this._mediaQueue.acquire();
    },
  },
};
</script>

<style scoped lang="scss">
.comMsgMediasCaption {
  position: relative;
  max-width: 408px;
  padding-bottom: 25px;

  .media-grid {
    display: grid;
    grid-template-columns: repeat(var(--media-grid-cols, 3), 100px);
    grid-auto-rows: 100px;
    gap: 4px;
    width: fit-content;
    box-sizing: border-box;
    background: #fff;
    border-radius: 10px;
    padding: 4px;
    overflow: hidden;
  }

  .media-cell {
    position: relative;
    width: 100px;
    height: 100px;
    box-sizing: border-box;
    background: #e8e8e8;
    overflow: hidden;
    border-radius: 4px;

    &::v-deep .comMsgImage {
      max-width: unset;
      min-width: unset;
      padding-bottom: 0;
      width: 100%;
      height: 100%;

      &:hover {
        opacity: 1;
      }

      > .content {
        width: 100%;
        height: 100%;
        min-width: unset;
        padding: 0;
        border-radius: 0;

        .picture-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .picture {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      }
    }
  }

  .caption-text {
    padding: 6px 8px 0;
    font-size: 14px;
    color: #333;
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
