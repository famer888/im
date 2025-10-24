<template>
  <div
    :class="{ comMsgQuote: true, disable: !msgInfo }"
    @click="$emit('onClick')"
  >
    <template v-if="msgInfo && [1, 3].includes(msgInfo.chatType)">
      <img
        v-if="
          ['downloadError', 'decryptionError'].includes(
            msgInfo.localThumbUrl || msgInfo.local
          )
        "
        src="@/assets/images/error/img_fail_icon.png"
      />
      <img v-else :src="'file://' + (msgInfo.localThumbUrl || msgInfo.local)" />
    </template>
    <img
      v-else-if="msgInfo && msgInfo.chatType === 7"
      :src="getFileIcon(msgInfo.fileName)"
    />
    <div>
      <h3 v-if="chatContent?.type === 'channel'">{{ chatContent.channelName }}</h3>
      <h3 v-else-if="quoteName">{{ quoteName }}</h3>
      <p v-if="tagList.length && quoteName" class="text">
        <ComLableEle
          v-for="(item, index) in tagList"
          :key="index"
          :info="item"
        />
      </p>
      <p v-else>{{ !msgInfo ? $t("已删除的消息") : content || $t("已删除的消息") }}</p>
    </div>
  </div>
</template>
<script>
// 工具
import { getFileIcon } from "@/utils/base";
import {
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

// 事件
import eventCommon from "@/event/common";
import eventMsg from "@/event/msg";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

export default {
  components: {
    ComLableEle,
  },
  props: ["msgInfo", "memberInfos", "chatContent"],
  data() {
    return {
      content: "",
      tagList: [],
    };
  },
  computed: {
    /**
     * 引用的名称
     */
    quoteName() {
      if (!this.msgInfo) {
        return null;
      }

      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      const msgUser =
        this.msgInfo.user ||
        this.msgInfo.sendMember?.user ||
        this.msgInfo.sendUser;
      const isOwn = this.msgInfo.sendUid == loginId;
      if (msgUser && !isOwn) {
        const { name, nickName } = this.memberInfos[msgUser.uid] || {};
        return name || nickName || msgUser.nickName;
      }
      return this.$t("你");
    },
  },
  mounted() {
    if (this.msgInfo) {
      if ([10, 13, 14].includes(this.msgInfo.chatType)) {
        // 引用的是 红包，转账，转账收款，均显示 不支持消息类型
        this.content = "暂不支持该消息类型";
        return
      }
      if ([16].includes(this.msgInfo.chatType)) {
        this.content = "富文本";
        return
      }
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
          // 引用的是公告，直接显示群公告
          this.content = "[群公告]";
          break;
        }

        default: {
          this.content = eventMsg.fnMsgTypeToText({
            chatType: this.msgInfo.chatType,
            haveBrackets: true,
          });
          // 如是是名片则加上名称
          if (this.msgInfo.chatType === 5) {
            this.content += this.msgInfo.content.slice(
              0,
              this.msgInfo.content.indexOf("*|*|*")
            );
          }
        }
      }
    } else {
      this.content = this.$t("已删除的消息");
    }
  },
  methods: {
    getFileIcon,
  },
};
</script>
<style scoped lang="scss">
.comMsgQuote {
  padding-left: 5px;
  border-left: #3369fe solid 2px;
  margin-bottom: 5px;
  position: relative;
  height: 40px;
  display: flex;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba($color: #3369fe, $alpha: 0.1);
  }

  &.disable {
    background: rgba($color: #fff, $alpha: 0.2);
    cursor: default;

    &:hover {
      background: rgba($color: #fff, $alpha: 0.2);
    }
    > div {
      display: flex;
      flex-direction: column;
      justify-content: center;

      > p {
        color: #777;
      }
    }
  }

  > img {
    display: block;
    height: 40px;
    width: 40px;
    object-fit: cover;
    border-radius: 3px;
    margin-right: 5px;
  }

  > div {
    > h3 {
      margin: 0;
      padding: 0;
      line-height: 20px;
      font-size: 14px;
      font-weight: bold;
      color: #3369fe;
      display: block;
    }

    > p {
      font-size: 12px;
      color: #555;
      display: block;
      line-height: 20px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;

      &.text {
        position: absolute;
        left: 5px;
        right: 0;
        bottom: 0;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;

        > span {
          font-size: 12px;
          color: #555;
        }

        > img {
          display: inline-block;
          height: 20px;
          position: relative;
          top: 4px;
        }
      }
    }
  }
}
</style>