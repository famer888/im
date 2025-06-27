<template>
  <div class="communication-page">
    <div class="communication-page-box" v-if="info">
      <div class="user-info">
        <ComImage :src="info.pic" type="friend" class="avatar" />
        <div>
          <span class="name">
            {{ name }}
          </span>
          <p>
            ID:
            {{ info.identify }}
            <span @click="copyTest(info.identify)">复制</span>
          </p>
        </div>
      </div>
      <div class="user-des">
        <div class="item">
          <div class="key">{{ $t("昵称") }}：</div>
          <div class="val user-select">
            {{ nickName }}
          </div>
        </div>
        <div class="item">
          <div class="key">{{ $t("备注名") }}：</div>
          <div class="val">
            <input
              ref="editInput"
              v-show="nameEdit"
              type="text"
              v-model="remarkName"
              :placeholder="$t('请输入内容')"
              @blur="handleRemarkUpdate('name')"
              @keyup.enter="handleEnter"
            />
            <span v-show="!nameEdit" class="user-select">
              {{ remarkName || nickName }}
            </span>
            <img
              v-if="!nameEdit"
              @click="remarkEdit"
              class="edit-icon"
              src="@/assets/images/message/edit-icon.png"
              alt=""
            />
          </div>
        </div>
        <div class="item">
          <div class="key">{{ $t("描述") }}：</div>
          <div class="val">
            <input
              ref="refDepict"
              v-show="depictEdit"
              type="text"
              v-model="depict"
              :placeholder="$t('暂无描述')"
              @blur="handleRemarkUpdate('depict')"
              @keyup.enter="handleEnter"
            />
            <span v-show="!depictEdit" class="user-select">
              {{ depict || $t("什么都没写") }}
            </span>
            <img
              v-if="!depictEdit"
              @click="handleDepictEdit"
              class="edit-icon"
              src="@/assets/images/message/edit-icon.png"
              alt=""
            />
          </div>
        </div>
      </div>
      <div class="primaryBtn small" @click="linkTo">
        {{ $t("发送消息") }}
      </div>
    </div>
  </div>
</template>
<script>
import { copyToClipboard } from "@/utils/base";

// 事件
import eventBase from "@/event/base";
import eventFriend from "@/event/friend";

export default {
  data() {
    return {
      depictEdit: false,
      nameEdit: false,
      remarkName: "",
      depict: "",
      oldDepict: "",
      name: "",
      nickName: "",
      oldRemarkName: "",
    };
  },
  props: ["info"],
  mounted() {
    this.depict = this.info.depict;
    this.nickName = this.info.nickName;
    this.remarkName = this.info.name || "";
    this.name = this.info.name || this.info.nickName;
    this.oldRemarkName = this.remarkName;
    this.oldDepict = this.depict;
    // 好友信息 API 更新
    eventFriend.fnFriendDetailsGet(this.info.id);
  },
  methods: {
    /**
     * 到好友聊天窗
     */
    linkTo() {
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: {
          ...this.info,
          name: this.info.name || this.info.nickName,
          type: "friend",
          comType: "chat",
        },
      });
    },
    /**
     * enter 键 触发blur就行了，避免发送两次
     */
    handleEnter() {
      this.nameEdit = false;
      this.depictEdit = false;
    },
    /**
     * 修改备注 备注名，描述
     */
    remarkEdit() {
      this.nameEdit = true;
      setTimeout(() => {
        this.$refs["editInput"].focus();
      }, 10);
    },
    /**
     * 修改备注 备注名，描述
     */
    handleRemarkUpdate(type) {
      this.nameEdit = false;
      this.depictEdit = false;
      // 判断是否有改变，如果没有改变，则不调用更新方法
      if (type === "name") {
        // if (this.remarkName === "") {
        //   this.remarkName = this.info.nickName;
        //   return;
        // }

        if (this.remarkName === this.oldRemarkName) {
          return;
        }
        this.name = this.remarkName || this.nickName;
        this.oldRemarkName = this.remarkName;
      } else {
        if (this.depict === "") {
          this.depict = this.info.depict;
          return;
        }
        if (this.depict === this.oldDepict) {
          return;
        }
        this.oldDepict = this.depict;
      }

      // 通讯 更新好友备注
      eventBase.fnCommunicationSendMsg({
        operator: "friendRemarkUpdate",
        operatorType: type,
        data: {
          id: this.info.id,
          type: "friend",
          values:
            type === "name"
              ? {
                  name: this.remarkName,
                }
              : {
                  depict: this.depict,
                },
        },
      });
    },
    /**
     * 复制文本
     */
    copyTest(text) {
      copyToClipboard(text);
      window.$toast(this.$t("复制成功"));
    },
    /**
     * 编辑 描述
     */
    handleDepictEdit() {
      this.depictEdit = true;
      setTimeout(() => {
        this.$refs["refDepict"].focus();
      }, 10);
    },
  },
};
</script>

<style scoped lang="scss">
.communication-page {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  .user-select {
    user-select: text;
  }

  .communication-page-box {
    padding: 80px 40px;

    .user-info {
      display: flex;
      flex-wrap: wrap;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
      align-items: center;

      .avatar {
        margin-right: 20px;
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 50%;
      }

      .name {
        font-size: 16px;
        font-weight: 600;
        user-select: text;
      }
      > div {
        > p {
          width: 100%;
          display: flex;
          margin-top: 10px;
          span {
            background: #326aff;
            color: #ffffff;
            width: 36px;
            height: 20px;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            margin-left: 10px;
          }
        }
      }
    }

    .user-des {
      padding: 10px 0;

      .item {
        height: 33px;
        display: flex;
        align-items: center;

        .key {
          margin-right: 10px;
          color: #999;
        }
      }
    }
  }

  .edit-icon {
    margin-left: 5px;
    cursor: pointer;
    width: 15px;
    vertical-align: middle;
  }
}
</style>
