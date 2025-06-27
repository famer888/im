<template>
  <div
    :class="{ comSelectItem: true, active: isActive }"
    @click.stop="$emit('onClick')"
  ></div>
</template>
<script>
export default {
  props: ["selectedIdList", "id"],
  computed: {
    isActive() {
      return this.selectedIdList.some((item) => item.id === this.id);
    },
  },
};
</script>
<style scoped lang="scss">
.comSelectItem {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  border-radius: 10px;
  cursor: pointer;

  &:hover {
    background: rgba($color: #3369fe, $alpha: 0.1);
  }

  &.active {
    background: rgba($color: #3369fe, $alpha: 0.2);

    &:hover {
      background: rgba($color: #3369fe, $alpha: 0.2);
    }
  }
}
</style>