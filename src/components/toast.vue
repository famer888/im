<template>
  <div class="comToast">
    {{ msg }}
  </div>
</template>
<script>
export default {
  props: ["msg"],
};
</script>

<style lang="scss" scoped>
.comToast {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  top: 50%;
  padding: 13px 16px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  z-index: 1000;
}
</style>


