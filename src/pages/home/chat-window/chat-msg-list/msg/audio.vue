<template>
  <div
    :class="{ comMstAudio: true, bg: msgInfo.quoteMessage !== undefined }"
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div class="content">
      <audio
        v-if="msgInfo.local"
        :src="toLocalResourceUrl(msgInfo.local)"
        :controls="true"
      />
      <template v-else>
        <audio :controls="true" />
        <div>
          <div><ComLoading /></div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import { remote, ipcRenderer, toLocalResourceUrl } from "@/platform";

// 工具
import { getFileSuffix } from "@/utils/base";
import { getOssFirstNormalUrl, resolveOssChannelType } from "@/utils/trendsDomain/manageOssDownUpload";

// 控件
import ComLoading from "@/components/com-loading";

// 事件
import eventCommon from "@/event/common";

export default {
  components: {
    ComLoading,
  },
  props: ["msgInfo", "chatContent"],
  mounted() {
    // 图片文件下载
    const { local } = this.msgInfo;
    if (!local) {
      // 下载文件
      this.handleFileDownload();
    }
  },
  methods: {
    toLocalResourceUrl,
    /**
     * 下载文件
     */
    async handleFileDownload() {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      const { content, chatType, msgType, MsgID, fileKey, customMsgId } =
        this.msgInfo;

      // 文件路径
      const fileUrl = content.split("||")[0];

      // 后缀名
      const suffix = getFileSuffix(chatType, fileUrl);

      // 文件名
      const fileName = fileUrl.slice(fileUrl.lastIndexOf("/") + 1) + suffix;

      const channelType = resolveOssChannelType(this.msgInfo);
      const trendsFileUrl = await getOssFirstNormalUrl(fileUrl, channelType);

      ipcRenderer.send("fileDownload", {
        fileUrl,
        trendsFileUrl,
        fileName,
        uid: loginId,
        userId: this.chatContent.type === "friend" ? this.chatContent.id : null,
        groupId: this.chatContent.type === "group" ? this.chatContent.id : null,
        channelId: this.chatContent.type === "channel" ? this.chatContent.id : null,
        windowId: remote.getCurrentWindow().getMediaSourceId(),
        msgId: MsgID,
        fileKey,
        chatType,
        sendTime: this.msgInfo.sendTime,
        customMsgId,
        channelType,
        isOpen: false,
      });
    },
  },
};
</script>
<style scoped lang="scss">
.comMstAudio {
  padding: 5px 0 25px;
  position: relative;

  &.bg {
    background: #fff;
    border: 1px solid #f2efef;
    padding: 10px 10px 25px;
    border-radius: 10px;
  }

  .content {
    height: 54px;
    position: relative;

    > div {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba($color: #fff, $alpha: 0.4);
      z-index: 1;

      > div {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);

        > .comLoading {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}
</style>