<template>
  <div class="network-tips-bar">
    <div
      :class="{
        comNetworkTips: true,
        error: networkStatusType !== 'socketLogin',
        'comNetworkTips--action': networkStatusType !== 'socketLogin',
      }"
      role="presentation"
      @click="onTipsBarClick"
    >
      <template v-if="networkStatusType === 'socketLogin'">
        <img src="@/assets/images/message/lock.png" />
        {{ $t("此对话中的信息和通话已经进行端对端加密") }}
      </template>
      <template v-else-if="networkStatusType === 'socketLoginout'">
        <img src="@/assets/images/message/wrang-icon.png" />
        <span class="network-tips__main">{{ $t("连接通讯中") }}</span>
        <span class="network-tips__hint">[{{ $t("点击进行网络检测") }}]</span>
      </template>
      <template v-else>
        <img src="@/assets/images/message/wrang-icon.png" />
        <span class="network-tips__main">{{ $t("当前网络异常，请检查网络设置") }}</span>
        <span class="network-tips__hint">[{{ $t("点击进行网络检测") }}]</span>
      </template>
    </div>
  </div>
</template>
<script>
import eventBase from "@/event/base";
import analyst from "@/socket/analyst";
import eventCommon from "@/event/common";

export default {
  data() {
    return {
      networkStatusType: "socketLoginout",
    };
  },
  methods: {
    onTipsBarClick() {
      if (this.networkStatusType === "socketLogin") return;
      analyst.openPanel();
      this.$nextTick(() => analyst.runDiagnostics());
    },
    mountAnalystUi() {
      const root = typeof document !== "undefined" && document.getElementById("app");
      if (root) analyst.mountTrigger(root, { showTrigger: false });
    },
  },
  watch: {
    networkStatusType(v) {
      if (v === "socketLogin") {
        analyst.unmountTrigger();
      } else {
        this.$nextTick(() => this.mountAnalystUi());
      }
    },
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

    this.$nextTick(() => {
      if (this.networkStatusType !== "socketLogin") this.mountAnalystUi();
    });
  },
  beforeDestroy() {
    analyst.unmountTrigger();
  },
};
</script>

<style scoped lang="scss">
.network-tips-bar {
  display: flex;
  align-items: stretch;
  min-height: 32px;
  z-index: 9;
  background: #f6f6f6;

  .comNetworkTips {
    flex: 1;
    min-width: 0;
  }

  .comNetworkTips.error {
    background: #fddcde;
  }

  .comNetworkTips--action {
    cursor: pointer;
    user-select: none;
  }
}

.network-tips__hint {
  margin-left: 4px;
  font-size: 10px;
  text-decoration: underline;
  vertical-align: baseline;
}

.comNetworkTips {
  font-size: 12px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  left: 0;
  right: 0;
  top: 83px;

  > img {
    display: block;
    width: 12px;
    height: 12px;
    margin-right: 3px;
  }

  &.error {
    color: #f44e5a;

    > img {
      width: 16px;
      height: 16px;
      margin-right: 12px;
    }
  }
}
</style>
