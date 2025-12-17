<template>
  <div class="groupInvitation">
    <h1>{{ $t("群通知") }}</h1>
    <ul class="notify-box">
      <li v-for="(item, index) in list" :key="index">
        <ComImage :src="item.pic" type="icon" />
        <div class="top-info">
          <h2>{{ item.name }}</h2>
          <span class="time"> · {{ chatTime(item.updateTime) }}</span>
        </div>
        <p class="line-notify">{{ item.remark }}</p>
        <div
          v-if="
            ['inviteJoinGroup', 'groupApply'].includes(item.type) ||
            item.groupReqId
          "
          class="right-info"
        >
          <template v-if="[1, 2, 15].includes(item.groupReqType)">
            <template v-if="!item.groupReqStatus">
              <button
                @click="check(parseInt(item.groupReqId), item, false, index)"
              >
                {{ $t("拒绝") }}
              </button>
              <button
                class="active"
                @click="
                  check(
                    parseInt(item.groupReqId),
                    item,
                    true,
                    index,
                    parseInt(item.groupId)
                  )
                "
              >
                {{ $t("通过") }}
              </button>
            </template>
            <span v-else>{{ groupReqStatus[item.groupReqStatus] }}</span>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>
<script>
import {
  groupCheckJoin,
  GroupUserCheckJoin,
  getGroupReqList,
  getGroupReqListV2,
} from "@/api/imGroup";
import { chatTime } from "@/utils/base";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  data() {
    return {
      moduleName: "群通知",
      list: [],
      chatTime,
      pageNum: 1,
      groupReqStatus: {
        1: "已同意",
        2: "已拒绝",
        3: "已失效",
      },
    };
  },
  created() {
    // 监听群通知事件
    eventBase.fnCommunicationMonitoring(
      "groupInvitationUpdate",
      ["groupInvitationUpdate"],
      (data) => {
        this.handleGroupNotification(data);
      }
    );
    this.handleUpdateList();
  },
  beforeDestroy() {
    // 移除监听
    eventBase.fnCommunicationMonitoring("groupInvitationUpdate", null);
  },
  methods: {
    // 处理群通知消息
    handleGroupNotification(eventList) {
      if (!Array.isArray(eventList) || eventList.length === 0) {
        return;
      }

      // 遍历事件列表，更新对应群的申请状态
      eventList.forEach((event) => {
        const { groupId, fromUid, receiveUid, groupReqStatus, groupReqType } = event;

        // 查找列表中匹配的申请记录
        const index = this.list.findIndex((item) => item.groupId === groupId);

        // 如果找到匹配的记录，更新状态
        if (index !== -1) {
          const listNew = _.cloneDeep(this.list);
          listNew[index].groupReqStatus = groupReqStatus;
          listNew[index].updateTime = Date.now();
          this.list = listNew;
        }
      });
    },

    handleUpdateList() {
      getGroupReqList({ pageNum: this.pageNum, pageSize: 100 }).then((res) => {
        console.log('getGroupReqList--',res)
        if (res && res.groupReqs) {
          let groupInfoList = [];
          res.groupReqs.forEach((item) => {
            let row = {
              content: "",
              createTime: Number(item.createTime),
              groupId: Number(item.groupId),
              groupReqStatus: item.groupReqStatus || 0,
              groupReqType: item.groupReqType,
              groupReqId: Number(item.groupReqId),
              pic: item.pic,
              name: item.groupName,
              remark: item.msg,
              groupHostUid: Number(item.groupHostUid),
              updateTime: Number(item.updateTime),
              targetUser: item.targetUser,
            };
            groupInfoList.push(row);
          });
          // console.log('>>>>>>>>>>>>>>>>> 108 handleUpdateList', res)
          this.list = groupInfoList;
        }
      });
    },
    check(groupReqId, item, flag, index, groupId) {
      let isAuditor = [2, 15].includes(item.groupReqType);

      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      if (item.groupHostUid == loginId) {
        isAuditor = true;
      }
      let methods = isAuditor ? groupCheckJoin : GroupUserCheckJoin;

      methods({
        groupReqId,
        flag,
      }).then((rt) => {
        if (rt.commonResult.errCode == 200) {
          window.$toast(this.$t("操作成功"));
          const listNew = _.cloneDeep(this.list);
          listNew[index].groupReqStatus = flag ? 1 : 2;
          this.list = listNew;
        } else {
          window.$toast(rt.commonResult.errMsg || "操作失败");
        }
      });
    },
  },
};
</script>
<style scoped lang="scss">
.groupInvitation {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  > h1 {
    margin: 31px 0 0 0;
    display: flex;
    height: 51px;
    padding: 0 16px;
    align-items: center;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    font-weight: 700;
    font-family: PingFangSC-Bold;
    color: #333;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
  }

  > ul {
    overflow-y: auto;
    position: absolute;
    left: 0;
    right: 0;
    top: 83px;
    bottom: 0;
    margin: 0;
    padding: 0;

    > li {
      height: 72px;
      position: relative;
      padding-left: 65px;
      padding-right: 150px;
      display: flex;
      justify-content: center;
      flex-direction: column;

      &::after {
        content: "";
        display: block;
        position: absolute;
        right: 0;
        bottom: 0;
        left: 65px;
        height: 1px;
        background: #ebebeb;
      }

      &:hover {
        &::after {
          background: #ccc;
        }
      }

      > img {
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
      }

      .top-info {
        width: 100%;
        display: flex;
        align-items: center;
        > h2 {
          font-family: PingFangSC-Bold;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #000;
          margin: 0;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 70%;
          margin-right: 5px;
        }
        .time {
          font-size: 12px;
          color: #999;
        }
      }

      > p {
        line-height: 20px;
        color: #2288f0;
        font-family: "PingFangSC-Light";
        font-size: 12px;
        // text-overflow: ellipsis;
        // overflow: hidden;
        // white-space: nowrap;
      }

      .right-info {
        position: absolute;
        right: 15px;

        > span {
          display: block;
          line-height: 30px;
          height: 30px;
          background: #eeeff3;
          color: #999b9e;
          width: 60px;
          text-align: center;
          border-radius: 5px;
        }

        > button {
          margin-left: 5px;
          border: 0;
          color: #fff;
          background: #666;
          line-height: 30px;
          padding: 0 10px;
          border-radius: 5px;
          width: 60px;
          text-align: center;
          cursor: pointer;

          &:hover {
            opacity: 0.8;
          }

          &.active {
            background: #3369fe;
          }
        }
      }
    }
  }

  .none-data-tip {
    text-align: center;
    color: #666;
    margin: 10px 0;
  }
}
</style>
