<template>
  <div class="message-send-helper-box">
    <div>
      <img
        class="login-icon"
        src="@/assets/images/headNav/message/logo-icon.png"
        alt=""
      />
    </div>
    <div>
      <img
        class="login-num-icon"
        src="@/assets/images/headNav/message/logo-num-icon.png"
        alt=""
      />
    </div>
    <div class="version">{{ $t("版本信息") }} {{ version }}</div>
    <div class="empty" v-if="false" @dblclick="handleDblclick"></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      pageName: '版本信息',
      version: '1.8.0'
    }
  },
  methods: {
    handleDblclick() {
      this.$router.push({path: '/exportPage'})
    }
  }
}
</script>
<style scoped lang="scss">
.message-send-helper-box {
  position: absolute;
  top: 40%;
  transform: translateY(-50%);
  text-align: center;

  .login-icon {
    width: 66%;
  }

  .login-num-icon {
    margin-top: 20px;
    width: 25%;
  }

  .version {
    font-size: 16px;
    color: #999;
    margin-top: 10px;
  }
  .empty{
    margin-top: 32px;
    height: 32px;
  }
}
</style>
