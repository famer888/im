<template>
  <div class="comMsgMediasCaption" @click.right="(e) => $emit('rightClick', { e, info: msgInfo })">
    <slot></slot>
    <div class="media-grid">
      <div
        v-for="(item, index) in mediaItems"
        :key="index"
        class="media-cell"
      >
        <ComMsgImage
          :msgInfo="item"
          :chatContent="chatContent"
          @rightClick="(value) => $emit('rightClick', value)"
        />
      </div>
    </div>
    <div v-if="caption" class="caption-text">{{ caption }}</div>
  </div>
</template>

<script>
export default {
  props: ["msgInfo", "chatContent"],
  components: {
    ComMsgImage: () => import("./image.vue"),
  },
  data() {
    return {
      testVideoData: {
        width: 480,
        height: 640,
        fileSize: "595726",
        url: "https://xpz-xire86.oss-cn-hongkong.aliyuncs.com/test/chat/video/202603/23/39cb7f0fbae588b3545d538622624a68.mp4",
        thumbUrl: "https://xpz-xire86.oss-cn-hongkong.aliyuncs.com/test/chat/pic/202603/23/89cb525dd466e17d54285d135cb28274.jpg",
        duration: 3,
      },
    };
  },
  computed: {
    caption() {
      return this.msgInfo?.caption || "";
    },
    mediaItems() {
      const base = this.testVideoData;
      return Array.from({ length: 8 }, (_, i) => ({
        ...this.msgInfo,
        chatType: 3,
        content: `${base.url}*P${base.thumbUrl}||${base.duration}||${base.fileSize}||${base.width}||${base.height}`,
        local: base.thumbUrl,
        localThumbUrl: base.thumbUrl,
        width: base.width,
        height: base.height,
        fileSize: base.fileSize,
        thumbUrl: base.thumbUrl,
        duration: base.duration,
        customMsgId: `${this.msgInfo?.customMsgId || "media"}-${i}`,
        MsgID: this.msgInfo?.MsgID,
      }));
    },
  },
};
</script>

<style scoped lang="scss">
.comMsgMediasCaption {
  max-width: 408px;
  padding-bottom: 25px;

  .media-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    background: #fff;
    border-radius: 10px;
    padding: 4px;
    overflow: hidden;
  }

  .media-cell {
    position: relative;
    aspect-ratio: 1 / 1;
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
