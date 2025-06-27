<template>
  <div class="create-link">
    <div class="content">
      <h6>创建链接</h6>
      <span class="title">Text</span>
      <input v-model="linkText" />
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
export default {
  name: 'createLink',
  data() {
    return {
      linkText: '文本内容',
      linkValue: '',
    }
  },
  methods: {
    confirm() {
      const { linkText, linkValue} = this;
      this.$emit('confirm', {linkText, linkValue});
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
    background: #17212b;
    padding: 20px;
    box-sizing: border-box;

    h6 {
      color: #5b98bd;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .title {
      color: #6f8398;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
    }

    input {
      margin-top: 10px;
      background: rgba(0, 0, 0, 0);
      color: #5b98bd;
      border-bottom: 1px solid #6f8398 !important;
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
      color: #5b98bd;
      margin-left: 20px;
      cursor: pointer;
    }
  }
}
</style>