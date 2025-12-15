<template>
  <div class="comGroupNoticeDialog" @click.stop>
    <div class="content">
      <picture @click.stop="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <section>
        <textarea v-if="loginIsHost && isEdit" maxlength="800" type="text" v-model="noticeText"
          :placeholder="$t('请输入内容')" :disabled="!loginIsHost" />
        <ComGroupNoticeView v-else :content="noticeText" :atNameList="atNameList" :noClick="false"
          :styleInfo="{ height: '203px' }" :key="noticeText" :chatContent="chatContent" />
        <span v-if="loginIsHost && isEdit">{{ 800 - noticeText.length }}</span>
      </section>
      <template v-if="loginIsHost">
        <div class="bottom" v-if="!isEdit">
          <span @click.stop="isEdit = true">{{ $t('修改') }}</span>
        </div>
        <div class="bottom" v-else>
          <span @click.stop="handleOk">{{ $t("确定") }}</span>
          <span @click.stop="handleCancel">{{ $t("取消") }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
// 控件
import ComGroupNoticeView from "./view.vue";
import ComSwitch from "@/pages/home/com/switch.vue";
import { updateChannel } from "@/api/imChannel";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventMsg from "@/event/msg";

export default {
  components: { ComGroupNoticeView, ComSwitch },
  //  "historyNotice"
  props: ["chatContent"],
  data() {
    return {
      loginIsHost: false, // 是否是群主
      noticeText: "", // 公告字符串
      noticeTextCopy: "", // 公告字符串备份
      isEdit: false, // 是否是编辑状态
    };
  },
  inject: ['provideChannelUserList'],
  mounted() {
    this.isEdit = false
    this.noticeText = _.get(this.chatContent, "remark") || "";
    this.noticeTextCopy = _.get(this.chatContent, "remark") || "";
    // 是否是拥有着和管理
    this.loginIsHost = (this.chatContent.memberType === 1 || this.chatContent.memberType === 2);
  },
  computed: {
    atNameList() {
      try {
        const channelUserList = this.provideChannelUserList();
        // 设置简介数组
        if (this.remark !== "") {
          return channelUserList
            .filter((item) => item.userInfoDTO.name || item.userInfoDTO.nickName)
            .map((item) => "@" + (item.userInfoDTO.name || item.userInfoDTO.nickName));
        }
        return [];
      } catch (err) {
        return [];
      }
    },
  },
  methods: {
    /**
     * 取消
     */
    handleCancel() {
      this.isEdit = false;
      this.noticeText = this.noticeTextCopy;
    },
    /**
     * 关闭 群简介会话框
     */
    handleClose() {
      this.isEdit = false;
      // 移除 群简介会话框
      eventCommon.fnCloseListRU({
        removeIds: ["channelNoticeDialog"],
      });
    },
    /**
     * 提交
     */
    handleOk() {
      const { id } = this.chatContent;
      // 发送
      updateChannel({
        channelId: id,
        remark: this.noticeText,
      }).then((res) => {
        if (res.code === 200) {
          window.$toast(this.$t("修改成功"));
          // 更新本地显示
          this.chatContent.remark = this.noticeText;
          eventBase.fnCommunicationSendMsg({
            operator: "channelDetailCache",
            data: this.chatContent,
          });
          eventBase.fnCommunicationSendMsg({
            operator: "channelUpdate",
            data: {
              channelId: id,
              values: {
                remark: this.noticeText
              }
            },
          });
          // 关闭
          this.handleClose();
        } else {
          window.$toast(res.msg || this.$t("修改失败"));
        }
      });
    },
  },
};
</script>
<style lang="scss">
.comGroupNoticeDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: rgba($color: #000000, $alpha: 0.2);

  .content {
    padding-top: 30px;
  }

  >div {
    background: #fff;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 10px 16px;
    border-radius: 8px;
    width: 438px;
    box-sizing: border-box;

    >picture {
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

    >.top {
      // height: 70px;
      height: 20px;
      display: flex;
      align-items: center;

      >img {
        display: block;
        height: 35px;
        width: 35px;
        border-radius: 50%;
        margin-right: 10px;
      }

      >h2 {
        display: block;
        margin: 0;
        padding: 0;
        line-height: 30px;
        font-size: 14px;
        font-weight: 600;
      }

      >span {
        display: block;
        padding: 1px 10px;
        margin-left: 5px;
        background-color: #3369fe;
        border-radius: 10px;
        font-size: 12px;
        color: #fff;
        transform: scale(0.9);

        &.groupOwner {
          background-color: #3369fe;
        }

        &.isAdmin {
          background-color: #fb9203;
        }
      }
    }

    >section {
      position: relative;

      >textarea {
        padding: 15px 10px;
        box-sizing: border-box;
        width: 100%;
        height: 223px;
        background-color: rgb(245, 245, 245);
        border-radius: 8px;
        font-size: 14px;
        color: #333;
        display: block;
      }

      >span {
        position: absolute;
        right: 10px;
        bottom: -18px;
        font-size: 12px;
        color: #666;
      }

      >div {
        padding: 15px 0;
        background-color: rgb(245, 245, 245);
        border-radius: 8px;

        >div {
          padding: 0 10px;

          span {
            font-size: 14px;
            color: #333;
          }
        }
      }
    }

    >.bottom {
      margin-top: 5px;
      padding-top: 20px;
      padding-bottom: 10px;
      display: flex;
      justify-content: flex-end;

      >span {
        display: block;
        color: #fff;
        background-color: #3369fe;
        border: 1px solid #3369fe;
        cursor: pointer;
        padding: 0 28px;
        display: inline-block;
        height: 32px;
        line-height: 32px;
        font-size: 12px;
        border-radius: 4px;

        &:hover {
          opacity: 0.8;
        }

        &:nth-child(2) {
          background-color: #fff;
          border: 1px solid #eeeeee;
          color: #666666;
          margin-left: 10px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.group-notice-content {
  height: 260px;
  overflow: auto;
  font-size: 14px;
  color: #666;
  line-height: 20px;
  user-select: text;

  >h4 {
    margin: 0;
    font-size: 14px;
    color: #3369fe;
    display: inline-block;
    cursor: pointer;
    font-weight: normal;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
