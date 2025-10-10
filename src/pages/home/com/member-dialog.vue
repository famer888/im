<template>
  <div class="comMemberDialog" @click.stop>
    <div class="member-content">
      <picture @click.stop="$emit('close')">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <div class="top">
        <ComImage :src="memberInfo.icon" type="friend" />
        <h2 class="name-h2">{{ nameUpdate }}</h2>
      </div>
      <dl>
        <dt>{{ $t("昵称") }}：</dt>
        <dd>{{ nickName }}</dd>
      </dl>
      <dl v-if="!isSelf">
        <dt>{{ $t("备注名") }}：</dt>
        <dd>
          <input
            class="edit-name"
            :style="{'width': maxWidth + 'px'}"
            v-model="name"
            autofocus
            maxlength="32"
            ref="refName"
            :disabled="!nameEdit"
            @blur="handleRemarkUpdate('name')"
            @keyup.enter="handleEnter"
            :placeholder="name || nickName"
          />
          <!-- <span v-else class="info-text">{{ name }}</span> -->
          <picture v-if="!nameEdit && bfFriend" @click="handleNameEdit">
            <img src="@/assets/images/message/edit-icon.png" />
          </picture>
        </dd>
      </dl>
      <dl>
        <dt>{{ $t("描述") }}：</dt>
        <dd>
          <input
            v-if="depictEdit"
            v-model="depict"
            maxlength="32"
            ref="refDepict"
            @blur="handleRemarkUpdate('depict')"
            @keyup.enter="handleEnter"
          />
          <span v-else class="info-text">{{
            depict === "" ? $t("什么都没写") : depict
          }}</span>
          <picture v-if="!depictEdit && bfFriend" @click="handleDepictEdit">
            <img src="@/assets/images/message/edit-icon.png" />
          </picture>
        </dd>
      </dl>
      <div v-if="stepNum === 2" class="inputContent">
        <h3>{{ $t("添加验证") }}：</h3>
        <div>
          <textarea
            v-model="text"
            :placeholder="$t('请输入内容')"
            type="text"
            maxlength="20"
            ref="refText"
          ></textarea>
          <span>{{ 20 - text.length }}</span>
        </div>
      </div>
      <div class="bottom" v-if="!isSelf">
        <span v-if="bfFriend" @click="handleToFriendChat">
          {{ $t("发送消息") }}
        </span>
        <span v-else-if="memberDetail.addToken" @click="verifierVisble = true">
          添加
        </span>
      </div>
    </div>
    <ComAddVerifyDialog v-if="verifierVisble" :defalutValue="verifyValue" @close="verifierVisble = false"
          @confirm="verifyConfirm" />
  </div>
</template>
<script>
//组件
import ComAddVerifyDialog from "./add-contacts/add-verify-dialog.vue";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventFriend from "@/event/friend";
import { Cache } from "@/cache";

//接口
import { contactsRelation } from "@/api/imContacation.js";

export default {
  props: ["memberInfo", "channelId"],
  inject: ["provideUpdateGroupMember"],
  components: {
      ComAddVerifyDialog
  },
  data() {
    return {
      verifyValue: "",
      verifierVisble: false,
      searchText: "",
      nameUpdate: "",
      nickName: "",
      nameEdit: false,
      name: "",
      oldName: "",
      depictEdit: false,
      depict: "",
      oldDepict: "",
      isSelf: false,
      bfFriend: false,
      stepNum: 1,
      text: "",
      maxWidth: 280,
      memberDetail: {},
    };
  },
  created() {
      // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "memberDialog",
      [
        "friendUpdate", // 接口获取到的成员详情
      ],
      this.eventHandling
    );
  },
  mounted() {
    const loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });

    const { id, name, nickName, depict, bfFriend, channelId } = this.memberInfo;
    console.log("memberInfo--", this.memberInfo)

    this.name = name || "";
    this.nickName = nickName;
    this.nameUpdate = name || nickName;
    this.isSelf = Number(id) === loginId;
    this.depict = depict || "";
    this.oldName = this.name;
    this.oldDepict = this.depict;
    this.bfFriend = bfFriend;

    this.$nextTick(() => {
      let h2 = document.querySelector('.name-h2')
      if (h2.offsetWidth < this.maxWidth) {
        this.maxWidth = h2.offsetWidth - 14
      }
    })
    // 如果明确不是好友则，不用拉取好友列表判断
    if (bfFriend === false) {
      return;
    }

    // 如果是好友，好友信息 API 更新
    eventFriend.fnFriendDetailsGet(id, {channelId});

    // 如果bfFriend是undefined,则检查是否为好友
    if (bfFriend === undefined) {
      this.handCheckisFriend(loginId, id)
    }

  },
  beforeDestroy() {
     eventBase.fnCommunicationMonitoring("memberDialog", null);
  },
  methods: {
    eventHandling(info, operator, operatorType) {
      switch (operator) {
        case "friendUpdate": {
          if(info.id === this.memberInfo.id) {
             this.memberDetail = info;
          }
          console.log("friendUpdate--", info, this.memberDetail)
        }
      }
    },
    // 好友验证消息输入框确认回调
    verifyConfirm(msg) {
          console.log('verifyConfirm--', msg, this.memberInfo)
          if(!msg) {
            window.$toast('请输入验证消息');
            return;
          }
          this.verifyValue = msg;
          this.addFriend();
      },
    // 添加好友
    addFriend() {
          const pra = {
              targetUid: Number(this.memberInfo.id),
              msg: this.verifyValue,
              type: 0,
              op: 0,
              addToken: this.memberDetail.addToken
          }
          console.log("contactsRelation--", pra)
          contactsRelation(pra).then(res => {
              const { errCode } = res?.commonResult || {}
              if (errCode == 200) {
                  window.$toast('已向对方发送添加申请')
                  this.verifierVisble = false;
              } else {
                  window.$toast('发送失败，请稍后尝试')
              }
              console.log('contactsRelation--', res, errCode)
          })
    },
    // 检查传进来群成员信息和自己是否为好友
    handCheckisFriend(loginId, id) {
      // 如果传进来的群成员和自己不是好友关系，获取好友列表再次确认
      Cache(`${loginId}-ContactList`).then((res) => {
        if (res) {
          const info = res.find((item) => item.id === id);
          if (info) {
            this.name = info.name || info.nickName;
            this.bfFriend = true;
            if (!this.memberInfo.bfFriend) { 
              // 好友列表找到了该成员信息，但是传进来的群成员和自己的关系显示不明确，更新和群成员的关系
              this.provideUpdateGroupMember({...this.memberInfo, bfFriend: true})
            }
          } else {
            this.bfFriend = false;
            this.provideUpdateGroupMember({...this.memberInfo, bfFriend: false})
          }
        }
      });
    },
    /**
     * 到好友聊天窗
     */
    handleToFriendChat() {
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: {
          id: this.memberInfo.id,
          name: this.memberInfo.name || this.memberInfo.nickName,
          pic: this.memberInfo.icon,
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
    handleRemarkUpdate(type) {
      this.nameEdit = false;
      this.depictEdit = false;
      // 判断是否有改变，如果没有改变，则不调用更新方法
      if (type === "name") {
        if (this.name === this.oldName) {
          return;
        }
        // 更新显示
        this.nameUpdate = this.name || this.nickName;
        this.oldName = this.name;
      } else {
        if (this.depict === "") {
          this.depict = this.memberInfo.depict;
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
          id: this.memberInfo.id,
          type: "friend",
          values:
            type === "name"
              ? {
                  name: this.name,
                }
              : {
                  depict: this.depict,
                },
        },
      });
    },
    /**
     * 编辑 备注名
     */
    handleNameEdit() {
      this.nameEdit = true;
      setTimeout(() => {
        this.$refs["refName"].focus();
      }, 10);
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
<style lang="scss" scoped>
.comMemberDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1800;
  background: rgba($color: #000000, $alpha: 0.2);

  .member-content {
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

    > dl {
      display: flex;
      line-height: 30px;
      font-size: 14px;
      margin: 0;

      > dt {
        padding: 0 10px 0 0;
        color: #999;
        white-space: nowrap;
      }

      > dd {
        display: flex;
        flex: auto;

        .info-text {
          font-size: 14px;
          max-width: calc(100% - 30px);
          word-break: break-word;
        }

        > picture {
          width: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            opacity: 0.8;
          }

          > img {
            height: 15px;
          }
        }

        > input {
          display: block;
          width: 100%;
          height: 100%;
          font-size: 14px;
          font-family: PingFangSC-Regular;
          &:disabled{
            background-color: white;
          }
        }
      }
    }

    > .inputContent {
      > h3 {
        font-size: 14px;
        margin: 0;
        padding: 0;
        line-height: 30px;
      }

      > div {
        height: 80px;
        position: relative;

        > textarea {
          padding: 10px;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          background-color: rgb(245, 245, 245);
          border-radius: 6px;
          line-height: 20px;
        }

        > span {
          font-size: 12px;
          position: absolute;
          right: 5px;
          bottom: 5px;
          color: #aaa;
        }
      }
    }

    > .bottom {
      margin-top: 15px;
      padding-bottom: 10px;
      display: flex;

      > span {
        display: block;
        color: #fff;
        background-color: #3369fe;
        border: 0;
        cursor: pointer;
        padding: 0 28px;
        display: inline-block;
        height: 32px;
        line-height: 32px;
        font-size: 12px;
        border-radius: 4px;
        margin-right: 10px;

        &:hover {
          opacity: 0.8;
        }

        &.cancel {
          background: #999;
        }
      }
    }
  }
}
</style>
