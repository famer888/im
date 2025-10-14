<template>
  <div class="confirm">
    <div>
      <img
        @click="callback(false)"
        src="@/assets/images/common/close-icon.png"
      />
      <h1 v-if="title">{{ title }}</h1>
      <p v-if="remark">{{ remark }}</p>
      <div>
        <button @click="callback(false)">
          {{ cancelBtnTitle }}
        </button>
        <button @click="callback(true)">
          {{ btnTitleCenter || centerBtnTitle }}
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import i18n from "@/assets/lang/i18n";

// 事件
import eventBase from "@/event/base";

export default {
  props: ["title", "remark", "callback", "btnTitleCenter"],
  data() {
    return {
      cancelBtnTitle: i18n.t("取消"),
      centerBtnTitle: i18n.t("确定"),
    };
  },
  mounted() {
    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring("confirm", ["keydown"], ({ key }) => {
      switch (key) {
        case "Escape": {
          // 关闭
          this.callback(false);
          break;
        }
        case "Enter": {
          // 确认
          this.callback(true);
          break;
        }
        default:
      }
    });
  },
  beforeDestroy() {
    // 移除监听 移除通信事件的监听机制
    eventBase.fnCommunicationMonitoring("confirm", null);
  },
};
</script>
<style scoped lang="scss">
.confirm {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 999;

  > div {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 300px;
    background-color: #fff;
    transform: translate(-50%, -50%);
    padding: 20px 16px 10px;
    border-radius: 8px;
    font-size: 12px;

    > img {
      position: absolute;
      right: 10px;
      top: 10px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }

    > h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 400;
      color: #000000;
    }

    > p {
      padding: 10px 0 5px;
      color: #999999;
      font-size: 14px;
      text-align: center;
      line-height: 20px;
      word-wrap: break-word;
    }

    > div {
      margin-top: 16px;
      display: flex;
      justify-content: center;

      > button {
        display: block;
        padding: 0 13px;
        height: 24px;
        line-height: 24px;
        background: #178AFF;
        color: #ffffff;
        cursor: pointer;
        width: 100%;
        height: 32px;
        border-radius: 6px;
        border: none;

        &:first-child {
        background-color: #9197AD;
          margin-right: 10px;
        }
      }
    }
  }
}
</style>
