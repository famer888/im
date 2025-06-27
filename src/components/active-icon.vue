<template>
  <img
    :src="require(`@/assets/images/activeIcon/${icon}-active.png`)"
    :style="{
      width: size + 'px',
      height: size + 'px',
    }"
    class="comActiveIcon"
    @click.stop="$emit('click')"
  />
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
    },
    size: {
      type: [Number, String],
      default: 24,
    },
  },
};
</script>

<style lang="scss" scoped>
.comActiveIcon {
  cursor: pointer;
  filter: brightness(1) grayscale(1);
  &:hover {
    filter: unset;
  }
}
</style>
+
