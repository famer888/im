<template>
  <div id="app">
    <!-- <div @click="getGameConfig" style="position: fixed; top: 30px;left: 0;z-index: 99;">测试</div> -->
    <router-view></router-view>
  </div>
</template>
<script>
import { remote, ipcRenderer } from "@/platform";
import { Cache } from "@/cache";
import { Local } from "./utils";
import { _decrypt } from "@/api/base/index";
import { initAesKey } from "./utils/trendsAesKey";
import config from "@/config.js";
import { outFileFun } from "@/platformHelper";
import { initDomain } from "./utils/trendsDomain";
import { getChannelList } from "@/api/imChannel";
import { getGameGlobalConfig } from "@/api/imBase";

// 事件
import eventCommon from "@/event/common";

export default {
  beforeCreate() {
    initDomain();
    if (config.TRENDS_AES_KEY) {
      initAesKey();
    }
  },
  async mounted() {
    // 监听主进程错误报告，打印到 console
    ipcRenderer.on("main-error-log", (e, data) => {
      console.error("[主进程错误]", data?.type, data?.message, data?.args, data?.stack);
    });

    ipcRenderer.on("visibilitychange", (e, windowShowState) => {
      Local("windowShowState", windowShowState);
    });

    window.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        //窗口现在是可见的
        Local("windowShowState", true);
      } else if (document.visibilityState === "hidden") {
        //窗口现在是不可见的
        Local("windowShowState", false);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        ipcRenderer.send("updateTray", { nums: 0 });
      }
    });
    // 查看是否有当前框口的登录信息
    const sourceId = remote.getCurrentWindow().getMediaSourceId();

    const sourceIdList = (await Cache("source-id-list")) || [];
    if (!sourceIdList.includes(sourceId)) {
      sourceIdList.push(sourceId);
      Cache("source-id-list", sourceIdList);
    }

    if (!location.href.includes("login")) {
      Cache("login-account-list").then(async (res) => {
        // 如果有旧的登录信息
        if (res && res.length > 0) {
          const info = res.find((item) => item.sourceId === sourceId);

          if (info) {
            this.$router.push("/home?loginId=" + info.id);
            return;
          }

          // 如果是首次启动，则查看有没有没被使用的登录账户
          if (
            !location.href.includes("home") &&
            !location.href.includes("login")
          ) {
            const availableAccounts = res.filter(
              (item) =>
                !sourceIdList.includes(item.sourceId) &&
                item.sessionId &&
                item.sessionId !== ""
            );

            // 如果存在可用的账户
            if (availableAccounts.length > 0) {
              // 最后一个可用账户
              const availableAccountLast =
                availableAccounts[availableAccounts.length - 1];

              let loginAccountList = res;

              // 移除旧的登录信息
              loginAccountList = loginAccountList.filter(
                (item) => item.id !== availableAccountLast.id
              );

              // 添加新的登录信息
              loginAccountList.push({
                ...availableAccountLast,
                sourceId,
              });

              // 保存到本地
              Cache("login-account-list", loginAccountList).then(() => {
                this.$router.push("/home?loginId=" + availableAccountLast.id);
              });

              return;
            }
          }
        }

        this.$router.push({ path: "/login" });
      });
    }
  },
  created() {
    // 初始化 设备的设置信息
    eventCommon.fnConfigInit();

    ipcRenderer.on("file-out-download", (e, args) => {
      let { filePath, key } = args;
      outFileFun(filePath, key);
    });
  },
  watch: {
    "$i18n.locale": {
      immediate: true,
      deep: true,
      handler() {
        this.settingBodyFontFamily();
      },
    },
  },
  methods: {
    getGameConfig() {
      getGameGlobalConfig()
      // getChannelList().then(res => {
      //   console.log("getChannelList--", res)
      // })
    },
    settingBodyFontFamily() {
      const lang = this.$i18n.locale;
      switch (lang) {
        case "vi":
          document.body.style.fontFamily = "NotoSansSC-Regular";
          break;
        case "pt":
          document.body.style.fontFamily = "Roboto-Regular";
          break;
        default:
          document.body.style.fontFamily = "PingFangSC-Regular";
          break;
      }
    },
  },
};
</script>

<style>
/* 文本溢出超两行显示省略号 */
.text-clamp-2{
    white-space: normal;
    word-wrap: break-word;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
}
</style>
