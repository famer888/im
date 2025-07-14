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
       height="380px"
       @load="this.nextPage"
     >
      <ul v-if="listVisible">
        <li class="channel-item" v-for="(item, index) in listData" :key="'channel'+index" :class="{ active: id === item.channelId }"
          @click="handleClick(item)">
          <textAvatar class="textAvatar"  :value="item.channelName" :id="item.channelId" />
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