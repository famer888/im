
<template>
  <div
    class="comMsgNotice"
    @click.right="(e) => $emit('rightClick', e)"
    @click.stop="handleOpenGroupNoticeDialog"
  >
    <slot></slot>
    <h3><img src="@/assets/images/notice.svg" /> {{ $t("群公告") }}</h3>
    <picture>
      <img src="@/assets/images/arrow.svg" />
    </picture>
    <div class="content">
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
import { strSplitAt } from "@/utils/widget";
import { repalceLink, repalceLinkNoPrefix } from "@/utils/base";
import { splitHtmlStringToObjects, strReplaceEmojiImgLabel } from "@/utils/widget";

// 事件
import eventBase from "@/event/base";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";


export default {
  components: {
    ComLableEle,
  },
  props: ["content", "atNameList", "msgInfo", "chatContent"],
  inject: ["provideGroupNotice"],
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
        const arr = strSplitAt(item.content, this.atNameList
        .filter((item) => item.name || item.nickName)
        .map((item) => "@" + (item.name || item.nickName))).map((content) => {
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
      const atText = text.replace("@", "");

      // 如果是打开成员
      if (this.atNameList.includes(text)) {
        eventBase.fnCommunicationSendMsg({
          operator: "memberDialogShow",
          data: {
            atName: atText,
            groupId: this.chatContent.id
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
    /**
     * 打开群公告对话框
     */
    handleOpenGroupNoticeDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openGroupNoticeDialog",
        data: {
          notice: this.content,
        },
      });
      this.provideGroupNotice({ notice: this.content });
    },
  },
};
</script>
<style lang="scss">
.comMsgNotice {
  background: #fffbd8;
  max-width: 450px;
  min-width: 300px;
  border-radius: 10px;
  border-top-right-radius: 0;
  padding: 10px 85px 10px 12px;
  border: #fae8c6 solid 1px;
  word-wrap: break-word;
  position: relative;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  > h3 {
    font-size: 14px;
    margin: 0;
    color: #178aff;
    height: 25px;
    font-weight: bold;
    display: flex;
    align-items: center;

    > img {
      display: block;
      height: 18px;
      margin-right: 5px;
    }
  }

  > picture {
    position: absolute;
    right: 2px;
    top: 10px;
    height: 25px;
    width: 25px;
    display: flex;
    align-items: center;
    justify-content: center;

    > img {
      display: block;
      height: 22px;
    }
  }

  > .content {
    line-height: 22px;

    > .at {
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
      height: 18px;
    }

    > .break {
      display: block;
    }
  }
}
</style>