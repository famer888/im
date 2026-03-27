<template>
  <div class="comFloatRightBtns">
    <button v-if="atMeIds.length > 0" class="atBtn" @click="$emit('clickToAt')">
      <span>{{ atMeIds.length }}</span>
      @
    </button>
    <div v-if="initialUnreadCount > 0" class="unreadTipsBtn" @click="$emit('clickToUnread')">
      <img class="arrow-up" src="@/assets/images/message/arrow-up-double-line.png" />
      <span>{{ initialUnreadCount > 99 ? '99+' : initialUnreadCount }}</span>{{ $t("条未读消息") }}
    </div>
    <button v-if="btnToBottomVisible" @click="handleBottomClick">
      <span v-if="unreadCount > 0 && initialUnreadCount <= 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      <img src="@/assets/images/message/arrow-down.png" />
    </button>
  </div>
</template>
<script>
export default {
  props: ["atMeIds", "btnToBottomVisible", "unreadCount", "initialUnreadCount"],
  methods: {
    handleBottomClick() {
      // 如果没有初始未读（不是上箭头情况），且有新消息未读数，则触发跳到新消息锚点
      if (this.initialUnreadCount <= 0 && this.unreadCount > 0) {
        this.$emit('clickToNewMsg');
      } else {
        // 否则直接置底
        this.$emit('clickToBottom');
      }
    }
  }
};
</script>
<style scoped lang="scss">
.comFloatRightBtns {
  position: relative;

  .unreadTipsBtn {
    position: absolute;
    right: 0px;
    top: -155px;
    height: 32px;
    line-height: 32px;
    padding: 0 12px;
    background: #1681ef;
    border: 1px solid #e5e5e5;
    border-radius: 16px 0 0 16px;
    font-size: 12px;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 2;
    display: flex;
    align-items: center;

    &:hover {
      background: #327cc5;
    }

    > span {
      margin:0 4px;
      font-size: 12px;
      color: #fff;
    }

    > div {
      font-size: 12px;
      color: #fff;
      margin-bottom: 4px;
    }

    > img {
      width: 16px;
    }
  }

  > button {
    position: absolute;
    right: 10px;
    top: -50px;
    width: 40px;
    height: 40px;
    border: 1px solid #e5e5e5;
    border-radius: 99px;
    cursor: pointer;
    background: #fff;
    z-index: 2;

    &.atBtn {
      top: -105px;
      color: #999;

      &:hover {
        color: #666;
      }
    }

    &:hover {
      > img {
        opacity: 0.8;
      }
    }

    > img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      height: 8px;
    }

    > span {
      position: absolute;
      background: #178aff;
      color: #fff;
      font-size: 12px;
      height: 20px;
      line-height: 20px;
      border-radius: 20px;
      padding: 0 7px;
      left: 50%;
      top: -10px;
      transform: translateX(-50%);
      white-space: nowrap;
      display: block;
    }
  }
}
</style>
