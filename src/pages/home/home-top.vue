<template>
  <div class="manage">
    <div class="max-box" :class="['drag', isMac && 'mac']"></div>
    <template v-if="!isMac">
      <div class="box" @click="minimize()">
        <img src="@/assets/images/system/top1.png" />
      </div>
      <div class="box" @click="maximize()">
        <img src="@/assets/images/system/top2.png" />
      </div>
      <div class="box" @click="close()">
        <img src="@/assets/images/system/top3.png" />
      </div>
    </template>
  </div>
</template>

<script>
import { remote, ipcRenderer } from "@/platform";
import { isMac } from "@/utils/base";

export default {
  data() {
    return {
      isMac,
    };
  },
  methods: {
    minimize() {
      const win = remote.getCurrentWindow();
      win.minimize();
    },
    maximize() {
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      this.$nextTick(() => {
        this.toggleMaxRestoreButtons();
      });
    },
    close() {
      const win = remote.getCurrentWindow();
      win.minimize();
      return ipcRenderer.send("hide-window");
    },
    toggleMaxRestoreButtons() {
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        document.body.classList.add("maximized");
      } else {
        document.body.classList.remove("maximized");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.manage {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 32px;
  position: absolute;
  z-index: 9999;
  top: 0;
  right: 0;

  .max-box {
    left: 0;
    top: 0;
    position: absolute;
    width: calc(100% - 120px);
    height: 32px;
    line-height: 32px;
    z-index: 1;
    -webkit-app-region: drag;

    &.mac {
      width: 100%;
    }
  }

  .box {
    padding: 0 12px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    &:hover {
      background: #f0f0f0;
    }

    img {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
