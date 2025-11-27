<template>
  <div class="comSend">
    <div v-if="chatContent.type === 'channel' && chatContent.isDisable" class="shutupTip disable">
        <img class="disabled-icon" src="@/assets/images/chat/disabled-1.png" alt="">{{ $t("该频道已禁用") }}
    </div>
    <div class="shutupTip disable channel-disable"
        v-else-if="chatContent.type === 'channel' && chatContent.memberType === 0"
        @click="handleJoinChannel"
    >
        加入频道
    </div>
    <div class="shutupTip disable channel-disable"
        v-else-if="chatContent.type === 'channel' && (!chatContent.adminPrivacy || !hasPublishMessageAuthority)"
        @click="channelDisturbSet"
    >
        {{ (chatContent.isDisturb) ? '永久静音' : '接收通知' }}
    </div>
    <div
      v-else-if="(chatContent.bfShutup && chatContent.memberType > 1) || chatContent.isDisable"
      class="shutupTip disable"
    >
     <img class="disabled-icon" src="@/assets/images/chat/disabled-1.png" alt=""> {{chatContent.isDisable ? $t("该群已禁用") : $t("全员禁言中")}}
    </div>
    <ComEditor
      v-else
      inputId="sendMessageInput"
      :key="groupMemberUpdateNum"
      :isLeader="chatContent.memberType < 2"
      :chatContent="chatContent"
      :quoteInfo="quoteInfo"
      :editInfo="editInfo"
    />
    <ComForwardInfo
      v-if="
        chatContent.forwardMessageList &&
        chatContent.forwardMessageList.length > 0
      "
      :forwardMessageList="chatContent.forwardMessageList"
    />
    <ComReplyInfo v-if="quoteInfo" :msgInfo="quoteInfo" />
  </div>
</template>
<script>

// 事件
import eventBase from "@/event/base";
import eventChannel from '@/event/channel';

// 控件
import ComEditor from "./editor.vue";

// api
import { updateMember, subscribeChannel } from "@/api/imChannel.js"

export default {
  components: {
    ComEditor,
    ComForwardInfo: () => import("./forward-info.vue"),
    ComReplyInfo: () => import("./quote-info.vue"),
  },
  props: ["chatContent", "quoteInfo", "groupMemberUpdateNum", "editInfo"],
  computed: {
    /**
     * 判断是否有发布消息权限
     * adminPrivacy & 2 (bit 1) 表示发布消息权限
     */
    hasPublishMessageAuthority() {
      const adminPrivacy = this.chatContent?.adminPrivacy;
      if (!adminPrivacy) return false;
      return (adminPrivacy & 2) !== 0;
    }
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("comSend", null);
  },
  mounted() {
    // console.log(this.getRandomColor(), '>>>>>>>>>> getRandomColor')
  },
  methods: {
       /**
     * 申请加入频道
     */
   handleJoinChannel() {
      const { channelId, link, channelName, logoColor } = this.chatContent

      subscribeChannel({
        channelId,
        link,
      }).then(async (res) => {
        console.log('subscribeChannel--', res)
        if (res?.code != 200) {
          window.$toast(res?.msg || "加入频道失败");
        } else {
          // 关闭
          window.$toast(res?.msg || "加入频道成功");
           await eventChannel.fnChannelAdd(this.info);
           eventChannel.fnChannelAddMessageNotification({
              channelName,
              logoColor,
              channelId,
              content: '您已加入频道'
           })
           setTimeout(() => {
              this.goChannelChatWindow(this.chatContent)
           }, 200)
        }
      }).catch(err => {
        console.error(err)
        window.$toast("加入频道失败");
      });
    },
    // 跳转频道聊天窗
    goChannelChatWindow(info) {
      const data = {
        ...info,
        id: info.channelId,
        name: info.channelName,
        type: 'channel',
        comType: 'detailsChannel',
      }

      eventBase.fnCommunicationSendMsg({
        operator: 'activeChange',
        data,
      })
    },
    // 频道免打扰设置
    channelDisturbSet() {
      const { channelId, isDisturb } = this.chatContent
      const params = {
        channelId,
        isDisturb: Number(!isDisturb),
      }
      updateMember(params).then(res => {
        if(res?.code === 200) {
           eventBase.fnCommunicationSendMsg({
            operator: "channelDisturbSet",
            data: {
              id: channelId,
              isDisturb: params.isDisturb,
              type: "channel"
            },
          });
        }
      })
    },
    // 取限定范围随机数
    getRandomNum(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    // 获取随机颜色
    getRandomColor() {
      const r = this.getRandomNum(0, 255);
      const g = this.getRandomNum(0, 255);
      const b = this.getRandomNum(0, 255);
      return `rgb(${r}, ${g}, ${b})`;
    },
  },
};
</script>
<style scoped lang="scss">
.comSend {
  position: relative;

  .shutupTip {
    display: flex;
    justify-content: center;
    padding: 10px 0;
    color: #da2e2e;
    background: #ffffff;
  }
  .disable{
    color: #000;
  }
  .disabled-icon{
    width: 16px;
    height: 16px;
    margin-right: 5px;
    margin-top: 1px;
  }
  .channel-disable {
    color: #178AFF;
    cursor: pointer;
  }
}
</style>
