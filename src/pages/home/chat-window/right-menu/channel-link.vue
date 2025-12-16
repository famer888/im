<template>
  <div class="channel-link">
    <h4 class="title">{{ $t("频道别名") }}</h4>
    <div class="info">
      <a class="link" @click="copyTest(chatContent?.alias)">{{chatContent?.alias ? `@${chatContent?.alias}` : ""}}</a>
      <div class="code-entrance" @click="$emit('showQrCode')">
        <img class="code-icon" src="@/assets/images/chat/code.png" />
        <img class="more-icon" src="@/assets/images/chat/arrow-rgiht.png" />
      </div>
    </div>
  </div>
</template>

<script>
// 工具
import { copyToClipboard } from "@/utils/base";
export default {
  name: 'channelLink',
  props: ["chatContent"],
  methods: {
    copyTest(text) {
      if (text) {
        copyToClipboard(" @" + text + " ");
        window.$toast(this.$t("复制成功"));
      }
    },
  }
}
</script>

<style scoped lang="scss">
.channel-link {
  width: 100%;
  padding: 8px 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 55px;
  .title {
    font-size: 14px;
    color: #000;
    flex: 1;
  }
  .info {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .link {
    color: #178aff;
    cursor: pointer;
    word-wrap: break-word;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .code-entrance {
    display: flex;
    align-items: center;
    cursor: pointer;

    .code-icon {
      width: 22px;
      height: 22px;
      margin-left: 8px;
    }
    .more-icon {
      height: 22px;
    }
  }
}
</style>
