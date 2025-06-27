<template>
  <div class="communication-page">
    <div v-if="info" class="communication-page-box">
      <div class="user-info">
        <ComImage :src="info.pic" type="group" class="avatar" />
        <div>
          <div class="name">
            {{ info.name }}
          </div>
          <div class="count">
            {{
              $t("群成员共{value}人", {
                value: info.memberCount,
              })
            }}
          </div>
        </div>
        <span class="name"></span>
      </div>
      <div class="user-des">
        <div class="memberList">
          <div
            class="member-item mr-20"
            v-for="(item, index) in meberList.slice(0, 8)"
            :key="index"
            @click="handleMemberDialogSet(item)"
          >
            <ComImage :src="item.icon" type="friend" />

            <div class="nick-name" :title="item.name || item.nickName">
              {{ item.name || item.nickName }}
            </div>
            <div class="member-identity member-master" v-if="item.type == 0">
              {{ $t("群主") }}
            </div>
            <div class="member-identity" v-else-if="item.type == 1">
              {{ $t("管理员") }}
            </div>
          </div>
        </div>
      </div>
      <div class="primaryBtn small" @click="handleToChat">
        {{ $t("发送消息") }}
      </div>
    </div>
    <img
      v-else
      class="default-img"
      src="@/assets/images/common/defalut-icon.png"
      alt=""
    />
    <ComMemberDialog
      v-if="memberInfo"
      :memberInfo="memberInfo"
      @close="memberInfo = null"
    />
  </div>
</template>

<script>
import { Cache } from "@/cache";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  data() {
    return {
      meberList: [],
      visible: false,
      memberInfo: null,
    };
  },
  props: ["info"],
  components: {
    ComMemberDialog: () => import("@/pages/home/com/member-dialog.vue"),
  },
  mounted() {
    this.handleUpdateGroupMember();
  },
  methods: {
    /**
     * 到群聊天窗
     */
    handleToChat() {
      const data = {
        ...this.info,
        name: this.info.name || this.info.nickName,
        type: "group",
        comType: "chat",
      };

      data.bfReadCancel = this.info.bfGroupReadCancel;
      data.msgCancelTime = this.info.groupMsgCancelTime;

      delete data.bfGroupReadCancel;
      delete data.groupMsgCancelTime;
      console.log('>>>>>>>>>>>>>>>>> 99 detail/group data', data)
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data,
      });
    },
    /**
     * 群成员聊天窗设置
     */
    handleMemberDialogSet(item) {
      this.memberInfo = {
        ...item,
        bfFriend: item.bfFriend,
        remarkName: item.name || item.nickName,
      };
    },
    handleUpdateGroupMember() {
      // 同步成员列表
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      const cacheName = `${loginId}_${this.info.id}_groupMemberList`;
      Cache(cacheName).then((res) => {
        if (res && res.length > 0) {
          this.meberList = _.orderBy(res, ["type"], ["asc"]).filter(
            (_, index) => {
              return index < 10;
            }
          );
        }
      });
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

  .communication-page-box {
    padding: 80px 40px;

    .user-info {
      padding: 20px 0;
      border-bottom: 1px solid #eee;
      display: block;
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

      .count {
        margin-top: 5px;
        color: #999;
      }
    }

    .user-des {
      padding: 20px 0 40px;

      .memberList {
        min-height: 77px;
        display: flex;

        .member-item {
          margin-right: 10px;
          text-align: center;
          width: 50px;
          cursor: pointer;

          img {
            width: 35px;
            height: 35px;
            border-radius: 50%;
          }

          .nick-name {
            font-size: 12px;
            line-height: 12px;
            white-space: nowrap;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: text;
          }
          // .nick-name:hover {
          //   overflow: visible; /* 鼠标悬浮时显示全文 */
          //   white-space: normal; /* 允许文本换行 */
          //   text-overflow: clip; /* 移除省略号 */
          // }
        }
      }

      .item {
        margin-bottom: 15px;

        .key {
          margin-right: 10px;
          color: #999;
        }
      }
    }
  }

  .member-identity {
    font-size: 12px;
    color: #fff;
    padding: 2px 6px;
    border-radius: 99px;
    background: #fb9203;
    margin-top: 6px;
    flex-shrink: 0;
  }
  .member-master {
    background: #3369fe !important;
    flex-shrink: 0;
  }
}
</style>
