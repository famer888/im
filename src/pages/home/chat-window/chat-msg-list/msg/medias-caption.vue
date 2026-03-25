<template>
  <div class="comMsgMediasCaption" @click.right="(e) => $emit('rightClick', { e, info: msgInfo })">
    <slot></slot>
    <div class="media-grid">
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
const CAPTION_SEP = "##caption##";

/**
 * 与 encryption-decryption.js mediasCaption 分支写入格式一致：
 * image:url||thumb||fileSize||sizeType ||| video:url*Pthumb||duration||fileSize||w||h ||| gif:url||url
 * 末尾可选 ##caption## 文字
 */
function stripMediasCaptionRefSuffix(tail) {
  if (!tail) return "";
  const idx = tail.indexOf("-||-type:");
  return (idx < 0 ? tail : tail.slice(0, idx)).trim();
}

/** 无 ##caption## 时，引用信息会拼在整个 content 末尾，需从媒体段之前去掉 */
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

/** 父消息体顶层 local_i / thumb_i / percent_i（percent 与 image.vue 中 watch msgInfo.percent 一致） */
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
      const mainUrl = p[0] || "";
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
      const url = meta[0] || "";
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

/** 视频/媒体传输 FIFO 队列：最多 concurrency 个并发，完成一个再补一个 */
function createMediaTransferQueue(concurrency = 3) {
  let active = 0;
  const waiting = [];
  return {
    acquire() {
      return new Promise((resolve) => {
        const grant = () => {
          active++;
          resolve(() => {
            active--;
            const next = waiting.shift();
            if (next) next();
          });
        };
        if (active < concurrency) {
          grant();
        } else {
          waiting.push(grant);
        }
      });
    },
  };
}

export default {
  props: ["msgInfo", "chatContent"],
  components: {
    MediasCaptionCell: () => import("./medias-caption-cell.vue"),
  },
  created() {
    this._mediaQueue = createMediaTransferQueue(3);
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
    grid-template-columns: repeat(3, 100px);
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
