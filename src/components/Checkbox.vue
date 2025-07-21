<template>
  <div>
    <img :src="value ? checkboxedImg : checkboxImg" alt="" @click="checkClick"
      :style="{ 'margin-top': '8px', width: size + 'px', height: size + 'px', borderRadius: '50%' }">
  </div>
</template>

<script>
import checkboxImg from '@/assets/images/message/checkBox.png'
import checkboxedImg from '@/assets/images/message/checkBoxed.png'
export default {
  name: 'Checkbox',
  props: {
    size: {
      type: [String, Number],
      default: 16
    },
    value: {
      type: Boolean
    }
  },
  data() {
    return {
      checkboxImg,
      checkboxedImg
    }
  },
  methods: {
    checkClick() {
      this.$emit('input', !this.value)
    }
  }
};
</script>

<style lang="scss" scoped></style>