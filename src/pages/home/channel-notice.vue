<template>
  <div class="channelNotice">
    <h1>{{ $t("频道通知") }}</h1>
    <ul class="notify-box" ref="notifyBox" @scroll="handleScroll">
      <li
        v-for="(item, index) in list"
        :key="index"
        :class="{ 'clickable': item.jumpPage }"
        @click="handleChannelClick(item)"
      >
        <ComTextAvatar
          v-if="!item.icon"
          class="textAvatar"
          :color="item.logoColor"
          :value="item.channelName"
          :id="item.id"
          width="40px"
          height="40px"
        />
        <ComImage v-else :src="item.icon" type="icon" />
        <div class="top-info">
          <h2>{{ item.channelName }}</h2>
          <span class="time"> · {{ chatTime(item.sendTime) }}</span>
        </div>
        <p class="line-notify">{{ item.content }}</p>
        <div v-if="item.id && item.reqStatus >= 0" class="right-info">
          <template v-if="item.reqStatus === 0">
            <button @click.stop="check(item.id, item, false, index)">
              {{ $t("拒绝") }}
            </button>
            <button
              class="active"
              @click.stop="check(item.id, item, true, index)"
            >
              {{ $t("通过") }}
            </button>
          </template>
          <span v-else>{{ reqStatusMap[item.reqStatus] }}</span>
        </div>
      </li>
      <li v-if="loading" class="loading-tip">{{ $t("加载中...") }}</li>
      <li v-if="!hasMore && list.length > 0" class="no-more-tip">{{ $t("没有更多了") }}</li>
    </ul>
    <div v-if="list.length === 0 && !loading" class="none-data-tip">
      {{ $t("暂无通知") }}
    </div>
  </div>
</template>
<script>
import { chatTime, generateUniqueId } from "@/utils/base";
import { getChannelEventList, getChannelDetail, channelCheckJoin } from "@/api/imChannel";
import { Cache } from "@/cache";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

// 组件
import ComTextAvatar from "@/components/text-avatar.vue";

export default {
  components: {
    ComTextAvatar,
  },
  data() {
    return {
      moduleName: "频道通知",
      list: [],
      chatTime,
      pageNum: 1,
      pageSize: 10,
      loading: false,
      hasMore: true,
      reqStatusMap: {
        1: "已同意",
        2: "已拒绝",
        3: "已失效",
      },
    };
  },
  async mounted() {
    await this.getChannelNoticeList();

    // 监听频道通知更新
    eventBase.fnCommunicationMonitoring(
      "channelNoticeUpdate",
      ["channelNoticeUpdate"],
      () => this.refreshList()
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("channelNoticeUpdate", null);
  },
  methods: {
    // 点击频道通知，跳转到频道
    async handleChannelClick(item) {
      // 如果 jumpPage 不为真或者不等于频道ID，则不跳转
      if (!item.jumpPage || !item.channelId) {
        return;
      }

      try {
        let channelInfo = null;
        const res = await getChannelDetail({ channelId: item.channelId });
        if (!res?.data?.memberType || res?.data?.memberType < 0) {
          return window.$toast(this.$t("此频道已失效或过期"));
        } else if (res?.data) {
          channelInfo = {
            channelId: res.data.channelId,
            channelName: res.data.channelName,
            icon: res.data.icon,
            logoColor: res.data.logoColor,
            adminPrivacy: res.data.adminPrivacy,
          };
        }

        if (channelInfo) {
          // 跳转到频道聊天窗口
          eventBase.fnCommunicationSendMsg({
            operator: 'activeChange',
            data: {
              ...channelInfo,
              id: channelInfo.channelId,
              name: channelInfo.channelName,
              pic: channelInfo.icon,
              type: 'channel',
              comType: 'chat',
            },
          });
        } else {
          window.$toast(this.$t("此频道已失效或过期"));
        }
      } catch (error) {
        console.error("跳转频道失败:", error);
        window.$toast(this.$t("此频道已失效或过期"));
      }
    },

    // 查找频道信息：本地列表 -> 缓存
    async findChannelInfo(channelId) {
      const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

      // 1. 从缓存的频道列表中查找
      const channelList = await Cache(`${loginId}-ChannelList`);
      if (channelList && channelList.length > 0) {
        const channel = channelList.find(item => item.channelId === channelId);
        if (channel) {
          return channel;
        }
      }
      // 2. 从缓存的聊天列表中查找
      const chatList = await Cache(`${loginId}MessageChannelList`);
      if (chatList && chatList.length > 0) {
        const chatChannel = chatList.find(item => item.id === channelId && item.type === 'channel');
        if (chatChannel) {
          return {
            channelId: chatChannel.id,
            channelName: chatChannel.name || chatChannel.channelName,
            icon: chatChannel.icon || chatChannel.pic,
            logoColor: chatChannel.logoColor,
            adminPrivacy: chatChannel.adminPrivacy,
          };
        }
      }

      return null;
    },

    // 滚动处理
    handleScroll(e) {
      const el = e.target;
      const scrollHeight = el.scrollHeight;
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;

      // 触底阈值为50px
      if (scrollHeight - scrollTop - clientHeight < 50) {
        this.loadMore();
      }
    },

    // 加载更多
    async loadMore() {
      if (this.loading || !this.hasMore) {
        return;
      }

      this.pageNum++;
      await this.getChannelNoticeList(true);
    },

    // 刷新列表
    async refreshList() {
      this.pageNum = 1;
      this.hasMore = true;
      await this.getChannelNoticeList(false);
    },

    // 审核频道申请
    check(id, item, flag, index) {
      channelCheckJoin({
        id,
        flag,
      }).then((res) => {
        if (res.code === 200 || res.errCode === 200) {
          window.$toast(this.$t("操作成功"));
          const listNew = _.cloneDeep(this.list);
          listNew[index].reqStatus = flag ? 1 : 2;
          this.list = listNew;
        } else {
          window.$toast(res.msg || res.errMsg || "操作失败");
        }
      });
    },

    async getChannelNoticeList(isLoadMore = false) {
      if (this.loading) return;

      try {
        this.loading = true;
        const res = await getChannelEventList({
          pageNum: this.pageNum,
          pageSize: this.pageSize,
        });
        if (res && res.data && res.data.rowList) {
          // 格式化数据
          const newList = res.data.rowList.map(item => ({
            id: String(item.id),
            jumpPage: item.jumpPage,
            channelName: item.channelName,
            channelId: item.channelId,
            uid: item.uid,
            icon: item.icon,
            logoColor: item.logoColor || "#FF6B35",
            content: item.noticeMsg,
            sendTime: Number(item.createTime || item.updateTime || Date.now()),
            reqStatus: item.reqStatus || 0,
            reqType: item.reqType,
          }));

          if (isLoadMore) {
            // 追加数据
            this.list = [...this.list, ...newList];
          } else {
            // 替换数据
            this.list = newList;
          }

          // 判断是否还有更多数据
          if (newList.length < this.pageSize) {
            this.hasMore = false;
          }
        } else {
          if (!isLoadMore) {
            this.list = [];
          }
          this.hasMore = false;
        }
      } catch (error) {
        console.error("获取频道通知列表失败:", error);
        if (!isLoadMore) {
          this.list = [];
        }
        this.hasMore = false;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
<style scoped lang="scss">
.channelNotice {
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
        background: #f9f9f9;
        &::after {
          background: #ccc;
        }
      }

      &.clickable {
        cursor: pointer;
      }

      > img,
      > .textAvatar {
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
        color: #666;
        font-family: "PingFangSC-Light";
        font-size: 12px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
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

    .loading-tip,
    .no-more-tip {
      text-align: center;
      padding: 16px 0;
      font-size: 12px;
      color: #999;
      height: auto !important;

      &::after {
        display: none !important;
      }

      &:hover {
        background: transparent !important;
      }
    }
  }

  .none-data-tip {
    text-align: center;
    color: #999;
    margin-top: 100px;
    font-size: 14px;
  }
}
</style>

