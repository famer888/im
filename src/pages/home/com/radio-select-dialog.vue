<template>
  <div class="radioSelectDialog">
    <div>
      <img
        @click="$emit('submit', -1)"
        src="@/assets/images/common/close-icon.png"
      />
      <h1 v-if="title">{{ title }}</h1>
      <ul v-if="radioTextList">
        <li
          v-for="(item, index) in radioTextList"
          :key="index"
          :class="{ active: indexActive === index }"
          @click="indexActive = index"
        >
          <img src="@/assets/images/message/checkBox.png" />
          <img src="@/assets/images/message/checkBoxed.png" />
          {{ item }}
        </li>
      </ul>
      <div>
        <button @click="$emit('submit', indexActive)">
          {{ $t("确定") }}
        </button>
        <button @click="$emit('submit', -1)">
          {{ $t("取消") }}
        </button>
      </div>
    </div>
  </div>
</template>
<script>
// 事件
import eventBase from "@/event/base";

export default {
  props: ["title", "radioTextList"],
  data() {
    return {
      indexActive: 0,
    };
  },
  mounted() {
    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "radioSelectDialog",
      ["keydown"],
      this.eventHandling
    );
  },
  beforeDestroy() {
    // 移除监听 移除通信事件的监听机制
    eventBase.fnCommunicationMonitoring("radioSelectDialog", null);
  },
  methods: {
    /**
     * 处理事件
     */
    eventHandling(info) {
      const { key } = info;

      switch (key) {
        case "ArrowDown": {
          // 下移
          if (this.indexActive < this.radioTextList.length) {
            this.indexActive++;
          }
          break;
        }
        case "ArrowUp": {
          // 上移
          if (this.indexActive > 0) {
            this.indexActive--;
          }
          break;
        }
        case "Enter": {
          // 确认
          this.$emit("submit", this.indexActive);
          break;
        }
        default:
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.radioSelectDialog {
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
      position: absolute;
      left: 15px;
      top: 0;
      height: 30px;
      line-height: 30px;
      margin: 0;
      padding: 0;
      font-size: 14px;
      font-weight: 400;
      color: #f44e5a;
    }

    > ul {
      padding: 0;
      margin: 20 0;

      > li {
        height: 25px;
        display: flex;
        align-items: center;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }

        &.active {
          > img {
            &:nth-child(1) {
              display: none;
            }
            &:nth-child(2) {
              display: block;
            }
          }
        }

        > img {
          display: block;
          width: 16px;
          height: 16px;
          margin-right: 8px;

          &:nth-child(2) {
            display: none;
          }
        }
      }
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