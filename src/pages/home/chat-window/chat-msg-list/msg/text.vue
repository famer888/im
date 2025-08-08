<template>
  <div
    :class="{ comMsgText: true, self: isSelf }"
    @click.stop
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div class="contentText">
      <ComLableEle
        v-for="(item, index) in tagList"
        :key="index"
        :info="item"
        @atClick="handleAtClick"
      />
    </div>
  </div>
</template>
<script>
// 工具
import { repalceLink, repalceLinkNoPrefix } from "@/utils/base";
import {
  strSplitAt,
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

// 事件
import eventBase from "@/event/base";

export default {
  components: {
    ComLableEle,
  },
  props: ["isSelf", "content", "atUsers", "currentGuoupId", "links"],
  watch: {
    info: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.handleInfoSet();
        }
      },
      immediate: true,
    },
  },
  data() {
    return {
      tagList: [],
    };
  },
  mounted() {
    this.handleInfoSet();
  },
  methods: {
    /**
     * 点击了at的内容
     */
    handleAtClick(text) {
      const atText = text.replace("@", "");

      // at的名称列表
      const atNameList = this.atUsers
        ? this.atUsers.map((item) => "@" + item.nickName)
        : [];

      // 如果是打开成员
      if (atNameList.includes(text)) {
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
          groupId: this.currentGuoupId,
        },
      });
    },
    /**
     * 处理自定义文本链接增加a标签包裹
     */
    handelCustomLink(htmlStr, links) {
      if(!Array.isArray(links)) return htmlStr;
      let htmlString = htmlStr;
      links.forEach(item => {
        const { location = 0, length, link } = item || {};
        if(link && location >= 0 && length > 0) {
          let source = htmlStr.substring(location, location + length);
          let href = link.replace('http', 'ht#customLink#tp'); // 替换http防污染
          const result = `<a href="${href}" type="customLink">${source}</a>`
          htmlString = htmlString.replace(source, result)
        }
      })
      return htmlString
    },
    /**
     * 设置信息
     */
    handleInfoSet() {
      let htmlString = this.content;
      if(this.links) {
        htmlString = this.handelCustomLink(htmlString, this.links);
      }

      // 字符串替换为表情图片标签
      htmlString = strReplaceEmojiImgLabel(htmlString);

      // 连接处理
      htmlString = repalceLink(htmlString);
      // 替换回链接防污染
      htmlString = htmlString.replace('ht#customLink#tp', 'http');
      // 拆分html
      const tagList = splitHtmlStringToObjects(htmlString);
      // at的名称列表
      const atNameList = this.atUsers
        ? this.atUsers.map((item) => "@" + item.nickName)
        : [];

      // text再进行拆分 把at拆出来
      let tagListNew = [];
      for (const item of tagList) {
        if (item.type === "text") {
          const arr = strSplitAt(item.content, atNameList).map((content) => {
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
      // console.log('tagListNew ------>', tagListNew)
      tagListNew = tagListNew.filter(item => item.type !== 'break')
      this.tagList = tagListNew;
    },
  },
};
</script>
<style scoped lang="scss">
.comMsgText {
  max-width: 450px;
  border-radius: 10px;
  border-top-left-radius: 0;
  word-wrap: break-word;
  background: rgb(243, 243, 243);
  border: 1px solid #eeeff3;
  position: relative;
  padding: 10px 10px 10px 12px;

  &.self {
    background: #98daff;
    border: 1px solid #87cdf6;
    border-top-left-radius: 10px;
    border-top-right-radius: 0;
  }

  > .contentText {
    padding-right: 75px;
    line-height: 22px;
    white-space: pre-wrap;

    .at {
      margin: 0;
      font-size: 14px;
      color: #3369fe;
      display: inline-block;
      cursor: pointer;
      font-weight: normal;

      &:hover {
        opacity: 0.8;
      }
    }

    > img {
      display: inline-block;
      width: 20px;
      height: 20px;
      position: relative;
      top: 4px;
    }
  }
}
</style>

<style lang="scss">
.contentText {
  > a img {
      display: inline-block;
      width: 20px;
      height: 20px;
      position: relative;
      top: 4px;
    }
}
</style>