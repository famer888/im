<template>
  <img
    :src="url === '' ? icon : url"
    @error="error"
    :onerror="`this.url='${icon}'`"
    :style="isError && errorStyle ? errorStyle : null"
    @click="handleClick"
    @contextmenu.prevent="handleContextmenu"
  />
</template>
  <script>
import groupIcon from "@/assets/images/logo/default_group_icon.png";
import friendIcon from "@/assets/images/logo/logo-58.png";

export default {
  props: ["src", "errorStyle", "type"],
  data() {
    return {
      isError: false,
      url: this.type === "group" ? groupIcon : friendIcon,
      icon: this.type === "group" ? groupIcon : friendIcon,
    };
  },
  watch: {
    src() {
      this.loadUrl();
    },
  },
  mounted() {
    this.loadUrl();
  },
  methods: {
    loadUrl() {
      if (this.defaultUrl) {
        this.icon = this.defaultUrl;
      }
      const img = new Image();
      if (!this.src || this.src.includes("/default_group_icon.png")) {
        img.src = this.icon;
      } else {
        img.src = this.src;
        img.onload = () => {
          this.url = this.src;
        };
      }
    },
    handleClick(e) {
      this.$emit("onClick", e);
    },
    handleContextmenu(e) {
      this.$emit("onContextmenu", e);
    },
    error() {
      this.url = this.icon;
      this.isError = true;
    },
  },
};
</script>
  