<template>
  <div class="channelManageDialog">
    <div>
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <div class="title">群主</div>
      <div class="member-list">
        <div v-if="hostInfo" class="member-item cursor">
          <ComImage
            :src="hostInfo.userInfoDTO?.icon"
            type="friend"
            class="member-avatar"
          />
          <div class="member-info">
            <div class="member-info-top">
              <div class="member-name">
                {{ getItemName(hostInfo) }}
              </div>
            </div>
            <div class="member-online-state">
              {{ getOnlineState(hostInfo) }}
            </div>
          </div>
        </div>
      </div>
      <div class="title">{{ $t("管理员") }}（{{ managerList.length }}/20）</div>
      <div class="member-list">
        <div
          v-for="(item, index) in managerList"
          :key="index"
          class="member-item cursor"
        >
          <ComImage :src="item.userInfoDTO.icon" type="friend" class="member-avatar" />
          <div class="member-info">
            <div class="member-info-top">
              <div class="member-name">
                {{ getItemName(item) }}
              </div>
            </div>
            <div class="member-online-state">
              {{ getOnlineState(item) }}
            </div>
          </div>
          <span
            v-if="loginIsHost"
            class="remove-manage"
            @click="removeManage(item)"
          >
            移除
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// api
import { deleteManage } from "@/api/imChannel";

// 工具
import { longToNum } from "@/utils/base";

// 事件
import eventCommon from "@/event/common";

export default {
  props: ["memberInfoList", "channelId"],
  data() {
    return {
      managerList: [],
      loginIsHost: false, // 是否是群主
      hostInfo: null, // 群主信息
    };
  },
  mounted() {
    // 管理员列表
    this.managerList = this.memberInfoList.filter((item) => {
      return item.memberType === 2;
    });

    // 群主信息设置
    this.handelHostInfoSet();
  },
  methods: {
    /**
     *  关闭 群管理会话框
     */
    handleClose() {
      eventCommon.fnCloseListRU({
        removeIds: ["channelManageDialog"],
      });
    },
    /**
     * 群主信息设置
     */
    handelHostInfoSet() {
      // 设置群主信息
      this.hostInfo = this.memberInfoList.find(
        (item) => item.memberType == 1 
      );

      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      // 登录信息是否为群主
      this.loginIsHost = longToNum(this.hostInfo?.userInfoDTO?.uid) === loginId;
    },
    removeManage(item) {
      const channelId = this.channelId;
      const uid = item.userInfoDTO.uid;

      if (!channelId || !uid) {
        return;
      }

      deleteManage({ channelId, uid }).then((res) => {
        if (res?.code == 200) {
          window.$toast(`移除成功`);
          this.$set(item, "memberType", 3);
          this.managerList = this.managerList.filter((item) => {
            return item.memberType === 2;
          });
          this.handleClose();
        }
      });
    },
    getOnlineState(item) {
      const online = item.userInfoDTO?.onLineStatus;
      return online ? this.$t("在线") : this.$t("不久前上线");
    },
    getItemName(item) {
      const userInfoDTO = item.userInfoDTO || {};
      return (
        userInfoDTO.nickName ||
        userInfoDTO.name
      );
    },
  },
};
</script>

<style scoped lang="scss">
.channelManageDialog {
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
    .title {
      background: #fff;
      color: #333;
      padding: 10px;
      box-sizing: border-box;
    }

    .member-list {
      margin-top: 10px;
      width: 100%;
      padding-bottom: 10px;
      background: #fff;
      overflow-y: auto;
      max-height: 350px;

      .flex {
        flex-wrap: wrap;
        transform: translate3d(0, 0, 0);
      }

      .member-item {
        width: 100%;
        text-align: center;
        display: flex;
        align-items: center;
        position: relative;
        padding: 5px 10px;
        box-sizing: border-box;

        &:hover {
          background: #f5f5f5;
        }

        .remove-manage {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);

          &:hover {
            color: #3369fe;
          }
        }

        .member-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          // object-fit: cover;
        }

        .member-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }

        .member-info {
          margin-left: 10px;
          width: 100%;
          overflow: hidden;
        }

        .member-info-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          overflow: hidden;
        }

        .member-online-state {
          text-align: left;
          font-size: 12px;
          color: #b9babe;
        }
      }

      .show-more {
        margin-top: 4px;
        text-align: center;
        font-size: 12px;
      }
    }
  }
}
</style>
