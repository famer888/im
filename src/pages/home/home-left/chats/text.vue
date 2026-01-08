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
        // 收集需要替换的用户信息
        const replacementList = [];
        this.atUsers.forEach((item) => {
          let name = item.name;
          if (!name) {
            const remarkObj = friendRemarks.find((i) => i.id === item.uid);
            if (remarkObj) {
              name = remarkObj.name || "";
            }
          }
          if (name && item.nickName) {
            replacementList.push({ nickName: item.nickName, name: name });
          }
        });
        // 优化替换逻辑：按昵称长度降序排序，防止短名误匹配长名
        if (replacementList.length > 0) {
          replacementList.sort((a, b) => b.nickName.length - a.nickName.length);
          const nameMap = {};
          replacementList.forEach(item => { nameMap[item.nickName] = item.name; });
          // 转义正则特殊字符
          const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = replacementList.map(u => escapeRegExp(u.nickName)).join('|');
          // 匹配 @nickName 后面跟随 结束符、空白字符(包含空格、换行等)或@
          const reg = new RegExp(`@(${pattern})(?=$|[\\s@])`, 'g');
          htmlString = htmlString.replace(reg, (match, nickName) => {
            return '@' + (nameMap[nickName] || nickName);
          });
        }
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
