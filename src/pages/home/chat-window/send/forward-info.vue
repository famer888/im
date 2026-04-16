<template>
  <div class="comForwardInfo">
    <img src="@/assets/images/forward.png" />
    <div
      v-if="msgList.length === 1"
      :class="{
        hasImg: [1, 3, 9].includes(msgList[0].chatType),
      }"
    >
      <img
        v-if="[1, , 3, 9].includes(msgList[0].chatType)"
        :src="getForwardImgSrc(msgList[0])"
      />
      <h3>
        {{ msgList[0].newNickName }}
      </h3>
      <ComTextEmojiImage
        v-if="msgList[0].chatType === 0"
        :text="msgList[0].content"
        :currentChatId="chatContent?.id || chatContent?.channelId"
      />
      <div v-else>
        {{
          messageTypeToText({
            chatType: msgList[0].chatType,
            haveBrackets: true,
          })
        }}
      </div>
    </div>
    <div v-else>
      <section>
        <div v-for="(item, i) in msgList" :key="i">
          <ComTextEmojiImage v-if="item.chatType === 0" :text="item.content" :currentChatId="chatContent?.id || chatContent?.channelId" />
          <div v-else>
            {{
              messageTypeToText({
                chatType: item.chatType,
                haveBrackets: true,
              })
            }}
          </div>
        </div>
      </section>
      <div>{{ $t("总计") }}: {{ msgList.length }}</div>
    </div>
    <picture @click="handleClose">
      <img src="@/assets/images/message/icon-clear.png" />
    </picture>
  </div>
</template>
<script>
import { setMaxLengthStr } from "@/utils/base";

// 控件
import ComTextEmojiImage from "@/pages/home/com/text-emoji-image.vue";

// 事件
import eventMsg from "@/event/msg";
import eventCommon from "@/event/common";
import { toLocalResourceUrl } from "@/platform";

export default {
  props: ["forwardMessageList", "chatContent"],
  components: {
    ComTextEmojiImage,
  },
  computed: {
    msgList() {
      return this.forwardMessageList.map((item) => ({
        ...item,
        newNickName: setMaxLengthStr(item.user?.nickName, 30),
      }));
    },
  },
  mounted() {
    // console.log(this.forwardMessageList);
  },
  methods: {
    getForwardImgSrc(info) {
      const localUrl = info.localThumbUrl || info.local
      return toLocalResourceUrl(localUrl)
    },
    messageTypeToText(value) {
      return eventMsg.fnMsgTypeToText(value);
    },
    /**
     * 关闭
     */
    handleClose() {
      // 移除转发信息对话框
      eventCommon.fnCloseListRU({
        removeIds: ["forwardInfoDialog"],
      });
    },
  },
};
</script>
<style lang="scss">
.comForwardInfo {
  position: absolute;
  left: 0;
  right: 0;
  top: -60px;
  height: 60px;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 10;

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

    &.hasImg {
      padding-left: 120px;

      > img {
        position: absolute;
        left: 60px;
        top: 5px;
        width: 50px;
        height: 50px;
        object-fit: cover;
      }
    }

    > h3 {
      padding: 10px 0 5px;
      margin: 0;
      font-size: 14px;
      color: #5071cc;

      &.msg-namelist {
        overflow-y: auto;
        height: 3em;
        padding: 3px 0;
        max-height: 100%;
        box-sizing: border-box;
      }
    }

    > section {
      display: flex;
      padding-top: 10px;
      height: 35px;
      box-sizing: border-box;
      max-width: 86%;
      overflow: hidden;

      > div {
        margin-right: 10px;
        position: relative;

        &::before {
          content: ",";
          display: block;
          position: absolute;
          left: -5px;
        }

        &:first-child {
          &::before {
            display: none;
          }
        }
      }
    }

    > div {
      font-size: 12px;
      color: #333;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .img-emoji-container {
      img {
        height: 20px;
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

<style lang="scss">
.comForwardInfo {
  span, div {
    flex-shrink: 0;
  }
}
</style>