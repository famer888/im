<template>
  <div class="comQuoteInfo" @click="$emit('moveToReply')">
    <img src="@/assets/images/replay.png" />
    <div>
      <template v-if="msgInfo && [1, 3].includes(msgInfo.chatType)">
        <img
          v-if="
            ['downloadError', 'decryptionError'].includes(
              msgInfo.localThumbUrl || msgInfo.local
            )
          "
          src="@/assets/images/error/img_fail_icon.png"
        />
        <img
          v-else
          :src="toLocalResourceUrl(msgInfo.localThumbUrl || msgInfo.local)"
        />
      </template>
      <img
        v-else-if="msgInfo && msgInfo.chatType === 7"
        :src="getFileIcon(msgInfo.fileName)"
      />
      <div>
        <h3 v-if="msgInfo.type !== 'channle'">{{ msgInfo.isSelf ? $t("你") : msgInfo.user?.nickName }}</h3>
        <p v-if="tagList.length" class="text">
          <ComLableEle
            v-for="(item, index) in tagList"
            :key="index"
            :info="item"
            :currentChatId="msgInfo.groupId || msgInfo.channelId"
          />
        </p>
        <p v-else>{{ content }}</p>
      </div>
    </div>
    <picture @click.stop="handleClose">
      <img src="@/assets/images/message/icon-clear.png" />
    </picture>
  </div>
</template>
<script>
// 事件
import eventMsg from "@/event/msg";
import eventCommon from "@/event/common";

// 工具
import {
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";


// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";
import { getFileIcon } from "@/utils/base";
import { toLocalResourceUrl } from "@/platform";
export default {
  components: {
    ComLableEle,
  },
  props: ["msgInfo"],
  data() {
    return {
      content: "",
      tagList: [],
    };
  },
  methods: {
    getFileIcon,
    toLocalResourceUrl,
    /**
     * 关闭
     */
    handleClose() {
      // 移除 引用信息对话框
      eventCommon.fnCloseListRU({
        removeIds: ["quoteInfoDialog"],
      });
    },
  },
  mounted() {
    switch (this.msgInfo.chatType) {
      case 0: {
        // 字符串替换为表情图片标签
        const htmlString = strReplaceEmojiImgLabel(this.msgInfo.content);

        // 拆分html
        this.tagList = splitHtmlStringToObjects(htmlString);

        break;
      }
      case 7: {
        // 文件
        this.content = this.msgInfo.fileName;
        break;
      }
      case 8: {
        // 引用群简介
        this.content = '[群简介]'
        break;
      }
      default: {
        this.content = eventMsg.fnMsgTypeToText({
          chatType: this.msgInfo.chatType,
          haveBrackets: true,
        });

        // 如是是名片则加上名称
        if (this.msgInfo.chatType === 5) {
          this.content += this.msgInfo.content.name;
        }
      }
    }
  },
};
</script>
<style lang="scss">
.comQuoteInfo {
  position: absolute;
  left: 0;
  right: 0;
  top: -60px;
  height: 60px;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 9;

  > img {
    position: absolute;
    left: 20px;
    height: 30px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }

  > div {
    padding-left: 60px;
    height: 100%;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
      background: #efefef;
    }

    > img {
      display: block;
      height: 45px;
      width: 45px;
      object-fit: cover;
      border-radius: 3px;
      margin-right: 5px;
    }

    > div {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;

      > h3 {
        margin: 0;
        padding: 0;
        line-height: 18px;
        font-size: 14px;
        font-weight: bold;
        color: #3369fe;
        display: block;
      }

      > p {
        font-size: 12px;
        color: #555;
        display: block;
        line-height: 18px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;

        &.text {
          > span {
            font-size: 12px;
            color: #555;
          }

          > img {
            display: inline-block;
            height: 18px;
            position: relative;
            top: 4px;
          }
        }
      }
    }
  }

  > picture {
    position: absolute;
    right: 20px;
    top: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }

    > img {
      display: block;
      width: 20px;
      height: 20px;
    }
  }
}
</style>
