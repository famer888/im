<template>
  <section class="comMemberList" :class="{'show-detail': showDetail}">
    <div class="search" v-if="showDetail">
      <img src="@/assets/images/headNav/search-icon.png" />
      <img
        v-show="searchText"
        src="@/assets/images/headNav/search-close-icon.png"
        @click="searchText = ''"
      />
      <input type="text" :placeholder="$t('搜索')" v-model="searchText" />
      <span @click="handleGroupForceInit">
        <img
          src="@/assets/images/refresh.png"
          :class="{ updating: isUpdating }"
        />
        <span>{{ $t("群成员列表强制刷新") }}</span>
      </span>
      <div class="cancel" @click="showDetail = false">取消</div>
    </div>
    <div class="head" v-else>
       <div class="info" @click="showDetail = true">
          <span class="title">群成员({{ chatContent.memberCount || "" }})</span>
          <img class="icon-arrow" src="@/assets/images/common/right-arrow-a.png" />
       </div>
       <img class="icon-delete" v-if="[0, 1].includes(chatContent.memberType)" src="@/assets/images/common/user-delete.png" @click="showSelectMemberDialog = true" />
    </div>
    <ul
      :style="{
        paddingTop: `${showIndex * pageSize}px`,
        opacity: isUpdating ? 0.6 : 1,
        minHeight: memberListHeight + 'px',
      }"
    >
      <li
        v-for="item in searchList"
        :key="item.id"
        @click="handleMemberDialogShow(item)"
      >
        <ComImage :src="item.icon" type="friend" />
        <div>
          <h2>{{ item.name || item.nickName }}</h2>
          <p>
            {{ item.online ? $t("在线") : handleOnlineTime(item) }}
          </p>
        </div>
        <span v-if="item.type === 0" class="lord">
          {{ $t("群主") }}
        </span>
        <span v-else-if="item.type === 1">
          {{ $t("管理员") }}
        </span>
      </li>
    </ul>

    <ComGroupMemberSelectDilog
        v-if="showSelectMemberDialog"
        :memberList="memberInfoList"
        title="移出"
        @close="showSelectMemberDialog = false"
        @confirm="handelRemoveMember"
    >
    </ComGroupMemberSelectDilog>
  </section>
</template>
<script>
import _ from "lodash";
// api
import { groupEventForceInit, manageGroupMember } from "@/api/imGroup";

// 事件
import eventBase from "@/event/base";

import ComGroupMemberSelectDilog from "./group-member-select-dialog";

export default {
  props: ["chatContent", "showIndex", "memberInfoList", "friendList"],
  components: { ComGroupMemberSelectDilog },
  data() {
    return {
      searchText: "",
      pageSize: 40,
      isUpdating: false,
      memberListHeight: 0,
      memberList: [],
      showDetail: false,
      showSelectMemberDialog: false,
    };
  },
  watch: {
    memberInfoList: {
      handler(newInfo, oldInfo) {
        this.memberList = newInfo
      },
      immediate: false,
      deep: true
    }
  },
  created() {
    this.memberList = _.cloneDeep(this.memberInfoList)
  },
  computed: {
    /**
     * 搜索后的列表
     */
    searchList() {
      if (!this.searchText) {
        return this.memberList;
      }
      const regex = /^\d{2}[a-zA-Z0-9]{6}\d{2}$/
      const regex2 = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/
      // 68id生成规则： 两位数字 + 中间6位 大写字母和数字随机 + 两位数字
      // 68id可以修改，修改的规则是 长度6-10位，支持数字和字母组合
      const isMatch = regex.test(this.searchText) || regex2.test(this.searchText)
      const friend = this.friendList.find(item => item.identify == this.searchText)
      if (isMatch && friend) {
        console.log('匹配到68id')
       // 如果搜索的字符是符合68id规则的 则按照68id来搜索，因为群成员里不会返回68id，所以检测此id是否是好友，
       // 在的判断此好友是否在这个群里，按照此逻辑搜索过滤
       return this.memberList.filter(item => {
            return item.id == friend.id
          })
      } else {
        return this.memberList.filter(
        ({ nickName = "", name = "" }) =>
          nickName.toLowerCase().includes(this.searchText.toLowerCase()) ||
          name.toLowerCase().includes(this.searchText.toLowerCase())
        );
      }
      
    },
  },
  mounted() {
    // 初始化高度
    this.memberListHeight = this.memberInfoList.length * 50;

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "rightMenuMemberList",
      ["friendRemarkUpdate"],
      this.eventHandling
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("rightMenuMemberList", null);
  },
  methods: {
    /**
     * 处理事件
     */
    eventHandling(info, operator) {
      switch (operator) {
        case "friendRemarkUpdate": {
          // 好友备注修改
          const index = this.memberList.findIndex(
            (item) => item.id === info.id
          );

          if (index !== -1) {
            this.memberList[index].name = info.values.name;
            // 更新渲染
            this.memberList = _.cloneDeep(this.memberList);
          }
          break;
        }
        default:
      }
    },
    handelRemoveMember(members) {
      console.log('handelRemoveMember--', members)
      if(!members.length) {
        window.$toast("请至少选择一位群成员");
        return;
      }
      const ids = members.map(item => item.id)
      const params = {
        op: 1,
        groupId: this.chatContent.id,
        members: ids
      }
      manageGroupMember(params).then(res => {
         const { errCode } = res?.commonResult || {}
          if (errCode == 200) {
              window.$toast("移除成功");
              this.showSelectMemberDialog = false;
          } else {
              res?.errorDesc && window.$toast(res.errorDesc);
          }
      })
      console.log('handelRemoveMember--', params)
    },
    /**
     * 成员的会话框 显示
     */
    handleMemberDialogShow(info) {
      eventBase.fnCommunicationSendMsg({
        operator: "memberDialogShow",
        data: {
          values: {
            id: info.id,
            icon: info.icon,
            name: info.name,
            nickName: info.nickName,
            bfFriend: info.bfFriend,
          },
        },
      });
    },
    /**
     * 群强制更新
     */
    handleGroupForceInit() {
      if (!this.isUpdating) {
        this.isUpdating = true;
        // console.log('强制更新初始化当前群信息')
        groupEventForceInit({ groupIds: [this.chatContent.id] }).then((res) => {
          const errCode = _.get(res, "commonResult.errCode");

          if (errCode !== 200) {
            this.isUpdating = false;
            window.$toast("服务器繁忙，请稍后再试");
          }
        });
      }
    },
    handleOnlineTime(item) {
      // 小于1分钟，提示不久前在线
      // 小于1小时，提示多少分钟前在线
      // 小于1天，提示多少小时前在线
      // 小于1周，提示多少天前在线
      // 小于1个月，提示几周前在线
      // 大于1月以上，提示近期未上线
      const dateNow = Date.now();
      const minute = 1000 * 60; // 1分钟多少毫秒
      const hour = 1000 * 60 * 60 // 1 小时多少毫秒
      const day = 1000 * 60 * 60 * 24 // 1 天多少毫秒
      const week = 1000 * 60 * 60 * 24 * 7 // 1周多少毫秒
      const month = 1000 * 60 * 60 * 24 * 30 // 1月多少毫秒
      if (!item.createTime) { // 如果createTime为空，则提示近期不在线
        return this.$t('近期不在线')
      }
      const remainderTime = dateNow - item.createTime;
      if (remainderTime < minute) {
        return this.$t('不久前在线')
      }
      if (remainderTime < hour) {
        return Math.floor(remainderTime / minute) + this.$t('分钟前在线')
      }
      if (remainderTime < day) {
        return Math.floor(remainderTime / hour) + this.$t('小时前在线')
      }
      if (remainderTime < week) {
        return Math.floor(remainderTime / day) + this.$t('天前在线')
      }
      if (remainderTime < month) {
        return Math.floor(remainderTime / week) + this.$t('周前在线')
      } else {
        return this.$t('近期不在线')
      }
    }
  },
};
</script>
<style scoped lang="scss">
.show-detail {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #ffffff;
  border-top: none !important;
}
.comMemberList {
  padding-top: 10px;
  border-top: 10px solid #f5f5f5;

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px 10px;
    box-sizing: border-box;

    .info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .title {
        font-size: 14px;
        color: #178AFF;
      }

      .icon-arrow {
        height: 10px;
        margin-left: 4px;
      }
    }

    .icon-delete {
      height: 16px;
      cursor: pointer;
    }
  }

  > .search {
    height: 30px;
    position: relative;
    background: #f4f6f9;
    border-radius: 4px;
    margin: 0 30px 10px 30px;

    .cancel {
      position: absolute;
      right: -28px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      cursor: pointer;
    }

    > img {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);

      &:nth-child(1) {
        left: 5px;
        width: 15px;
      }

      &:nth-child(2) {
        right: 10px;
        cursor: pointer;
      }
    }

    > input {
      padding: 0 12px 0 24px;
      box-sizing: border-box;
      border-radius: 4px;
      width: 100%;
      height: 100%;
      background: none;
    }

    > span {
      position: absolute;
      height: 20px;
      width: 20px;
      top: 5px;
      left: -25px;
      cursor: pointer;

      &:hover {
        > img {
          opacity: 0.8;
        }
        > span {
          display: block;
        }
      }

      > img {
        display: block;
        width: 100%;
        height: 100%;

        &.updating {
          animation: spin 1s linear infinite;
        }
      }

      @-webkit-keyframes spin {
        from {
          -webkit-transform: rotate(0deg);
        }
        to {
          -webkit-transform: rotate(360deg);
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      > span {
        display: none;
        position: absolute;
        top: 35px;
        right: 1px;
        line-height: 26px;
        padding: 0 8px;
        background: #3daee9;
        color: #fff;
        border: 1px solid #fff;
        border-radius: 5px;
        white-space: nowrap;
        font-size: 12px;
        font-weight: normal;
        z-index: 9;

        &::before,
        &::after {
          position: absolute;
          top: -10px;
          right: 3px;
          display: block;
          font-size: 0;
          line-height: 0;
          border-color: transparent transparent #3daee9;
          border-style: solid;
          border-width: 5px;
          content: "";
        }

        &::after {
          top: -9px;
          border-color: transparent transparent #3daee9;
        }
      }
    }
  }

  > ul {
    margin: 0;
    padding: 0;

    > li {
      height: 50px;
      position: relative;
      padding-left: 50px;
      padding-right: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      cursor: pointer;

      &:hover {
        background: #f0f0f0;
      }

      > img {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 30px;
        height: 30px;
        border-radius: 50%;
        object-fit: cover;
      }

      > div {
        > h2 {
          line-height: 20px;
          font-size: 14px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 25px;
          line-height: 25px;
          width: 150px;
        }

        > p {
          font-size: 12px;
          color: #b9babe;
          line-height: 15px;
        }
      }

      > span {
        font-size: 12px;
        color: #fff;
        padding: 2px 6px;
        border-radius: 99px;
        background: #fb9203;
        flex-shrink: 0;

        &.lord {
          background: #3369fe !important;
        }
      }
    }
  }
}
</style>