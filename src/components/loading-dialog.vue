<template>
  <div class="comLoadingDialog">
    <ComLogining />
  </div>
</template>
<script>
import ComLogining from "./com-loading.vue";

export default {
  components: {
    ComLogining,
  },
};
</script>
<style lang="scss">
.comLoadingDialog {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($color: #fff, $alpha: 0.3);
  display: flex;
  align-items: center;
  justify-content: center;

  > div {
    width: 30px !important;
    height: 30px !important;
  }
}
</style>