<template>
    <div
      :class="{ comRichText: true, self: isSelf }"
      @click.stop
      @click.right="(e) => $emit('rightClick', e)"
    >
      <slot></slot>
      <div class="contentText" v-html="content" ref="htmlContent">
      </div>
    </div>
  </template>
  <script>
  // 事件
import { ipcRenderer } from "@/platform";
import eventCommon from "@/event/common";

export default {
    props: ["isSelf", "content", "atUsers", "currentGuoupId"],
    data() {
      return {
      };
    },
    mounted() {
      this.bindImageClickEvents();
    },
    methods: {
      bindImageClickEvents() {
        // 等待 DOM 更新完成（如果内容异步加载）
        this.$nextTick(() => {
          const container = this.$refs.htmlContent;
          const images = container.getElementsByTagName('img');
          
          // 遍历所有图片并绑定点击事件
          Array.from(images).forEach(img => {
            img.addEventListener('click', () => {
              this.imgClick(img.src);  // 调用方法并传入图片地址
            });
          });
        });
      },
      imgClick(imgSrc) {
        // 在这里执行你的逻辑，例如打开大图或跳转
        const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
        const args = {
          uid: loginId,
          userId: 10009,
          chatType: 1,
          fileUrl: imgSrc,
          isOpen: true,
          msgId: 1,
          fileName: "preview.png"
        }
        ipcRenderer.send("fileFoldersOpen", args);
      }
    },
  };
  </script>
  <style scoped lang="scss">
  .comRichText {
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

<style>
em {
     font-style:italic !important;
    }
</style>