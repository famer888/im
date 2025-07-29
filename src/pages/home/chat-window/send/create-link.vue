<template>
  <div class="create-link">
    <div class="content">
      <h6>创建链接</h6>
      <span class="title">Text</span>
      <div ref="linkTextInput" class="create-link-input" draggable="false" autofocus contenteditable="true"
        spellcheck="false"></div>
      <span class="title">URL</span>
      <input v-model="linkValue" maxlength="100" />

      <div class="buttons">
        <div class="button cancel" @click="cancel">取消</div>
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
    ensureHttpProtocol(url) {
      if (!url) return url; // 处理空值
    
      // 正则匹配是否以 http:// 或 https:// 开头
      const hasProtocol = /^(http:\/\/|https:\/\/)/i.test(url);
      
      // 如果没有协议，默认添加 https://
      return hasProtocol ? url : `https://${url}`;
    },
    confirm() {
      let { linkValue, selectText } = this;
      const linkText = this.$refs.linkTextInput.innerHTML;
      if (!linkText) return window.$toast(this.$t("请输入链接文本"));
      if (!linkValue) return window.$toast(this.$t("请输入链接地址"));
      linkValue = this.ensureHttpProtocol(linkValue)
      this.$emit('confirm', { linkText, linkValue, selectText });
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
    width: 290px;
    min-height: 316px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 6px;

    h6 {
      color: #000;
      font-size: 18px;
      margin-bottom: 10px;
      text-align: center;
    }

    .title {
      color: #787878;
      font-weight: 400;
      font-size: 12px;
      margin-top: 16px;
    }

    input,
    .create-link-input {
      margin-top: 10px;
      background: #DCDFE6;
      color: #000;
      height: 46px;
      border-radius: 8px;
      padding: 12px 16px;
      box-sizing: border-box;
      font-weight: 400;
      outline: none; 
      white-space: nowrap; 
      overflow-x: auto;
    }
  }

  .buttons {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;

    .button {
      font-size: 14px;
      color: #fff;
      margin-left: 20px;
      cursor: pointer;
      background: #178AFF;
      width: 100%;
      height: 48px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;

      &:first-child {
        margin-left: 0;
      }
    }

    .cancel {
      background: #9197AD;
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