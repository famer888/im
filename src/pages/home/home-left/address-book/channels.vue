<template>
  <div class="channels-root">
    <h2 @click="
        listVisible = !listVisible;
        $emit('onChange', listVisible);
      ">
      频道
      <img src="@/assets/images/headNav/jt-icon.png" :style="listVisible ? {} : { transform: 'rotate(180deg)' }" />
    </h2>
    <InfiniteScroll
      v-show="listVisible"
      :noMore="noMore"
      :loading="loading"
       height="356px"
       @load="this.nextPage"
     >
      <ul v-if="listVisible">
        <li class="channel-item" v-for="(item, index) in listData" :key="'channel'+index" :class="{ active: id === item.channelId }"
          @click="handleClick(item)">
          <textAvatar v-if="item.type === 'channel' && !item.pic" class="textAvatar"  :value="item.channelName" :id="item.channelId" />
          <ComImage v-else :src="item.icon" :type="item.type" />
          <h3>{{ item.channelName.replaceAll("🪵", "?") }}</h3>
        </li>
      </ul>
    </InfiniteScroll>

  </div>
</template>
<script>
// 组件
import InfiniteScroll from "@/components/InfiniteScroll"
import textAvatar from '@/components/text-avatar';

// api
import { getChannelList } from '@/api/imChannel';

// 工具
import { Cache } from '@/cache';

// 事件
import eventBase from '@/event/base';
import eventChannel from '@/event/channel';
import eventCommon from '@/event/common';

export default {
  props: ['show', 'id'],
  components: { textAvatar, InfiniteScroll },
  data() {
    return {
      noMore: false,
      loading: false,
      listVisible: true,
      listData: [],
      pageNum: 1,
      pageSize: 10,
    }
  },
  computed: {
    listHeight: function () {
      return this.list.filter((item) => item.bfAddress).length * 59 + 'px'
    },
  },
  mounted() {
    this.getListData()

    // 监听频道更新事件
    eventBase.fnCommunicationMonitoring(
      "channels",
      ["channelUpdate"],
      this.handleChannelUpdate
    );
  },
  beforeDestroy() {
    // 移除事件监听
    eventBase.fnCommunicationMonitoring("channels", null);
  },
  methods: {
    nextPage() {
      this.loading = true;
      this.pageNum += 1;
      this.getListData()
    },
    async getListData() {
      this.loading = true;
      getChannelList({ pageNum: this.pageNum, pageSize: this.pageSize }).then(
        (res) => {
          const list = res.data?.rowList || []
          this.listData = [...this.listData, ...list]
          this.loading = false;
          if (list?.length < this.pageSize) {
            this.noMore = true;
          }
        }
      )
    },
    handleClick(item) {
      // console.log('>>>>>>>>>>>>>>>>> 56 Channel', item)
      this.handleToChat(item)
      // 跳转频道详情页
      // eventBase.fnCommunicationSendMsg({
      //   operator: 'activeChange',
      //   data: { ...item, comType: 'detailsChannel' },
      // })
    },
    /**
     * 到群聊天窗
     */
    handleToChat(info) {
      const data = {
        ...info,
        id: info.channelId,
        name: info.channelName,
        type: 'channel',
        comType: 'detailsChannel',
      }

      // console.log('>>>>>>>>>>>>>>>>> 99 detail/chanel', data)
      eventBase.fnCommunicationSendMsg({
        operator: 'activeChange',
        data,
      })
    },
    /**
     * 处理频道更新事件
     */
    handleChannelUpdate(info) {
      if (!info || !info.channelId) return;

      const { channelId, values } = info;
      const index = this.listData.findIndex((item) => item.channelId === channelId);

      if (index !== -1) {
        // 更新频道名称
        if (values.channelName) {
          this.listData[index].channelName = values.channelName;
        }
        // 更新频道图标
        if (values.icon) {
          this.listData[index].icon = values.icon;
        }
        // 触发视图更新
        this.$set(this.listData, index, { ...this.listData[index] });
      }
    },
  },
}
</script>

<style scoped>
.textAvatar {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
