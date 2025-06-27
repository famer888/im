<template>
  <div class="rcheduleDeletionConfigDialog" @click.stop>
    <div>
      <picture @click.stop="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <h2 style="font-size: 14px;">{{ $t("设置消息已读后销毁时间") }}</h2>
      <scroll-picker :options="rcheduleDeletionTimeList" v-model="timeActive" />
      <div class="footer">
        <div
          class="button-cancel"
          @click="handleRcheduleDeletionConfig({ bfReadCancel: false })"
        >
          {{ $t("关闭") }}
        </div>
        <div class="right">
          <div class="button-cancel" @click="handleClose">{{ $t("取消") }}</div>
          <div
            class="button-submit"
            @click="
              handleRcheduleDeletionConfig({
                msgCancelTime: timeActive,
              })
            "
          >
            {{ $t("保存") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from "lodash";
import { ScrollPicker, ScrollPickerGroup } from "vue-scroll-picker";
import "vue-scroll-picker/dist/style.css";

// 工具
import { rcheduleDeletionTimeList } from "@/utils/widget";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  components: { ScrollPicker, ScrollPickerGroup },
  props: ["isGroup", "msgCancelTime", "chatContent"],
  data() {
    return {
      timeActive: this.msgCancelTime || 30,
      rcheduleDeletionTimeList, // 定时删除时间列表
    };
  },
  mounted() {
    eventCommon.fnCommonInfoRU({
      getId: "infoActive",
    });
  },
  methods: {
    /**
     * 关闭会话框
     */
    handleClose() {
      // 移除 阅后即焚配置对话框
      eventCommon.fnCloseListRU({
        removeIds: ["rcheduleDeletionConfigDialog"]
      });
    },
    /**
     * 阅后即焚 配置
     */
    handleRcheduleDeletionConfig({ bfReadCancel, msgCancelTime }) {
      const { id, type } = this.chatContent;

      // 改变是否开启
      if (bfReadCancel !== undefined) {
        this.bfReadCancel = bfReadCancel;
      }

      // 改变时间
      if (msgCancelTime) {
        // this.msgCancelTime = msgCancelTime;
        // this.$emit('changemsgCancelTime', msgCancelTime)
      }
      this.handleClose()
      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "rcheduleDeletionSet",
        data: {
          id,
          type,
          bfReadCancel,
          msgCancelTime,
        },
      });
    },
  },
};
</script>


<style scoped lang="scss">
.rcheduleDeletionConfigDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: rgba($color: #000000, $alpha: 0.2);

  > div {
    background: #fff;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 10px 16px;
    border-radius: 8px;
    width: 400px;
    box-sizing: border-box;

    > picture {
      position: absolute;
      top: 0;
      right: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }

    > .top {
      height: 100px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #eee;
      margin-bottom: 15px;

      > img {
        display: block;
        height: 60px;
        width: 60px;
        border-radius: 50%;
        margin-right: 20px;
      }

      > h2 {
        display: block;
        margin: 0;
        padding: 0 1em 0 0;
        line-height: 30px;
        font-size: 16px;
        font-weight: 600;
        max-height: 90px;
        overflow: hidden;
        word-break: break-word;
      }
    }

    .read-burn-list {
      width: 100%;
      height: 200px;
      padding: 0;
      margin: 0;
      overflow: auto;

      li {
        width: 100%;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999999;
        cursor: pointer;
      }

      .select-active {
        color: #000;
        border-top: 1px solid #178aff;
        border-bottom: 1px solid #178aff;
      }
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 20px;

      .right {
        display: flex;
        align-items: center;
      }

      .button-cancel,
      .button-submit {
        width: 52px;
        height: 24px;
        background: #d5d6da;
        color: #ffffff;
        font-size: 14px;
        text-align: center;
        line-height: 24px;
        border-radius: 4px;
        cursor: pointer;
      }

      .button-submit {
        background: #178aff;
        margin-left: 10px;
      }
    }
  }
}
</style>

<style >
.vue-scroll-picker-layer .top,
.bottom {
  height: calc(50% - 0.7em) !important;
}
</style>
