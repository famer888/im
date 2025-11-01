<template>
  <section class="comMemberList">
    <div class="search">
      <img src="@/assets/images/headNav/search-icon.png" />
      <img
        v-show="searchText"
        src="@/assets/images/headNav/search-close-icon.png"
        @click="searchText = ''"
      />
      <input type="text" :placeholder="$t('搜索')" v-model="searchText" />
    </div>
    <ul
      :style="{
        paddingTop: `${showIndex * pageSize}px`,
        opacity: isUpdating ? 0.6 : 1,
        minHeight: memberListHeight + 'px',
      }"
      v-infinite-scroll="nextPage" 
      :infinite-scroll-disabled="loading || isEnd" 
      infinite-scroll-distance="50" 
    >
      <li
        v-for="item in searchList"
        :key="item.id"
        @click="handleMemberDialogShow(item)"
      >
        <ComImage :src="item.userInfoDTO.icon" type="friend" />
        <div>
          <h2>{{ getRemark(item.userInfoDTO) || item.userInfoDTO.nickName }}</h2>
          <p>
            {{ item.userInfoDTO.lastTime ? $t("在线") : handleOnlineTime(item.userInfoDTO.lastTime) }}
          </p>
        </div>
        <span v-if="item.memberType === 1" class="lord">
          所有者
        </span>
        <span v-else-if="item.memberType === 2">
          {{ $t("管理员") }}
        </span>
      </li>
    </ul>
  </section>
</template>
<script>
import _ from "lodash";
// api
import { groupEventForceInit } from "@/api/imGroup";

// 事件
import eventBase from "@/event/base";
import eventCommon from '@/event/common';

// 获取频道
import { getChannelUsers } from "@/api/imChannel";

// 工具
import { formatChannelManages } from "@/utils/formats";

export default {
  props: ["chatContent", "showIndex", "friendList"],
  data() {
    return {
      searchText: "",
      isUpdating: false,
      memberListHeight: 0,
      memberList: [],
      pageNum: 1,
      pageSize: 20,
      loading: false, // 加载中
      isEnd: false, // 是否加载完全部成员 
    };
  },
  inject: ["provideChannelUserList"],
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
        (item) =>
          item.userInfoDTO.nickName.toLowerCase().includes(this.searchText.toLowerCase())
        );
      }

    },
  },
  mounted() {
    this.memberList = this.provideChannelUserList();
    // 初始化高度
    this.memberListHeight = this.memberList.length * 50;

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "rightMenuMemberList",
      [
        "friendRemarkUpdate",
        "channelNextPageEnd",
      ],
      this.eventHandling
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("rightMenuMemberList", null);
  },
  methods: {
    // 下一页
    nextPage() {
      console.log('nextPage--', this.isEnd)
      if(!this.loading && !this.isEnd && this.memberList.length) {
        this.loading = true;
        this.pageNum += 1;
        this.handleChannelMemberGet();
      }
    },
    async handleChannelMemberGet() {
      const { channelId, adminPrivacy } = this.chatContent;
      if( !channelId ) return
      const prams = {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        channelId
      }
      let newList = [];
      if(adminPrivacy) {
       const res = await getChannelUsers(prams);
        newList = res.data?.rowList || [];
      } else {
       const res = getChannelManages(prams)
        newList = formatChannelManages(res.data?.rowList || []);
      }
      this.loading = false;
      if(newList?.length < this.pageSize) {
        this.isEnd = true;
      }
      this.memberList = this.sortList([...this.memberList, ...newList]);
    },
    getRemark(info) {
       if(!info?.uid) return "";
       const friendRemarks = eventCommon.fnFriendRemarksGet();
       const data = friendRemarks.find(item => item.id === info.uid)
       if(data) {
        return data.name;
       }
    },
    /**
     * 排序方法：先按memberType升序，再按lastTime降序（最近的排前面）
     * @param {Array} list - 需要排序的数组
     * @returns {Array} 排序后的新数组（不修改原数组）
     */
    sortList(list) {
      // 深拷贝数组，避免修改原数组
      const sortedList = [...list];
      
      sortedList.sort((a, b) => {
        // 1. 先按 memberType 升序排序
        if (a.memberType !== b.memberType) {
          // 处理可能的 undefined 情况（确保 undefined 排在最后）
          if (a.memberType === undefined) return 1;
          if (b.memberType === undefined) return -1;
          return a.memberType - b.memberType; // 数字类型升序
        }
        
        // 2. memberType 相同则按 lastTime 降序排序（最近的排前面）
        const timeA = a.userInfoDTO?.lastTime || 0; // 处理可能的 undefined
        const timeB = b.userInfoDTO?.lastTime || 0;
        
        // 时间戳大的排前面（降序）
        return timeB - timeA;
      });
      
      return sortedList;
    },

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
    /**
     * 成员的会话框 显示
     */
    handleMemberDialogShow(info) {
      eventBase.fnCommunicationSendMsg({
        operator: "memberDialogShow",
        data: {
          values: {
            id: info.userInfoDTO.uid,
            icon: info.userInfoDTO.icon,
            // name: info.userInfoDTO.name,
            nickName: info.userInfoDTO.nickName,
            // bfFriend: info.bfFriend,
            channelId: this.chatContent.id,
          },
        },
      });
    },
    handleOnlineTime(createTime) {
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
      if (!createTime) { // 如果createTime为空，则提示近期不在线
        return this.$t('近期不在线')
      }
      const remainderTime = dateNow - createTime;
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
.comMemberList {
  padding-top: 10px;
  border-top: 10px solid #f5f5f5;

  > .search {
    height: 30px;
    position: relative;
    background: #f4f6f9;
    border-radius: 4px;
    margin: 0 10px 10px 10px;

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
      right: -25px;
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
        top: -35px;
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

        &::before,
        &::after {
          position: absolute;
          bottom: -10px;
          right: 3px;
          display: block;
          font-size: 0;
          line-height: 0;
          border-color: #3daee9 transparent transparent;
          border-style: solid;
          border-width: 5px;
          content: "";
        }

        &::after {
          bottom: -9px;
          border-color: #3daee9 transparent transparent;
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
