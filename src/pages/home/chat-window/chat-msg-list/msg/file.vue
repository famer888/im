<template>
  <div
    :class="{ comMsgFile: true, self: msgInfo.isSelf }"
    @click="handleOpenFile"
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div class="content">
      <div>
        <h2>{{ msgInfo.fileName }}</h2>
        <span>{{ fileSizeFormat(msgInfo.fileSize) }}</span>
      </div>
      <img :src="getFileIcon(msgInfo.fileName)" />
    </div>
  </div>
</template>
<script>
// 工具
import { getFileIcon, fileSizeFormat } from "@/utils/base";

// 事件
import eventFile from "@/event/file";

export default {
  props: ["msgInfo", "chatContent"],
  methods: {
    fileSizeFormat,
    getFileIcon,
    /**
     * 打开文件
     */
    handleOpenFile() {
      eventFile.fnOperatorFile({
        id: this.chatContent.id,
        type: this.chatContent.type,
        info: this.msgInfo,
      });
    },
  },
};
</script>
<style scoped lang="scss">
.comMsgFile {
  max-width: 450px;
  border-radius: 10px;
  border-top-left-radius: 0;
  padding: 10px 10px 10px 12px;
  word-wrap: break-word;
  background: rgb(243, 243, 243);
  position: relative;
  min-width: 300px;
  min-height: 80px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &.self {
    background: #98daff;
    border-top-left-radius: 10px;
    border-top-right-radius: 0;
  }

  > .content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > div {
      display: flex;
      flex-direction: column;
      justify-content: center;

      > h2 {
        margin: 0;
        padding: 0;
        line-height: 25px;
        font-size: 14px;
      }

      > span {
        line-height: 20px;
        font-size: 12px;
        color: #666;
      }
    }

    > img {
      height: 45px;
    }
  }
}
</style>