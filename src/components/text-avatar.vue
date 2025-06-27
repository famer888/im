<template>
  <label  class="text-avatar" :style="{width, height, background: getColor()}">{{ (value || "").charAt(0).toUpperCase() }}</label>
</template>

<script>
const gradientColors = [
    ["#ff516a", "#ff885e"],
    ["#ffa85c", "#ffcd6a"],
    ["#665fff", "#82b1ff"],
    ["#54cb68", "#a0de7e"],
    ["#4acccd", "#00fcfd"],
    ["#2a9ef1", "#72d5fd"],
    ["#d669ed", "#e0a2f3"]
];
export default {
  name: 'textAvatar',
  props: ['value', 'width', 'height','color', 'id'],
  data() {
    return {}
  },
  methods: {
    getColor() {
      const result = this.id % 7;
      const color = gradientColors[result];
      return `linear-gradient(to top, ${color[0]}, ${color[1]})`
    }
  },
}
</script>

<style scoped>
.text-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #3f76db;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px; 
}
</style>