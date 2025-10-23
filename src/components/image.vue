<template>
  <img
    :src="url === '' ? icon : url"
    :style="isError && errorStyle ? errorStyle : null"
    @error="renderErr()"
    :onerror="renderErr()"
    @click="handleClick"
    @contextmenu.prevent="handleContextmenu"
  />
</template>
  <script>
import groupIcon from "@/assets/images/logo/default_group_icon.png";
import friendIcon from "@/assets/images/logo/logo-58.png";
import { getOssFirstNormalUrl } from "@/utils/trendsDomain/manageOssDownUpload"
import { checkImageLoad } from "@/utils/fileTools";
import { copyToClipboard } from "@/utils/base";
import eventCommon from "@/event/common";


export default {
  props: ["src", "errorStyle", "type", "defaultUrl"],
  data() {
    return {
      isError: false,
      url: this.type === "group" ? groupIcon : friendIcon,
      icon: this.type === "group" ? groupIcon : friendIcon,
      replaceDomainNum: 0,
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
      const { ossDefaultUrl } = eventCommon.fnDomainsGet() || {};
      const src= ossDefaultUrl && this.src
                   ? this.src.replace("http://r22.zhenyoumei.top", ossDefaultUrl).replace("http://r33.zhenyoumei.top", ossDefaultUrl)
                   : this.src;  
      if (!src || src.includes("default")) {
         this.url = this.icon;
         return;
      } 
      checkImageLoad(src).then(state => {
        if(state) {
          this.url = src;
        } else {
          this.loadErr()
        }
      })
    },
    copyTest(text) {
      copyToClipboard(text);
      window.$toast(this.$t("复制成功"));
    },
    handleClick(e) {
      if (e.ctrlKey) {
        this.copyTest("头像地址:"+ this.src)
      }
      this.$emit("onClick", e);
    },
    handleContextmenu(e) {
      this.$emit("onContextmenu", e);
    },
    renderErr() {
      // this.url = this.icon;
      //  this.isError = true;
    },
    async loadErr() {
      const src = this.src || "";
      if(!this.replaceDomainNum && src.includes('http') && !src.includes('default')) {
        this.replaceDomainNum += 1;
        const newUrl = await getOssFirstNormalUrl(this.src)
        if(newUrl) {
          this.url = newUrl;
        }
      }
    },
  },
};
</script>
  