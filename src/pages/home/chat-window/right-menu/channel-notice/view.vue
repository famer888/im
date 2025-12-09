<template>
  <div class="groupNoticeView">
    <template v-if="tagList.length > 0">
      <div :style="styleInfo" class="notice-content">
        <ComLableEle v-for="(item, index) in tagList" :key="index" :info="item" @atClick="handleAtClick" />
      </div>
    </template>
    <template v-else>
      <div :style="styleInfo">
        {{ $t("无简介") }}
      </div>
    </template>
  </div>
</template>
<script>
// 工具
import { strSplitAt } from "@/utils/widget";
import { repalceLink, repalceLinkNoPrefix } from "@/utils/base";
import { splitHtmlStringToObjects, strReplaceEmojiImgLabel } from "@/utils/widget";
import eventBase from '@/event/base';
// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

export default {
  components: {
    ComLableEle,
  },
  props: ["content", "atNameList", "noClick", "styleInfo", "chatContent"],
  data() {
    return { tagList: [] };
  },
  mounted() {
    // 连接处理
    this.handleContent()
  },
  methods: {
    handleContent() {
      let htmlString = repalceLink(this.content);
      htmlString = htmlString.replace(/\n/g, '<br/>')

      // 字符串替换为表情图片标签
      htmlString = strReplaceEmojiImgLabel(htmlString);

      // 拆分html
      const tagList = splitHtmlStringToObjects(htmlString);
      // text再进行拆分 把at拆出来
      let tagListNew = [];
      for (const item of tagList) {
        if (item.type === "text") {
          const arr = strSplitAt(item.content, this.atNameList).map((content) => {
              return {
                type: "text",
                content,
              };
            });

          // 对文本判断是否存在没有 https的链接
          for (const n of arr) {
            if (n.content[0] !== "@") {
              const tagListTextAndA = splitHtmlStringToObjects(
                repalceLinkNoPrefix(n.content)
              );
              tagListNew = [...tagListNew, ...tagListTextAndA];
            } else {
              tagListNew.push(n);
            }
          }
        } else {
          tagListNew.push(item);
        }
      }

      this.tagList = tagListNew;
    },
    /**
     * 点击at
     */
    handleAtClick(text) {
      console.log('点击at', text, 'atNameList---', this.atNameList)
      if (this.noClick) {
        return;
      }

      const atText = text.replace("@", "");

      // 如果是打开成员
      if (this.atNameList.includes(text)) {
        eventBase.fnCommunicationSendMsg({
          operator: "memberDialogShow",
          data: {
            atName: atText,
          },
        });
        return;
      }
      eventBase.fnCommunicationSendMsg({
        operator: "atClick",
        data: {
          text: atText,
          groupId: this.chatContent.id
        },
      });
    },
  },
};
</script>
<style scoped lang="scss">
.groupNoticeView {
  font-size: 14px;
  color: #787878;
  line-height: 20px;
  word-wrap: break-word;

  >div {
    overflow-y: auto;
  }

  >.break {
    display: block;
  }

  .notice-content {
    overflow-y: scroll;

    >.at {
      margin: 0;
      font-size: 14px;
      color: #3369fe;
      display: inline-block;
      cursor: pointer;
      font-weight: normal;

      a:hover {
        text-decoration: underline;
      }
    }

    >img {
      height: 18px;
    }
  }
}
</style>
