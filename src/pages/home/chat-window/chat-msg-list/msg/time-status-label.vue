<template>
  <div class="comTimeStatusLabel">
    <span>
      {{ formatTimeStamp(msgInfo.sendTime) }}
    </span>
    <ComLoading v-if="msgInfo.readStatus === -1" />
    <div class="tips" v-else-if="msgInfo.isSelf">
      <i v-if="msgInfo.readStatus === 0" @click="handleReSend">!</i>
      <img
        v-if="msgInfo.readStatus === 1 && chatContent.type === 'group'"
        src="@/assets/images/message/has-resive.png"
      />
      <img
        v-else-if="msgInfo.readStatus === 1"
        src="@/assets/images/message/has-send.png"
      />
      <img
        v-else-if="msgInfo.readStatus === 2"
        src="@/assets/images/message/has-read.png"
      />
    </div>
  </div>
</template>
<script>
import ComLoading from "@/components/com-loading";
import i18n from "@/assets/lang/i18n";
import { getFileInfo } from "@/utils/fileTools";

// 事件
import eventBase from "@/event/base";
import eventMsg from "@/event/msg";

export default {
  components: { ComLoading },
  props: ["msgInfo", "chatContent"],
  mounted() {
    // 如果信息发送中，添加对应处理超时的列表
    if (this.msgInfo.readStatus === -1) {
      eventMsg.fnSendingInfoListAdd({
        id: this.chatContent.id,
        type: this.chatContent.type,
        customMsgId: this.msgInfo.customMsgId,
        sendTime: this.msgInfo.sendTime,
      });
    }
  },
  methods: {
    /**
     * 格式化时间
     */
    formatTimeStamp(timestamp) {
      const date = new Date(Number(timestamp));
      // 获取小时数（0-23）
      const hours = date.getHours();
      // 将小时数转换为12小时制（如果小时数大于12，则减去12）
      const hour12 = hours % 12 || 12; // 使用逻辑或确保0小时变为12小时
      const minutes = date.getMinutes().toString().padStart(2, "0"); // 确保分钟数是两位数
      const isChina = ["zh", "zh-tw", "zh-cn"].includes(i18n.locale);
      let lang = isChina ? ["上午", "下午"] : ["AM", "PM"];
      const ampm = hours < 12 ? lang[0] : lang[1];
      return isChina
        ? `${ampm} ${hour12}:${minutes}`
        : `${hour12}:${minutes} ${ampm} `;
    },
    /**
     * 消息重新发送
     */
    handleReSend() {
      let type = "text";
      const { chatType } = this.msgInfo;

      let values = {
        chatType,
      };

      let file = null;

      if (chatType === 0) {
        values.content = this.msgInfo.content;
      } else if (chatType === 12) {
        type = "dice";
        values.msgType = 12;
      }  else if (chatType === 18) {
        type = "poker";
        values.msgType = 18;
      } else {
        type = "file";
        file = getFileInfo(this.msgInfo.local);
      }

      eventBase.fnCommunicationSendMsg({
        operator: "msgDelete",
        data: {
          id: this.chatContent.id,
          type: this.chatContent.type,
          idsDelete: [
            {
              customMsgId: this.msgInfo.customMsgId,
            },
          ],
        },
      });

      setTimeout(() => {
        eventBase.fnCommunicationSendMsg({
          operator: "msgResend",
          data: {
            id: this.chatContent.id,
            type: this.chatContent.type,
            quoteInfo: this.msgInfo.quoteInfo,
            list: [
              {
                type,
                values,
                file,
              },
            ],
          },
        });
      }, 100);
    },
  },
};
</script>
<style scoped lang="scss">
.comTimeStatusLabel {
  position: absolute;
  right: 8px;
  bottom: 8px;
  bottom: 2px;
  display: flex;
  align-items: center;
  z-index: 1;

  > span {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }

  > .tips {
    display: flex;
    width: 16px;
    align-items: center;
    margin-left: 6px;

    > img {
      height: 16px;
    }

    > i {
      color: red;
      font-family: cursive;
      font-style: normal;
      width: 16px;
      height: 16px;
      line-height: 16px;
      text-align: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>