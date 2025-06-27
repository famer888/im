<template>
  <div class="domSettingDialog">
    <div>
      <picture @click="$emit('close')">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <nav>
        <span
          v-for="(item, index) in [
            $t('聊天设置'),
            $t('系统设置'),
            $t('隐私设置'),
            $t('语言设置'),
            $t('异常修复'),
          ]"
          :key="index"
          :class="{ active: index === navIndex }"
          @click="navIndex = index"
        >
          {{ item }}
        </span>
      </nav>
      <section>
        <ComChat v-if="navIndex === 0" />
        <ComSystem v-else-if="navIndex === 1" />
        <ComPrivacy v-else-if="navIndex === 2" />
        <ComLanuage v-else-if="navIndex === 3" />
        <ComRepair v-else-if="navIndex === 4" />
      </section>
    </div>
  </div>
</template>
<script>
// 控件
import ComChat from "./chat.vue";

// 事件
import eventBase from "@/event/base";

export default {
  components: {
    ComChat,
    ComSystem: () => import("./system.vue"),
    ComPrivacy: () => import("./privacy.vue"),
    ComLanuage: () => import("./lanuage.vue"),
    ComRepair: () => import("./repair.vue"),
  },
  data() {
    return {
      navIndex: 0,
      navList: [
        this.$t("聊天设置"),
        this.$t("系统设置"),
        this.$t("隐私设置"),
        this.$t("语言设置"),
        this.$t("异常修复"),
      ],
      accountSettingInfo: null,
    };
  },
  mounted() {
    // 键盘监听
    eventBase.fnCommunicationMonitoring(
      "comSettingDialog",
      ["keydown"],
      ({ key }) => {
        // 如果是退出键，关闭对话框
        if (key === "Escape") {
          this.$emit("close");
        }
      }
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("comSettingDialog", null);
  },
};
</script>
<style lang="scss">
.domSettingDialog {
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
    height: 310px;
    background: #fff;
    border-radius: 8px;
    position: relative;
    display: flex;

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

    > nav {
      border-right: 1px solid #eeeeee;

      > span {
        display: block;
        height: 44px;
        line-height: 44px;
        text-align: center;
        padding: 0 18px;
        font-size: 14px;
        position: relative;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }

        &.active {
          color: #3369fe;

          &:hover {
            opacity: 1;
          }

          &::after {
            display: block;
            content: "";
            position: absolute;
            width: 2px;
            height: 40%;
            background: #3369fe;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
          }
        }
      }
    }

    > section {
      padding: 35px 16px 0 30px;
      width: 353px;

      > div {
        > h3 {
          line-height: 40px;
          color: #999;
          font-size: 14px;
        }

        > dl {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0;
          margin-bottom: 10px;

          > dt {
            font-size: 14px;
            color: #333;
          }

          > dd {
            > .bg,
            > .select {
              padding: 5px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 150px;
              background: #f5f5f5;
              border-radius: 4px;
              position: relative;

              > span {
                font-size: 14px;
                color: #333;
              }

              > img {
                cursor: pointer;
              }
            }

            > .select {
              cursor: pointer;

              &:hover {
                > ul {
                  display: block;
                }
              }

              > ul {
                position: absolute;
                top: 28px;
                left: 0;
                background: #fff;
                z-index: 10;
                margin: 0;
                width: 150px;
                padding: 0;
                box-shadow: 0 20px 60px -2px rgb(27 33 58 / 40%);
                border-radius: 3px;
                display: none;

                > li {
                  line-height: 30px;
                  padding-left: 10px;
                  font-size: 12px;
                  cursor: pointer;
                  border-bottom: 1px solid #eee;

                  &:hover {
                    opacity: 0.8;
                  }

                  &:last-child {
                    border-bottom: none;
                  }
                }
              }
            }

            > button {
              padding: 0 12px;
              height: 32px;
              line-height: 32px;
              font-size: 12px;
              border-radius: 4px;
              border: 1px solid #3369fe;
              color: #fff;
              background-color: #3369fe;
              cursor: pointer;

              &:hover {
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }
}
</style>