<template>
  <div class="comSearch">
    <div v-show="archiveListShow" class="archive-title">{{ $t("归档会话") }}
      <!-- <span class="unreadCount" v-if="unreadCount > 0">{{ unreadCount - archiveUnreadCount }}</span> -->
    </div>
    <div class="search-line">
      <div class="input-box">
        <img class="icon" src="@/assets/images/headNav/search-icon.png" alt="" />
        <input
          :value="searchText"
          ref="search"
          :placeholder="
            addAction ? $t('搜索手机号/ID/群别名') : placeholder || $t('搜索')
          "
          type="text"
          @input="handleChange"
          @focus="(e) => $emit('focus', e)"
        />
        <img
          v-if="searchText !== ''"
          class="clear"
          src="@/assets/images/headNav/search-close-icon.png"
          @click="() => $emit('onChange', '')"
        />
      </div>
      <span v-if="archiveListShow" class="back" @click="handleBack">
        <img class="back-icon" src="@/assets/images/setting/back.png" />
        
      </span>
       <slot name="right"></slot>
    </div>
  </div>
</template>
<script>
export default {
  props: ["value", "searchText", "placeholder", "archiveListShow", "unreadCount", "unreadObj", "archiveIdStrList"],
  data() {
    return {
      addAction: false,
    }
  },
  computed: {
    archiveUnreadCount() {
      return this.archiveIdStrList.reduce((accumulator, archiveIdStr) => {
        return accumulator + this.unreadObj[archiveIdStr]
          ? this.unreadObj[archiveIdStr].count
          : 0;
      }, 0);
    }
  },
  mounted() {
    // console.log({unreadObj: this.unreadObj, unreadCount: this.unreadCount, archiveIdStrList: this.archiveIdStrList}, '48 ------------48')
  },
  methods: {
    handleChange(e) {
      this.$emit('onChange', e.target.value)
    },
    handleBack() {
      this.$emit('handleBack', {bool: false, searchText: ''})
    }
  }
};
</script>

<style scoped lang="scss">
.comSearch {
  .add-btn {
    width: 24px;
    height: 24px;
    margin-left: 10px;
  }
  .add-icon {
    &:hover {
      opacity: 0.5;
    }
  }
  .archive-title{
    text-align: center;
    padding-top: 10px;
    padding-bottom: 10px;
    .unreadCount{
      display: inline-block;
      width: 20PX;
      height: 16PX;
      text-align: center;
      border-radius: 8PX;
      margin-left: 4PX;
      font-size: 12PX;
      color: #999;
      background-color: #eee;
    }
  }
  .search-line{
    display: flex;
  .back{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    opacity: 0.8;
    .back-icon{
      width: 50%;
      height: 45%;
    }
  }
  .input-box {
    flex: 1;
    position: relative;
    padding: 0 8px;
    display: flex;
    align-items: center;
    height: 26px;
    line-height: 26px;
    background: rgb(243, 243, 243);
    border-radius: 4px;
    font-size: 12px;

    input {
      padding: 0 5px;
      height: 26px;
      line-height: 26px;
      background: rgb(243, 243, 243);
      flex: auto;
    }

    input::-webkit-input-placeholder {
      /* WebKit browsers */
      color: #999;
      font-size: 12px;
    }
    .clear{
      position: absolute;
      right: 4px;
    }
    .icon {
      width: 16px;
      height: 16px;
    }
  }
  }
}
</style>
