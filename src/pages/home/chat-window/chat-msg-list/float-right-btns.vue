<template>
  <div class="comFloatRightBtns">
    <button v-if="atMeIds.length > 0" class="atBtn" @click="$emit('clickToAt')">
      <span>{{ atMeIds.length }}</span>
      @
    </button>
    <button v-if="btnToBottomVisible" @click="$emit('clickToBottom')">
      <span v-if="unreadCount > 0">{{ unreadCount }}</span>
      <img src="@/assets/images/message/arrow-down.png" />
    </button>
  </div>
</template>
<script>
export default {
  props: ["atMeIds", "btnToBottomVisible", "unreadCount"],
};
</script>
<style scoped lang="scss">
.comFloatRightBtns {
  position: relative;

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