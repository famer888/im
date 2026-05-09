<template>
  <div
    :class="{ comMsgFile: true, self: msgInfo.isSelf }"
    @click="handleOpenFile"
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div class="content">
      <img :src="getFileIcon(msgInfo.fileName)" />
      <div class="file-main">
        <div class="file-title-row">
          <h2 class="text-clamp-2">{{ msgInfo.fileName }}</h2>
          <span v-if="danger" class="danger-badge">高危文件</span>
        </div>
        <span>{{ fileSizeFormat(msgInfo.fileSize) }}</span>
      </div>
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
  computed: {
    danger() {
      const exts = ['.exe','.bat','.cmd','.vbs','.js','.ps1','.scr','.pif','.msi','.com','.lnk','.wsf'];
      const fileName = this.msgInfo?.fileName || '';
      return exts.some(x => fileName.endsWith(x));
    }
  },
  methods: {
    fileSizeFormat,
    getFileIcon,
    /**
     * 打开文件
     */
    handleOpenFile() {
      if (this.danger) {
        window.$confirm({
          title: "高危文件",
          remark: "请不要直接打开这个文件，确认来源可信后再打开目录修改扩展名打开",
          showConfirm: false,
        })
      } else {
        eventFile.fnOperatorFile({
          id: this.chatContent.id,
          type: this.chatContent.type,
          info: this.msgInfo,
        });
      }
    },
  },
};
</script>
<style scoped lang="scss">
.comMsgFile {
  max-width: 360px;
  border-radius: 10px;
  border-top-left-radius: 0;
  padding: 8px 10px;
  word-wrap: break-word;
  background: rgb(243, 243, 243);
  position: relative;
  min-width: 240px;
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
    gap: 8px;

    > .file-main {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      min-width: 0;
      align-items: flex-start;

      > .file-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;

        > h2 {
          margin: 0;
          padding: 0;
          line-height: 22px;
          font-size: 14px;
          flex: 1;
          min-width: 0;
          max-width: 135px;
        }
      }

      > span {
        line-height: 18px;
        font-size: 12px;
        color: #666;
      }
    }

    > img {
      height: 45px;
    }
  }

  .danger-badge {
    flex: none;
    background: #ff4444;
    color: white;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
}
</style>