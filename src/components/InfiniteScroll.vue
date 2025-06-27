<template>
  <div 
    class="scroll-container"
    @scroll="handleScroll"
    :style="{ maxHeight: height, overflow: 'auto' }"
  >
    <slot></slot>
    <div v-if="loading" class="loading-indicator">
      加载中...
    </div>
    <div v-if="noMore" class="no-more">
      没有更多数据了
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfiniteScroll',
  props: {
    // 距离底部多少像素时触发加载
    offset: {
      type: Number,
      default: 100
    },
    // 容器高度
    height: {
      type: String,
      default: '500px'
    },
    // 是否正在加载
    loading: {
      type: Boolean,
      default: false
    },
    // 是否没有更多数据
    noMore: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleScroll(e) {
      const el = e.target;
      const scrollHeight = el.scrollHeight;
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      
      // 判断是否滚动到离底部指定像素以内
      if (scrollHeight - scrollTop - clientHeight <= this.offset && !this.loading && !this.noMore) {
        this.$emit('load');
      }
    }
  }
}
</script>

<style scoped>
.scroll-container {
  position: relative;
}

.loading-indicator,
.no-more {
  text-align: center;
  padding: 10px;
  color: #999;
}
</style>