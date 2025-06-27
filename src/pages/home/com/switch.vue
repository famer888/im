<template>
  <div :class="{ comSwitch: true, disable }" @click="handleChange">
    <div :class="{ active: value }">
      <span></span>
    </div>
  </div>
</template>
<script>
export default {
  props: ["value", "disable"],
  methods: {
    handleChange() {
      // 被禁用，则提示
      if (this.disable) {
        window.$toast(this.$t("当前操作已被禁用"));
        return;
      }

      this.$emit("input", !this.value);
    },
  },
};
</script>
<style lang="scss" scoped>
.comSwitch {
  display: flex;
  align-items: center;
  cursor: pointer;

  > div {
    border-radius: 1000px;
    position: relative;
    transition: 0.3s ease-out;
    width: 32px;
    height: 16px;
    background: rgb(204, 204, 204);

    &.active {
      background: rgb(51, 105, 254);

      > span {
        left: 18px;
      }
    }

    span {
      position: absolute;
      top: 2px;
      left: 2px;
      background: #fff;
      border-radius: 100%;
      display: inline-block;
      transition: 0.3s ease-out;
      width: 12px;
      height: 12px;
    }
  }

  &.disable {
    opacity: 0.6;
  }
}
</style>