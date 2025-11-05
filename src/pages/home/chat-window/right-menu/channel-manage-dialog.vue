<template>
  <div class="channelManageDialog">
    <div>
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <div class="member-list">

      </div>
      <div class="title">{{ $t("管理员") }}（{{ managerList.length + 1 }}/50）</div>
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
              <div class="badge">所有者</div>
            </div>
            <div class="member-online-state">
              {{ getOnlineState(hostInfo) }}
            </div>
          </div>
        </div>
        <div
          v-for="(item, index) in managerList"
          :key="index"
          class="member-item cursor"
          @click="handleMemberDialogShow(item)"
        >
          <ComImage :src="item.userInfoDTO.icon" type="friend" class="member-avatar" />
          <div class="member-info">
            <div class="member-info-top">
              <div class="member-name">
                {{ getItemName(item) }}
              </div>
            </div>
            <div class="member-online-state">
              {{ item.setter }}
            </div>
          </div>
          <span
            v-if="item.removeAuthorize"
            class="remove-manage cursor"
            @click.stop="removeManage(item)"
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
import { deleteManage, getChannelManages } from "@/api/imChannel";

// 工具
import { longToNum } from "@/utils/base";
import { formatChannelManages } from "@/utils/formats";

// 事件
import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
  props: ["memberInfoList", "channelId"],
  data() {
    return {
      managerList: [],
      hostInfo: null, // 群主信息
    };
  },
  mounted() {
    // 群主信息设置
    this.handelHostInfoSet();
    // 管理员列表
    this.managerList = this.memberInfoList.filter((item) => {
      return item.memberType === 2;
    });
    // 处理管理员权限
    this.processManagerListAuthorization();
    this.getManageList();
  },
  methods: {
    getManageList() {
      const prams = {
        pageNum: 1,
        pageSize: 200,
        channelId: this.channelId,
      }
      getChannelManages(prams).then(res => {
            let list = formatChannelManages(res.data?.rowList || [])
            // 管理员列表
            this.managerList = list.filter((item) => {
              return item.memberType === 2;
            });
            // 群主信息设置
            this.handelHostInfoSet();
            // 处理管理员权限
            this.processManagerListAuthorization();
        })
    },
       /**
     * 成员的会话框 显示
     */
    handleMemberDialogShow(info) {
      console.log("handleMemberDialogShow--", info)
      eventBase.fnCommunicationSendMsg({
        operator: "memberDialogShow",
        data: {
          values: {
            id: info.userInfoDTO.uid,
            icon: info.userInfoDTO.icon,
            // name: info.userInfoDTO.name,
            nickName: info.userInfoDTO.nickName,
            // bfFriend: info.bfFriend,
            channelId: this.channelId,
          },
        },
      });
    },
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
    },
    /**
     * 处理管理员列表权限
     * 为每个管理员添加removeAuthorize字段
     */
    processManagerListAuthorization() {
      // 获取登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      // 判断当前登录用户是否是群主
      const loginIsHost = longToNum(this.hostInfo?.userInfoDTO?.uid) === loginId;

      // 为每个管理员设置removeAuthorize
      this.managerList = this.managerList.map((item) => {
        // 如果是群主，所有管理员的removeAuthorize都为true
        if (loginIsHost) {
          this.$set(item, 'removeAuthorize', true);
        } else {
          // 如果不是群主，对比当前登录id和item.setterUid
          // 如果相同，removeAuthorize为true，否则为false
          const removeAuth = longToNum(item.setterUid) === loginId;
          this.$set(item, 'removeAuthorize', removeAuth);
        }
        return item;
      });
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
        .badge {
          font-size: 10px;
          color: #fff;
          padding: 2px 6px;
          border-radius: 99px;
          background: #3369fe;
          flex-shrink: 0;
          margin-left: 4px;
        }

        .member-info {
          margin-left: 10px;
          width: 100%;
          overflow: hidden;
        }

        .member-info-top {
          display: flex;
          align-items: center;
        //   justify-content: space-between;
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
