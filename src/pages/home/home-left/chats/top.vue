<template>
  <div class="comChatsTop">
    <h2>{{ $t("归档会话") }}</h2>
    <span class="back" @click="$emit('back')">
      <img src="@/assets/images/setting/back.png" />
      <span v-if="unreadCount > 0">{{ unreadCount }}</span>
    </span>
    <div>
      <ComSearch
        :searchText="searchText"
        @onChange="handleChange"
        :isArchive="true"
        key="archibe-search"
      />
    </div>
  </div>
</template>
<script>
import ComSearch from "@/pages/home/com/search.vue";

export default {
  components: {
    ComSearch,
  },
  props: ["searchText", "unreadCount"],
  inject: ["provideSearchText"],
  methods: {
    handleChange(value) {
      this.provideSearchText(value)
    }
  }
};
</script>
<style lang="scss" >
.comChatsTop {
  position: absolute;
  top: -71px;
  z-index: 10;
  left: 0;
  right: 0;
  height: 71px;
  background: #fff;

  > h2 {
    margin: 0;
    padding: 0;
    text-align: center;
    height: 32px;
    line-height: 32px;
    font-size: 14px;
    color: #666;
  }

  > span {
    position: absolute;
    display: block;
    z-index: 10;
    width: 18px;
    height: 18px;
    right: 8px;
    top: 39px;
    border: 1px solid #999;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }

    > img {
      display: block;
      width: 16px;
      margin: 0;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    > span {
      position: absolute;
      right: -12px;
      top: -15px;
      margin-top: 4px;
      padding: 1px 7px;
      display: inline-block;
      font-size: 12px;
      background: #f44e5a;
      font-weight: 400;
      border-radius: 10px;
      transform: scale(0.86);
      color: #fff;
      text-align: center;
      white-space: nowrap;
      z-index: 2;
    }
  }

  > div {
    position: absolute;
    right: 40px;
    left: 16px;
    top: 35px;
  }
}
</style>