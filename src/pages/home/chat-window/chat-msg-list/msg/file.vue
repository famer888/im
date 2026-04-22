<template>
  <div
    :class="{ comMsgFile: true, self: msgInfo.isSelf }"
    @click="handleOpenFile"
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div v-if="danger" class="danger-badge">高危文件</div>
    <div class="content">
      <div>
        <h2 class="text-clamp-2">{{ msgInfo.fileName }}</h2>
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

  .danger-badge {
    position: absolute;
    top: 36px;
    right: 0px;
    background: #ff4444;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10;
  }
}
</style>