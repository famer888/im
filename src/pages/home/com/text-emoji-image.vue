<template>
  <div class="comTextEmojiImage">
    <ComLableEle v-for="(item, index) in tagList" :key="index" :info="item" :currentChatId="currentChatId" />
  </div>
</template>
<script>
import {
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

export default {
  components: {
    ComLableEle,
  },
  props: ["text", "currentChatId"],
  computed: {
    tagList() {
      // 字符串替换为表情图片标签
      const htmlString = strReplaceEmojiImgLabel(this.text);

      // 拆分html
      return splitHtmlStringToObjects(htmlString);
    },
  },
};
</script>
<style scoped lang="scss">
.comTextEmojiImage {
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  height: 20px;

  > span {
    color: #aaaaaa;
    font-size: 12px;
  }

  > img {
    display: inline-block;
    position: relative;
    top: 3px;
    height: 15px;
  }
}
</style>