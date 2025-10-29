<template>
  <div class="comChannelDialog">
    <div>
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
       <ComTextAvatar 
          class="textAvatar" 
          :id="info.channelId"
          :value="info.channelName"
        />
      <span>{{ info.channelName }}</span>
      <p class="text-clamp-2">{{ info.remark }}</p>
      <button  @click="handleJoinChannel">
        加入频道
      </button>
    </div>
  </div>
</template>
<script>
import { subscribeChannel } from "@/api/imChannel";

// 事件
import eventBase from "@/event/base";
import eventChannel from "@/event/channel";

import ComTextAvatar from '@/components/text-avatar';

export default {
  props: ["info", "chatContent"],
  components: { ComTextAvatar },
  data() {
    return {
      memberCountRemark: "",
    };
  },
  mounted() {
  },
  methods: {
    /**
     * 申请加入频道
     */
   handleJoinChannel() {
      const { channelId, link, channelName, logoColor } = this.info

      subscribeChannel({
        channelId,
        link,
      }).then(async (res) => {
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
              content: '您加入了该频道'
           })
          this.handleClose();
        }
      }).catch(err => {
        console.error(err)
        window.$toast("加入频道失败");
      });
    },
    /**
     * 关闭
     */
    handleClose() {
      console.log("handleClose--")
        eventBase.fnCommunicationSendMsg({
            operator: "closeOperator",
            data: {
                ids: ["channelDialog"],
            },
        });
    },
  },
};
</script>

<style scoped lang="scss">
.comChannelDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  > div {
    width: 400px;
    min-height: 236px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding-top: 26px;
    position: relative;

    > picture {
      position: absolute;
      right: 0;
      top: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }

      > img {
        display: block;
      }
    }

    > img {
      width: 62px;
      height: 62px;
      border-radius: 99px;
    }

    > span {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-top: 10px;
    }

    > p {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
      padding: 0 10px;
      box-sizing: border-box;
    }

    > button {
      width: 206px;
      height: 32px;
      background: #3369fe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      border-radius: 4px;
      margin-top: 32px;
      border: 0;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
  .textAvatar {
    width: 50px;
    height: 50px;
    font-size: 16px;
  }
}
</style>