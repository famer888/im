<template>
  <div class="fileDialog">
    <div>
      <ul
        :class="{
          multiple: list.length > 1,
          only: list.length === 1 && list[0].type.includes('image'),
        }"
      >
        <li v-for="(item, index) in list" :key="index">
          <p v-if="item.isError" @click="handleRemoveFileInfo(index)">
            {{ $t("上传/文件视频大小超过50M!") }}
          </p>
          <picture>
            <img :src="item.path" />
          </picture>
          <span @click="handleRemoveFileInfo(index)">
            <img src="@/assets/images/file/close-icon.png" />
          </span>
          <div v-if="list.length > 1 || !list[0].type.includes('image')">
            <p class="file-type">
              <span> {{ $t("名称") }}: </span>{{ item.file.name }}
            </p>
            <p>
              <span>{{ $t("大小") }}:</span>{{ item.size }}
            </p>
          </div>
        </li>
      </ul>
      <ComEditor
        :chatContent="chatContent"
        :groupId="chatContent.type === 'group' ? chatContent.id : null"
        inputId="sendMessageInput2"
        @send="handleSendMessage"
      />
      <span @click.stop="$refs.fileInput.click()">
        {{ $t("添加文件") }}
        <input
          ref="fileInput"
          type="file"
          name="file"
          accept="*/*"
          multiple
          style="display: none"
          @change="handleFileAdd"
        />
      </span>
      <button @click.stop="handleClose">
        {{ $t("取消") }}
      </button>
    </div>
  </div>
</template>
<script>
import ComEditor from "./send/editor";
import { getFileIcon, fileSizeFormat } from "@/utils/base";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  props: ["chatContent", "files", "quoteInfo"],
  components: {
    ComEditor,
  },
  data() {
    return { list: [], loading: false };
  },
  mounted() {
    // 文件列表
    this.list = this.handleFileInfoListGet(this.files);

    // 同步输入框的内容
    const dom = document.getElementById("sendMessageInput");
    if (dom) {
      const dom2 = document.getElementById("sendMessageInput2");
      if (dom2) {
        dom2.innerHTML = dom.innerHTML;

        eventBase.fnCommunicationSendMsg({
          operator: "sendEditorFoucs",
        });
      }
    }
  },
  methods: {
    handleClose() {
      // 关闭 文件对话框
      eventCommon.fnCloseListRU({
        removeIds: ["fileDialog"],
      });
    },
    /**
     * 消息发送
     */
    handleSendMessage(list) {
      // 上传锁，防止重复触发
      if (this.loading) return;
      this.loading = true;

      let { id, channelId, type } = this.chatContent;
      id = type === 'channel' ? (channelId || id) : id;

      if (this.list.some((item) => item.isError)) {
        window.$toast(this.$t("上传/文件视频大小超过50M!"));
        return;
      }

      eventBase.fnCommunicationSendMsg({
        operator: "msgSend",
        data: {
          id,
          type,
          list: [
            ...this.list.map((info) => {
              return {
                type: "file",
                values: {},
                file: info.file,
              };
            }),
            ...list,
          ],
          quoteInfo: this.quoteInfo,
        },
      });

      // 如果是弹窗内，则清空非弹窗输入框
      const dom = document.getElementById("sendMessageInput");
      if (dom) {
        dom.innerHTML = "";

        // 恢复焦点
        eventBase.fnCommunicationSendMsg({
          operator: "sendEditorFoucs",
        });
      }

      // 关闭
      this.handleClose();
    },
    /**
     * 文件添加
     */
    handleFileAdd(event) {
      const files = event.target.files;

      if (files) {
        const list = [];
        for (const file of files) {
          list.push(file);
        }

        // 文件信息列表获取
        const infoList = this.handleFileInfoListGet(list);

        // 设置列表
        this.list = [...this.list, ...infoList];
      }
    },
    /**
     * 文件信息列表获取
     */
    handleFileInfoListGet(files) {
      return files.map((file) => {
        let path = "";
        if (file.type.indexOf("image") === -1) {
          path = getFileIcon(file.name);
        } else {
          const blob = new Blob([file]);
          path = window.URL.createObjectURL(blob);
        }

        return {
          path,
          type: file.type,
          size: fileSizeFormat(file.size),
          file,
          isError: Math.ceil(file.size / 1024 / 1024) > 50,
        };
      });
    },
    /**
     * 移除文件信息
     */
    handleRemoveFileInfo(index) {
      // 如果移除最后一个，则直接关闭
      if (this.list.length === 1) {
        this.handleClose();
      } else {
        this.list = this.list.filter((_item, i) => index !== i);
      }
    },
  },
};
</script>
<style lang="scss">
.fileDialog {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($color: #000000, $alpha: 0.2);
  overflow-y: auto;

  > div {
    position: absolute;
    width: 400px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    display: flex;
    flex-direction: column;
    padding: 20px 20px 40px;
    border-radius: 10px;

    > ul {
      flex: auto;
      position: relative;
      padding: 0;
      margin: 0;
      max-height: 420px;
      overflow-y: auto;

      li {
        margin: 0;
        position: relative;
        background: #eee;
        box-sizing: border-box;
        padding: 5px 0;

        > p {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          border: 1px solid #ff0000;
          background: rgba($color: #260101, $alpha: 0.6);
          color: #fff;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          z-index: 2;
        }

        > picture {
          display: block;
          height: 60px;
          width: 70px;

          > img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        > span {
          position: absolute;
          display: block;
          width: 30px;
          height: 30px;
          right: 0;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          cursor: pointer;

          &:hover {
            opacity: 0.8;
          }

          > img {
            display: block;
            width: 60%;
            height: 60%;
          }
        }

        > div {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 75px;
          display: flex;
          flex-direction: column;
          justify-content: center;

          > p {
            width: 280px;
            height: 25px;
            line-height: 25px;
            font-size: 14px;
            margin: 0;
            padding: 0;
            color: #666;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;

            > span {
              color: #333;
              display: inline-block;
              margin-right: 5px;
              font-size: 14px;
            }
          }
        }
      }

      &.only {
        > li {
          display: flex;
          justify-content: center;
          padding: 0;

          > picture {
            display: block;
            width: auto;
            height: auto;

            img {
              display: block;
              max-height: 200px;
              max-width: 360px;
              flex: 1;
            }
          }
        }
      }

      &.multiple {
        > li {
          height: 80px;
          margin-bottom: 1px;
          border-radius: 5px;

          > picture {
            height: 65px;
            width: 65px;
            position: absolute;
            left: 5px;
            top: 50%;
            transform: translateY(-50%);
            overflow: hidden;
            margin-right: 5px;

            > img {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }
    }

    > button {
      position: absolute;
      right: 80px;
      bottom: 15px;
      padding: 0 13px;
      display: block;
      height: 24px;
      line-height: 24px;
      font-size: 12px;
      border-radius: 4px;
      color: #fff;
      background-color: #999;
      text-align: center;
      border: 1px solid #999;
      cursor: pointer;
      z-index: 20;
    }

    > span {
      position: absolute;
      left: 25px;
      bottom: 18px;
      color: #3369fe;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
