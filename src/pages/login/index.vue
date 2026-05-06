<template>
  <div class="loginRegistContainer">
    <div class="drag"></div>
    <img
      v-if="!isMac"
      src="@/assets/images/system/top3.png"
      class="close"
      @click="close"
    />
    <Ecode />
  </div>
</template>

<script>
import Ecode from "./components/ecode";
import { ipcRenderer } from "@/platform";
import { remote } from "@/platform";
import { isMac } from "@/utils/base";

export default {
  components: { Ecode },
  data() {
    return {
      isMac,
    };
  },
  mounted() {
    ipcRenderer.send("changeWindow", {
      width: 300,
      minWidth: 300,
      height: 420,
      resize: 1,
    });
  },
  created() {
    // contextIsolation 下 removeListener 无法匹配跨桥 proxy wrapper，登录页面多次 mount 会累加 listener
    ipcRenderer.removeAllListeners("cache-db");
    ipcRenderer.on("cache-db", (e, args) => {
      ipcRenderer.send("cache-no-login", {});
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners("cache-db");
  },
  methods: {
    close() {
      const win = remote.getCurrentWindow();
      win.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.loginRegistContainer {
  position: absolute;
  left: 0;
  top: 0;
  height: 400px;
  width: 300px;

  .drag {
    width: 270px;
    position: absolute;
    left: 0px;
    top: 0;
    height: 30px;
    -webkit-app-region: drag;
  }

  .close {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 1;
    cursor: pointer;
    width: 20px;
    height: 20px;
  }
}
</style>
