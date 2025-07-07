<template>
  <div class="create-link">
    <div class="content">
      <h6>创建链接</h6>
      <span class="title">Text</span>
      <div
        ref="linkTextInput"
        class="create-link-input"
        draggable="false"
        autofocus
        contenteditable="true"
        spellcheck="false"
      ></div>
      <span class="title">URL</span>
      <input v-model="linkValue" />

      <div class="buttons">
        <div class="button" @click="cancel">取消</div>
        <div class="button" @click="confirm">创建</div>
      </div>
    </div>
  </div>
</template>

<script>
import { textToEmojiImage } from "@/utils/base";
export default {
  name: 'createLink',
  props: ['selectText', 'chatContent'],
  data() {
    return {
      linkValue: '',
    }
  },
  created() {
    this.$nextTick(() => {
      this.$refs.linkTextInput.innerHTML = textToEmojiImage(this.selectText)
    })
  },
  methods: {
    isHttpOrHttps(url) {
       return url.startsWith('http://') || url.startsWith('https://');
    },  
    confirm() {
      const { linkValue, selectText } = this;
      const linkText = this.$refs.linkTextInput.innerHTML;
      if(!linkText) return window.$toast(this.$t("请输入链接文本"));
      if(!linkValue) return window.$toast(this.$t("请输入链接地址"));
      if(!this.isHttpOrHttps(linkValue))  return window.$toast(this.$t("链接地址需http/https开头"));
      // if(linkValue.includs()) return window.$toast(this.$t("请输入链接地址"));
      this.$emit('confirm', {linkText, linkValue, selectText});
    },
    cancel() {
      this.$emit('cancel');
    },
  },
}
</script>


<style scoped lang="scss">
.create-link {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: rgba($color: #000000, $alpha: 0.2);
  display: flex;
  justify-content: center;
  align-items: center;

  .content {
    width: 400px;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 6px;

    h6 {
      color: #333333;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .title {
      color: #333333;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
    }

    input {
      margin-top: 10px;
      background: rgba(0, 0, 0, 0);
      color: #333333;
      border-bottom: 1px solid #333333 !important;
      padding-bottom: 4px;
    }
  }

  .buttons {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;

    .button {
      font-size: 14px;
      color: #333333;
      margin-left: 20px;
      cursor: pointer;
    }
  }
}
</style>

<style lang="scss">
 .create-link-input {
   img {
     height: 18px;
   }
 }
</style>