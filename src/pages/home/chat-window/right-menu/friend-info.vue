<template>
  <div class="comFriendInfo">
    <ComImage :src="chatContent.pic" type="friend" />
    <h2>
      {{ chatContent.name || chatContent.nickName }}
    </h2>
    <p>
      ID:
      {{ chatContent.identify }}
      <span @click="copyTest(chatContent.identify)">{{ $t("复制") }}</span>
    </p>
  </div>
</template>
<script>
// 工具
import { copyToClipboard } from "@/utils/base";

// 事件
import eventCommon from "@/event/common";

export default {
  props: ["chatContent"],
  methods: {
    copyTest(text) {
      eventCommon.fnIdCopyRU(text);

      copyToClipboard(text);
      window.$toast(this.$t("复制成功"));
    },
  },
};
</script>
<style scoped lang="scss">
.comFriendInfo {
  position: relative;
  padding: 20px 10px 20px 60px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 85px;

  > img {
    position: absolute;
    width: 45px;
    height: 45px;
    object-fit: cover;
    left: 10px;
    border-radius: 50%;
  }

  > h2 {
    padding: 0;
    margin: 0;
    line-height: 25px;
    font-size: 16px;
    font-weight: bold;
    font-family: PingFangSC-Bold;
  }

  > p {
    width: 100%;
    display: flex;
    font-size: 12px;
    align-items: center;

    > span {
      background: #326aff;
      color: #ffffff;
      width: 36px;
      height: 20px;
      border-radius: 4px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      margin-left: 10px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>