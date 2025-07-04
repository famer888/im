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
        <button @click="callback(true)">
          {{ centerBtnTitle }}
        </button>
        <button @click="callback(false)">
          {{ cancelBtnTitle }}
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
  props: ["title", "remark", "callback"],
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
      font-size: 12px;
      font-weight: 400;
      color: #666666;
    }

    > p {
      padding: 10px 0 5px;
      color: #333;
      text-align: center;
      line-height: 20px;
    }

    > div {
      margin-top: 0.32rem;
      display: flex;
      justify-content: center;

      > button {
        display: block;
        padding: 0 13px;
        height: 24px;
        line-height: 24px;
        border-radius: 4px;
        background-color: #fff;
        border: 1px solid #eeeeee;
        color: #666666;
        cursor: pointer;

        &:first-child {
          background: #3369fe;
          border: 1px solid #3369fe;
          color: #fff;
          margin-right: 10px;
        }
      }
    }
  }
}
</style>
