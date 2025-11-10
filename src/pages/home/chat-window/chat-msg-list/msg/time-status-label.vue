<template>
  <div class="comTimeStatusLabel">
    <div class="read" v-if="chatContent.type === 'channel'">
      <img v-if="msgInfo.isSelf" class="read-icon" src="@/assets/images/channel/read1.png" />
      <img v-else class="read-icon" src="@/assets/images/channel/read2.png" />
      <span class="read-num">{{ msgInfo.readTotal }}</span>
    </div>
    <span>
      {{ formatTimeStamp(msgInfo.sendTime) }}
    </span>
    <ComLoading v-if="msgInfo.readStatus === -1" />
    <div class="tips" v-else-if="msgInfo.isSelf">
      <i v-if="msgInfo.readStatus === 0" @click="handleReSend">!</i>
      <!-- <img
        v-if="msgInfo.readStatus === 1 && chatContent.type === 'group'"
        src="@/assets/images/message/has-resive.png"
      /> -->
      <img
        v-else-if="msgInfo.readStatus === 2 || msgInfo.readUsers?.length"
        src="@/assets/images/message/has-read.png"
      />
      <img
        v-else-if="msgInfo.readStatus === 1"
        src="@/assets/images/message/has-send.png"
      />
    </div>
  </div>
</template>
<script>
import ComLoading from "@/components/com-loading";
import i18n from "@/assets/lang/i18n";
import { getFileInfo } from "@/utils/fileTools";
import { formatTimeStamp } from "@/utils/base";

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
    formatTimeStamp,
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
  bottom: 0px;
  display: flex;
  align-items: center;
  z-index: 1;

  .read {
    display: flex;
    align-items: center;
    .read-num {
      font-size: 12px;
      color: #666;
      margin-left: 2px;
    }
    margin-right: 2px;
  }

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