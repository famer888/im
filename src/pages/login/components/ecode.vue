<template>
  <div class="comEcode">
    <div class="lastBox">
      <img
        :src="lastLoginInfo.icon || require('@/assets/images/logo/logo.png')"
        @error="handleLastIconError"
        @click="networkCheckVisible = true"
      />
      <div v-if="lastLoginInfo.name">{{ lastLoginInfo.name }}</div>
    </div>
    <NetworkCheck
      v-if="networkCheckVisible"
      @close="networkCheckVisible = false"
      @validDomainList="handleValidDomainList"
    />
    <section @click="handleReGetQrCodeUrl">
      <qrcode-vue
        class="ecode"
        ref="qrcode"
        :value="`${officialUrl}?token=${loginToken}&imQrCodeType=2`"
        level="H"
        :size="160"
      />
      <p v-if="qrCodeUrlError || isOutTime || isLoading">
        <img
          src="@/assets/images/login/fresh-icon.png"
          :class="{ load: isLoading }"
        />
        <span v-if="qrCodeUrlError">{{ $t("登录二维码获取失败!") }}</span>
      </p>
    </section>
    <p>{{ $t("使用手机版扫描二维码登录") }}</p>
    <a :href="`https://${officialUrl}`" target="_blank">{{ officialUrl }}</a>
    <button class="primaryBtn" @click="comFileInVisible = true">
      {{ $t("载入账户设置") }}
    </button>
    <ComFileIn v-if="comFileInVisible" @close="comFileInVisible = false" />
  </div>
</template>
<script>
import { remote } from "@/platform";
import { Cache } from "@/cache";
import { getMacAddress } from "@/utils/trendsAesKey";
import { fnInitAllGroupKey ,fnInitAllChannelKey,fnInitAllFriendKey} from "@/utils/e2ee";

// 控件
import QrcodeVue from "qrcode.vue";

// api
import { getQrCodeUrl, getIsLogin } from "@/api/imBase";
import { baseBuildUrl } from "@/api/base/unit";
import { getDynamicDomainListForQrCode } from "./network.vue";

// 事件
import eventCommon from "@/event/common";
import analyst from "@/socket/analyst";

// 定时器
let timerOutTimer = null;
let loginPollingTimer = null;

export default {
  components: {
    QrcodeVue,
    ComFileIn: () => import("./fileIn.vue"),
    NetworkCheck: () => import("./network.vue"),
  },
  data() {
    return {
      comFileInVisible: false, // 显示文件导入
      networkCheckVisible: false, // 显示网络检测
      deviceConfig: null, // 设备信息
      loginToken: "", //  登录token
      officialUrl: "45chat.com", // 官方地址
      isOutTime: false, // 是否超时
      qrCodeUrlError: false, // 二维码错误
      isLoading: false, // 是否读取中
      lastLoginInfo: {}, // 最后的登录信息
      domainlist: [baseBuildUrl],
      urlIndex: 0,
    };
  },
  mounted() {
    // 获取设备信息
    Cache("device-config").then((res) => {
      if (res) {
        this.deviceConfig = res;
      } else {
        this.deviceConfig = {
          sysModel: Array.from(Array(16), () =>
            Math.floor(Math.random() * 36).toString(36)
          ).join(""),
          sysMac: getMacAddress(),
        };

        // 保存到本地
        eventCommon.fnConfigRU({
          infoMerge: this.deviceConfig,
        });
      }

      // 获取二维码
      this.handleGetQrCodeUrl();

      // 获取是否显示最后登录的头像和名称，产品要求只显示最后一个登录的账户，如果该账户没有被登录
      Cache("login-account-list").then(async (res) => {
        if (res && res.length) {
          const lastLoginInfo = res[res.length - 1];

          // 如果窗口信息和登录信息都存在，则判断该窗口是否存在，如果存在，则不用显示该账户信息
          if (lastLoginInfo.sourceId !== "" && lastLoginInfo.sessionId !== "") {
            // 获取当前所有框口的 sourceId
            const sourceIdList = await Cache("source-id-list");
            if (sourceIdList.includes(lastLoginInfo.sourceId)) {
              return;
            }
          }

          this.lastLoginInfo = lastLoginInfo;
        }
      });
    });
  },
  beforeDestroy() {
    if (timerOutTimer) {
      clearTimeout(timerOutTimer);
    }
    if (loginPollingTimer) {
      clearTimeout(loginPollingTimer);
    }
  },
  computed: {
    hasLast() {
      return Object.keys(this.lastInfo).length > 0;
    },
    // 获取当前baseurl，处理边界条件
    currentBaseUrl() {
      if (!this.domainlist || !this.domainlist.length) {
        return baseBuildUrl;
      }
      const index = Math.max(0, Math.min(this.urlIndex, this.domainlist.length - 1));
      return this.domainlist[index] || baseBuildUrl;
    },
  },
  methods: {
    /**
     * 获取生成二维码的路径
     */
    handleGetQrCodeUrl() {
      this.isLoading = true;
      getQrCodeUrl(this.currentBaseUrl, () => {
        // 显示错误
        this.qrCodeUrlError = true;
        this.isLoading = false;

        // 如果动态域名池已获取(list > 1)，下标+1尝试下一个域名
        if (this.domainlist.length > 1) {
          this.urlIndex++;
        } else {
          // 否则获取动态域名列表
          getDynamicDomainListForQrCode().then((domainUrls) => {
            if (domainUrls && domainUrls.length) {
              this.domainlist = domainUrls;
            }
          }).catch((err) => {
            console.error("[登录] 获取动态域名失败:", err);
          });
        }
      }).then((res) => {
        const { token } = res || {};
        this.isLoading = false;

        if (token) {
          // 设置登录用的token
          this.loginToken = token;

          // 设置20s超时过期
          timerOutTimer = setTimeout(() => {
            this.isOutTime = true;
          }, 20000);

          // 1.5s后开始获取是否登录成功
          loginPollingTimer = setTimeout(() => {
            this.handleIsLoginGet();
          }, 1500);

          return;
        }

        // 显示错误
        this.qrCodeUrlError = true;
      });
    },
    /**
     * 重新获取生成二维码的路径
     */
    handleReGetQrCodeUrl() {
      if (this.qrCodeUrlError) {
        this.qrCodeUrlError = false;
      } else if (this.isOutTime) {
        this.isOutTime = false;
      } else {
        // 如果没有错误，没有超时 则不需要重新获取
        return;
      }

      this.isLoading = true;

      setTimeout(() => {
        this.handleGetQrCodeUrl();
      }, 1500);
    },
    /**
     * 处理有效域名列表（从网络检测组件返回）
     * @param {string[]} validList - 有效域名列表
     */
    handleValidDomainList(validList) {
      if (!validList || !validList.length) return;

      // 去重：过滤掉已存在的域名
      const existingSet = new Set(this.domainlist);
      const newDomains = validList.filter((url) => !existingSet.has(url));

      if (newDomains.length) {
        // 拼接到域名列表
        this.domainlist = [...this.domainlist, ...newDomains];
      }

      // 切换下标到第一个有效域名的位置
      const firstValidIndex = this.domainlist.indexOf(validList[0]);
      if (firstValidIndex !== -1) {
        this.urlIndex = firstValidIndex;
      }

      // 重新触发获取二维码
      this.qrCodeUrlError = false;
      this.isOutTime = false;
      this.isLoading = true;

      // 清除之前的定时器
      if (timerOutTimer) {
        clearTimeout(timerOutTimer);
        timerOutTimer = null;
      }
      if (loginPollingTimer) {
        clearTimeout(loginPollingTimer);
        loginPollingTimer = null;
      }

      setTimeout(() => {
        this.handleGetQrCodeUrl();
      }, 500);
    },
    handleLastIconError(event) {
      if (event && event.target) {
        event.target.onerror = null;
        event.target.src = require("@/assets/images/logo/logo.png");
      }
    },
    /**
     * 是否登录获取
     */
    handleIsLoginGet() {
      const { sysMac, sysModel } = this.deviceConfig;

      getIsLogin(this.currentBaseUrl, { token: this.loginToken, sysMac, sysModel }).then((res) => {
        if (res && Number(res.uid)) {
          const { sessionId, nickName, icon, uploadFileSize, urls } = res;
          analyst.onIsLoginUrls(urls);
          const loginId = Number(res.uid);
          // console.log("登录成功", res);
          // 初始化所有群的key
          fnInitAllGroupKey(loginId);
          // 初始化所有频道的key
          fnInitAllChannelKey(loginId);
          // 初始化所有私聊key
          fnInitAllFriendKey(loginId)

          // 同步
          eventCommon.fnConfigRU({
            infoMerge: {
              uploadFileSize: Number(uploadFileSize),
              urls,
            },
          });

          Cache("login-account-list").then(async (res) => {
            let sourceId = "";
            try {
              sourceId = remote.getCurrentWindow().getMediaSourceId();
            } catch (e) {
              console.error("[登录] 获取sourceId失败:", e);
            }

            let loginAccountList = res || [];

            const infoOld = loginAccountList.find(
              (item) => item.id === loginId
            );

            // 移除旧的登录信息
            loginAccountList = loginAccountList.filter(
              (item) => item.id !== loginId
            );

            // 添加新的登录信息
            loginAccountList.push({
              id: loginId,
              sessionId,
              sourceId,
              name: nickName,
              icon,
              init: infoOld ? infoOld.init : false,
            });

            // 保存并跳转
            Cache("login-account-list", loginAccountList).then(() => {
              this.$router.push("/home?loginId=" + loginId);
            })
          });
        } else {
          // 没有获取到成功信息，则1.5s后再进行获取
          loginPollingTimer = setTimeout(() => {
            // 如果当前超时或错误，则不需要继续获取
            if (this.isOutTime || this.qrCodeUrlError) {
              return;
            }

            this.handleIsLoginGet();
          }, 1500);
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
.comEcode {
  position: relative;
  text-align: center;
  margin-top: 40px;

  a {
    position: relative;
    z-index: 1;
  }

  > a {
    font-size: 16px;
    font-weight: 600;
    color: #3369fe;
    display: block;
    line-height: 25px;
    margin-bottom: 5px;
  }

  > section {
    position: relative;

    > p {
      top: 0;
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.9);

      img {
        position: absolute;
        left: 50%;
        top: 50%;
        margin-left: -20px;
        margin-top: -20px;
        cursor: pointer;
        transform-origin: center;

        &.load {
          animation: load 1s linear infinite;
        }
      }

      > span {
        color: #f56c6c;
        position: absolute;
        left: 50%;
        bottom: 20px;
        transform: translateX(-50%);
      }
    }
  }

  > .lastBox {
    margin-bottom: 10px;

    > img {
      display: block;
      margin: 0 auto;
      width: 60px;
      height: 60px;
      border-radius: 100%;
    }

    > div {
      margin-top: 3px;
    }
  }

  > img {
    margin-bottom: 10px;
    width: 70px;
    height: 70px;
    border-radius: 100%;
  }

  > p {
    margin: 5px 0;
    font-size: 14px;
    color: #999;
    padding: 0 20px;
  }
}

@keyframes load {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
