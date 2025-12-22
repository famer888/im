<template>
  <div class="comGroupNoticeDialog" @click.stop>
    <div>
      <picture @click.stop="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <div class="top">
        <ComImage :src="(editUser && editUser.icon) || (hostInfo && hostInfo.icon)" type="friend" />
        <h2>
          {{
            (editUser && editUser.nickName) || (hostInfo && hostInfo.nickName)
          }}
        </h2>
        <span v-if="loginIsHost || showBadge" :class="{
          groupOwner: editUser?.type === 0 || chatContent.groupNotice.editUser && chatContent.groupNotice.editUser.type == 0,
          isAdmin: editUser?.type === 1 || !editUser && chatContent.groupNotice.editUser && chatContent.groupNotice.editUser.type == 1,
        }">
          {{
            $t(
              handleEditUserType(
                (chatContent.groupNotice.editUser && chatContent.groupNotice.editUser.type) || (hostInfo && hostInfo.type)
              )
            )
          }}
        </span>
      </div>
      <section>
        <textarea v-if="loginIsHost && isEdit" maxlength="800" type="text" v-model="noticeText"
          :placeholder="$t('请输入内容')" :disabled="!loginIsHost" />
        <ComGroupNoticeView v-else :content="noticeText" :atNameList="atNameList" :noClick="false"
          :styleInfo="{ height: '203px' }" :key="noticeText" :chatContent="chatContent" />
        <span v-if="loginIsHost && isEdit">{{ 800 - noticeText.length }}</span>
      </section>
      <template v-if="loginIsHost">
        <div class="bottom" v-if="!isEdit">
          <span @click.stop="handleActivateEdit">{{ $t('发布新简介') }}</span>
        </div>
        <div class="bfAll" v-if="isEdit">
          {{ $t("通知所有成员") }}
          <span>
            {{ $t("推送告知所有的群成员，即使对方开启消息免打扰") }}
          </span>
          <ComSwitch :value="bfAll" @input="bfAll = !bfAll" />
        </div>
        <div class="bottom" v-if="isEdit">
          <span @click.stop="handleOk">{{ $t("确认发布") }}</span>
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

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventMsg from "@/event/msg";

export default {
  components: { ComGroupNoticeView, ComSwitch },
  props: ["chatContent", "historyNotice"],
  data() {
    return {
      atNameList: [], // at名称列表
      hostInfo: null, // 群主信息
      editUser: null, // 公告编辑者信息
      loginIsHost: false, // 是否是群主
      noticeText: "", // 公告字符串
      noticeTextCopy: "", // 公告字符串副本
      bfAll: false, // 群简介是否通知所有人
      isEdit: false, // 是否是编辑状态
      showBadge: false,
    };
  },
  inject: ["provideMemberList", "provideSetTopNotice"],
  mounted() {
    this.init();
  },
  watch: {
    // 防止超出限制
    noticeText(val) {
      if (val && val.length > 800) {
        let limit = 800;
        if (val.charCodeAt(limit - 1) >= 0xD800 && val.charCodeAt(limit - 1) <= 0xDBFF) {
          limit = 799;
        }
        this.noticeText = val.slice(0, limit);
      }
    },
  },
  methods: {
    init() {
      // 这判断怎么写的那么乱啊卧槽
      this.isEdit = false
      // 获取成员信息列表
      const memberInfoList = this.provideMemberList();

      // 历史公告，直接赋值historyNotice
      if (this.historyNotice.showHistoryNotice) {
        this.noticeText = this.historyNotice.notice;
      } else {
        // 公告文本
        this.noticeText = _.get(this.chatContent, "groupNotice.notice") || "";
        this.noticeTextCopy = _.get(this.chatContent, "groupNotice.notice") || "";
      }
      this.handleSetNoticeBaseInfo(memberInfoList);
      // at名称列表
      this.atNameList = memberInfoList
        .filter((item) => item.name || item.nickName)
        .map((item) => "@" + (item.name || item.nickName));

      // 普通群成员默认群主信息
      this.hostInfo = memberInfoList.find((item) => item.type == 0);
      this.getShowBadge(memberInfoList);
    },
    getShowBadge(memberInfoList) {
      const uid = this.editUser?.uid || this.editUser?.id || _.get(this.chatContent, "groupNotice.editUser.user.uid");
      const userType = memberInfoList.find(x => x.id === Number(uid))?.type;
      this.showBadge = userType === 0 || userType === 1;
    },
    /**
    * 取消
    */
    handleCancel() {
      this.init();
    },
    handleActivateEdit() {
      this.isEdit = true;
      this.noticeText = '';
      const memberInfoList = this.provideMemberList();
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      this.editUser = memberInfoList.find(
        (item) => item.id == loginId && item.type < 2
      ) || {};
    },
    handleSetNoticeBaseInfo(memberInfoList) {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      if (this.historyNotice.showHistoryNotice) {
        const uid = this.historyNotice?.editorId;
        this.editUser = memberInfoList.find(
          (item) => item.id == uid
        ) || {};
      } else if (this.chatContent.groupNotice.notice) {
        // 如果有公告信息
        let editUser = {}
        if (this.chatContent.groupNotice.editUser) { // 如果没有返回编辑者
          editUser = _.cloneDeep(this.chatContent.groupNotice.editUser.user);
        } else {
          editUser = memberInfoList.find(
            (item) => item.id == loginId && item.type < 2
          ) || {};
        }
        // 设置公告编辑者信息
        this.editUser = editUser;

        // 登录信息是否为群主,或者是否为管理员，并且具有发布群简介的权限
        this.loginIsHost = this.chatContent.hostId === loginId || (this.chatContent.memberType < 2 && this.chatContent.bfPushNotice);
      } else {
        // 没有公告信息，则获取当前登入者信息，并判断他是群主还是管理员，只有这两个身份才可以设置b编辑者信息
        this.editUser = memberInfoList.find(
          (item) => item.id == loginId
        ) || {};

        // 登录信息是否为群主,或者是否为管理员，并且具有发布群简介的权限
        this.loginIsHost =
          (this.chatContent.hostId === loginId) ||
          (this.chatContent.memberType == 1 && this.chatContent.bfPushNotice);

      }
    },
    /**
     * 点击 如果有at信息对应弹出
     */
    handleClick(str) {
      if (str.slice(0, 1) === "@") {
        // 点击at
        this.$emit("clickAt", str);
      }
    },
    /**
     * 关闭 群简介会话框
     */
    handleClose() {
      this.isEdit = false
      // 移除 群简介会话框
      eventCommon.fnCloseListRU({
        removeIds: ["groupNoticeDialog"],
      });
    },
    /**
     * 提交
     */
    handleOk() {
      if (this.bfAll) {
        window
          .$confirm({
            remark: this.$t(
              "发布该群简介会通知全部群成员，可能会对群成员造成打扰，确定发布？"
            ),
          })
          .then(() => {
            this.handleSendNotice(true);
            // 推送公告
            eventMsg.fnMsgSend({
              id: this.chatContent.id,
              type: "group",
              list: [
                {
                  type: "text",
                  values: {
                    chatType: 8,
                    content: this.noticeText,
                    bfAll: this.bfAll,
                  },
                },
              ],
            });
          });
      } else {
        this.handleSendNotice(false);
      }
    },
    handleSendNotice(bfAll) {
      const { id, type } = this.chatContent;
      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "groupNoticeSet",
        data: {
          id,
          type,
          notice: this.noticeText,
          bfAll,
        },
      });
      this.provideSetTopNotice({ notice: this.noticeText, editorId: id });
      // 更新本地 chatContent 数据
      if (this.chatContent) {
        if (!this.chatContent.groupNotice) {
          this.$set(this.chatContent, "groupNotice", {});
        }
        this.$set(this.chatContent.groupNotice, "notice", this.noticeText);
        // 更新编辑者信息
        const loginId = eventCommon.fnCommonInfoRU({
          getId: "loginId",
        });
        const memberInfoList = this.provideMemberList();
        const currentUser = memberInfoList.find((item) => item.id == loginId);

        if (currentUser) {
          const editUserInfo = {
            user: currentUser,
            type: currentUser.type,
          };
          this.$set(this.chatContent.groupNotice, "editUser", editUserInfo);
        }
      }
      // 关闭
      this.handleClose();
    },
    handleEditUserType(origin) {
      let typeStr = {
        0: "群主",
        1: "管理员",
        2: "",
      };
      const forceType = this.editUser?.type;
      return typeStr[forceType] || typeStr[origin];
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
      height: 70px;
      min-height: 70px;
      display: flex;
      align-items: center;

      >img {
        display: block;
        height: 35px;
        width: 35px;
        min-width: 35px;
        min-height: 35px;
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

    >.bfAll {
      padding: 10px 0;
      font-size: 13px;
      line-height: 25px;
      color: #333;
      position: relative;

      >span {
        display: block;
        font-size: 12px;
        color: #999;
        line-height: 18px;
        max-width: 370px;
      }

      >div {
        position: absolute;
        right: 0;
        top: 27px;
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
