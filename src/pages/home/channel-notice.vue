<template>
  <div class="channelNotice">
    <h1>{{ $t("频道通知") }}</h1>
    <ul class="notify-box">
      <li v-for="(item, index) in list" :key="index">
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
      </li>
    </ul>
    <div v-if="list.length === 0" class="none-data-tip">
      {{ $t("暂无通知") }}
    </div>
  </div>
</template>
<script>
import { chatTime, generateUniqueId } from "@/utils/base";
import { getChannelEventList } from "@/api/imChannel";

// 事件
import eventBase from "@/event/base";

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
      pageSize: 100,
    };
  },
  async mounted() {
    await this.getChannelNoticeList();

    // 监听频道通知更新
    eventBase.fnCommunicationMonitoring(
      "channelNoticeUpdate",
      ["channelNoticeUpdate"],
      () => this.getChannelNoticeList()
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("channelNoticeUpdate", null);
  },
  methods: {
    async getChannelNoticeList() {
      try {
        const res = await getChannelEventList({
          pageNum: this.pageNum,
          pageSize: this.pageSize,
        });

        if (res && res.data && res.data.rowList) {
          // 格式化数据
          this.list = res.data.rowList.map(item => ({
            id: item.channelId,
            jumpPage: item.jumpPage,
            eventReqId: item.eventReqId || item.channelEventReqId,
            channelName: item.channelName,
            icon: item.icon,
            logoColor: item.logoColor || "#FF6B35",
            content: item.noticeMsg,
            sendTime: Number(item.createTime || item.updateTime || Date.now()),
          }));
        } else {
          this.list = [];
        }
      } catch (error) {
        console.error("获取频道通知列表失败:", error);
        this.list = [];
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
      padding-right: 15px;
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

