<template>
  <div class="comChatsText">
    <ComLableEle
      v-for="(item, index) in tagList"
      :key="index"
      :info="item"
      :isNotification="id === 'invitation'"
    />
  </div>
</template>
<script>
import {
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

import eventCommon from "@/event/common";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

export default {
  components: {
    ComLableEle,
  },
  props: ["text", "id", "atUsers"],
  computed: {
    tagList() {
      let htmlString = this.text;

      if (this.atUsers && this.atUsers.length) {
        // 给atUsers增加备注名
        const friendRemarks = eventCommon.fnFriendRemarksGet();
        this.atUsers.forEach((item) => {
          const remarkObj = friendRemarks.find((i) => i.id === item.uid);
          let name = item.name;
          if (remarkObj) {
            name = remarkObj.name || "";
          }
          if (name && item.nickName) {
            htmlString = htmlString.replace("@" + item.nickName, "@" + name);
          }
        });
      }

      // 字符串替换为表情图片标签
      htmlString = strReplaceEmojiImgLabel(htmlString);

      // 拆分html
      return splitHtmlStringToObjects(htmlString);
    },
  },
};
</script>
<style scoped lang="scss">
.comChatsText {
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  height: 20px;
  display: inline;

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
