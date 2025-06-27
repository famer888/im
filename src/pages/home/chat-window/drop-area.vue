<template>
  <div
    class="domDropArea"
    :draggable="true"
    @dragover="(e) => e.preventDefault()"
    @dragleave="$emit('close')"
    @drop="handleDrop"
    @click="$emit('close')"
  >
    <p>
      <img src="@/assets/images/file/file-icon.png" />{{
        $t("拖入您要发送的文件")
      }}
    </p>
  </div>
</template>
<script>
import eventBase from "@/event/base";
export default {
  methods: {
    handleDrop(e) {
      const files = e.dataTransfer.files;
      const list = [];
      for (const file of files) {
        list.push(file);
      }

      // 设置要上传的文件列表
      eventBase.fnCommunicationSendMsg({
        operator: "uploadFilesSet",
        data: {
          uploadFiles: list,
        },
      });

      this.$emit("close");
    },
  },
};
</script>
<style scoped lang="scss">
.domDropArea {
  color: #fff;
  text-align: center;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 10;
  top: 0;
  right: 0;

  > p {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    height: 24px;

    > img {
      display: block;
      height: 100%;
      margin-right: 10px;
    }
  }
}
</style>