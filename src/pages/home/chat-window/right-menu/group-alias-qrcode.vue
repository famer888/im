<template>
  <div class="comGroupAliasQrcode">
    <h3 class="title">{{ $t("群别名") }}</h3>
    <div class="info">
      <span class="link" @click.stop="copyTest('@' + chatContent.groupAliasName)">
        @{{ chatContent.groupAliasName }}
      </span>
      <div class="code-entrance" @click="$emit('showGroupQrCode')">
        <img class="code-icon" src="@/assets/images/chat/code.png" />
        <img class="more-icon" src="@/assets/images/channel/more.png" />
      </div>
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
<style scoped lang="scss">
.comGroupAliasQrcode {
  width: 100%;
  padding: 8px 10px;
  box-sizing: border-box;
  border-bottom: 10px solid #f5f5f5;

  .title {
    font-size: 14px;
    color: #000;
    margin: 0;
  }

  .info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .link {
    color: #178aff;
    cursor: pointer;
    word-wrap: break-word;
    width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      opacity: 0.8;
    }
  }

  .code-entrance {
    display: flex;
    align-items: center;
    cursor: pointer;

    .code-icon {
      height: 18px;
    }
    .more-icon {
      height: 20px;
    }
  }
}
</style>
