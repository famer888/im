<template>
  <div class="comNavSettingBtn">
    <span @click="handleOpenMenu"> {{ $t("设置") }}</span>
    <vue-context ref="menu" :lazy="true">
      <li @click="handleOpenSettingDialog">{{ $t("系统设置") }}</li>
      <li @click="handleExit">{{ $t("退出登录") }}</li>
    </vue-context>
  </div>
</template>
<script>
import { ipcRenderer } from "@/platform";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  mounted() {
    // 导出完成后进行登出
    // contextIsolation 下 removeListener 无法匹配跨桥 proxy wrapper，该组件随 home 多次 mount 会累加 listener
    ipcRenderer.removeAllListeners("cache-db-success");
    ipcRenderer.on("cache-db-success", (e, args) => {
      // 登出
      eventCommon.fnLoginout(args);
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners("cache-db-success");
  },
  methods: {
    /**
     * 登出
     */
    handleExit() {
      window
        .$confirm({
          remark: this.$t("退出后将无法收到新的消息，确认退出？"),
        })
        .then((res) => {
          if (res) {
            window.$loading(true);

            // 登出前要先导出
            ipcRenderer.send("auto-export-db", {});
          }
        });
    },
    /**
     * 打开菜单
     */
    handleOpenMenu(e) {
      this.$refs.menu && this.$refs.menu.open(e);
    },
    /**
     * 打开设置对话框
     */
    handleOpenSettingDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openSettingDialog",
      });
    },
  },
};
</script>

<style scoped lang="scss">
.comNavSettingBtn {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;

  > span {
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  > ul {
    padding: 0;
    min-width: 102px;
    text-align: center;
    border: none;

    > li {
      padding: 10px 5px;
      background: #1b233b;
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.9);
      }
    }
  }
}
</style>