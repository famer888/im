<template>
  <div class="channel-link">
    <h4 class="title">频道链接</h4>
    <div class="info">
      <a class="link" @click="copyTest(chatContent?.link)">{{chatContent?.link || ""}}</a>
      <div class="code-entrance" @click="$emit('showQrCode')">
        <img class="code-icon" src="@/assets/images/channel/qrcode.png" />
        <img class="more-icon" src="@/assets/images/channel/more.png" />
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
      copyToClipboard(" " + text + " ");
      window.$toast(this.$t("复制成功"));
    },
  }
}
</script>

<style scoped lang="scss">
.channel-link {
  width: 100%;
  padding: 8px 10px;
  box-sizing: border-box;

  .title {
    font-size: 14px;
    color: #000;
  }
  .info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  .link {
    color: #178aff;
    cursor: pointer;
    word-wrap: break-word;
    width: 200px;
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