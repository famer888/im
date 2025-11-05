<template>
  <div class="comChannelDialog">
    <div>
       <ComTextAvatar
          class="textAvatar"
          :id="info.channelId"
          :value="info.channelName"
        />
      <span>{{ info.channelName }}</span>
      <p class="subscriber-count">{{ info.memberCount || 0 }}位订阅者</p>
      <div class="remark-container">
        <div class="remark-content" ref="remarkContent" :class="{ 'expanded': isRemarkExpanded }">
          {{ info.remark }}
        </div>
        <span class="toggle-btn" v-if="showToggleBtn" @click="toggleRemark">
          {{ isRemarkExpanded ? '折叠' : '更多' }}
        </span>
      </div>
      <div class="button-group" v-if="!info.memberType">
        <button class="cancel-btn" @click="handleClose">取消</button>
        <button class="join-btn" @click="handleJoinChannel">加入频道</button>
      </div>
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
      isRemarkExpanded: false,
      showToggleBtn: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.checkRemarkOverflow();
    });
  },
  watch: {
    'info.remark'() {
      this.$nextTick(() => {
        this.checkRemarkOverflow();
      });
    }
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
    /**
     * 切换remark展开/折叠
     */
    toggleRemark() {
      this.isRemarkExpanded = !this.isRemarkExpanded;
    },
    /**
     * 检测remark是否超过两行
     */
    checkRemarkOverflow() {
      const el = this.$refs.remarkContent;
      if (el) {
        // 暂时移除展开状态来准确检测
        const wasExpanded = this.isRemarkExpanded;
        this.isRemarkExpanded = false;
        this.$nextTick(() => {
          // scrollHeight > clientHeight 表示有内容溢出
          this.showToggleBtn = el.scrollHeight > el.clientHeight;
          // 恢复展开状态
          this.isRemarkExpanded = wasExpanded;
        });
      }
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
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding-top: 26px;
    padding-bottom: 20px;
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

    .subscriber-count {
      font-size: 12px;
      color: #666;
      margin-top: 6px;
    }

    .remark-container {
      width: 100%;
      margin-top: 10px;
      padding: 0 20px;
      box-sizing: border-box;
      position: relative;

      .remark-content {
        font-size: 12px;
        color: #999;
        line-height: 18px;
        height: 90px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 5;
        line-clamp: 5;
        -webkit-box-orient: vertical;
        word-break: break-all;

        &.expanded {
          height: 144px;
          max-height: 144px;
          overflow-y: auto;
          display: block;
          -webkit-line-clamp: unset;
          line-clamp: unset;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-thumb {
            border-radius: 10px;
            background: #e5e5e5;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }
        }
      }

      .toggle-btn {
        position: absolute;
        right: 20px;
        bottom: 0;
        font-size: 12px;
        color: #178aff;
        cursor: pointer;
        user-select: none;
        background: #fff;
        padding-left: 4px;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .button-group {
      width: 100%;
      display: flex;
      margin-top: 20px;
      padding: 0 20px;
      box-sizing: border-box;
      gap: 10px;

      > button {
        flex: 1;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        border-radius: 4px;
        border: 0;
        cursor: pointer;
        font-size: 14px;

        &:hover {
          opacity: 0.8;
        }
      }

      .cancel-btn {
        background: #9197ad;
      }

      .join-btn {
        background: #178aff;
      }
    }
  }
  .textAvatar {
    width: 80px;
    height: 80px;
    font-size: 24px;
  }
}
</style>
