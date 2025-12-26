<template>
  <div class="comGroupAliasQrcode" @click="$emit('showGroupQrCode')">
    <h3>{{ $t("群别名") }}</h3>
    <div>
      <span @click.stop="copyTest('@' + chatContent.groupAliasName)">
        @{{ chatContent.groupAliasName }}
      </span>
      <img
        class="code"
        src="@/assets/images/chat/code.png"
        @click="$emit('showGroupQrCode')"
      />
      <img class="arrow" src="@/assets/images/chat/arrow-rgiht.png" />
    </div>
  </div>
</template>
<script>
// 工具
import { copyToClipboard } from "@/utils/base";

export default {
  props: ["chatContent"],
  methods: {
    copyTest(text) {
      copyToClipboard(" " + text + " ");
      window.$toast(this.$t("复制成功"));
    },
  },
};
</script>
<style scoped  lang="scss">
.comGroupAliasQrcode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 10px;
  box-sizing: border-box;
  border-bottom: 10px solid #f5f5f5;
  cursor: pointer;
  height: 65px;

  > h3 {
    font-size: 14px;
    color: #000;
    margin: 0;
    flex-shrink: 0;
  }

  > div {
    display: flex;
    align-items: center;

    > span {
      font-size: 14px;
      color: #178aff;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      width: 100%;

      &:hover {
        opacity: 0.8;
      }
    }

    .code {
      width: 22px;
      height: 22px;
      margin-left: 8px;
    }
  }
}
</style>
