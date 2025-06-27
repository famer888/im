<template>
  <div
    :class="{
      comNetworkTips: true,
      error: networkStatusType !== 'socketLogin',
    }"
  >
    <template v-if="networkStatusType === 'socketLogin'">
      <img src="@/assets/images/message/lock.png" />
      {{ $t("此对话中的信息和通话已经进行端对端加密") }}
    </template>
    <template v-else-if="networkStatusType === 'socketLoginout'">
      <img src="@/assets/images/message/wrang-icon.png" />
      {{ $t("连接通讯中") }}
    </template>
    <template v-else>
      <img src="@/assets/images/message/wrang-icon.png" />
      {{ $t("当前网络异常，请检查网络设置") }}
    </template>
  </div>
</template>
<script>
// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  data() {
    return {
      networkStatusType: "socketLoginout",
    };
  },
  mounted() {
    // 初始化 网络状态类型
    this.networkStatusType = eventCommon.fnNetworkStatusTypeRU();

    // 监听获取，网络提示变化
    eventBase.fnCommunicationMonitoring(
      "networkTips",
      [
        "network", // 好友信息更新
      ],
      ({ networkStatusType }) => {
        this.networkStatusType = networkStatusType;
      }
    );
  },
};
</script>

<style scoped lang="scss">
.comNetworkTips {
  font-size: 12px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  position: absolute;
  left: 0;
  right: 0;
  top: 83px;
  z-index: 9;
  background: #fbfbfb;

  > img {
    display: block;
    width: 12px;
    height: 12px;
    margin-right: 3px;
  }

  &.error {
    background: #fddcde;
    color: #f44e5a;

    > img {
      width: 16px;
      height: 16px;
      margin-right: 12px;
    }
  }
}
</style>