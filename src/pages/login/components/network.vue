<template>
  <div class="network-overlay">
    <div class="network-panel">
      <div class="panel-header">
        <span class="header-text">Network benchmark</span>
      </div>
      <div class="domain-list">
        <div
          v-for="(item, index) in domainList"
          :key="index"
          class="domain-item"
          :class="{ valid: item.dnsStatus === 1 && item.qrStatus === 200 }"
        >
          <span class="domain-url">{{ formatUrl(item.url) }}</span>
          <span class="status-cell">
            <span
              class="status-dot"
              :class="getDnsStatusClass(item.dnsStatus)"
            ></span>
          </span>
          <span class="status-cell code-status" :class="getQrStatusClass(item.qrStatus)">
            <span class="status-text">{{ getQrStatusText(item.qrStatus) }}</span>
          </span>
        </div>
        <div v-if="!domainList.length" class="empty-tip">
          <span class="empty-text">{{ $t("暂无域名") }}</span>
        </div>
      </div>
      <button
        class="action-btn"
        :class="{ loading: isChecking }"
        @click="handleButtonClick"
      >
        <span v-if="isChecking" class="loading-icon"></span>
        <span class="btn-text">{{ buttonText }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { getTrendsDomainPool } from "@/utils/trendsDomain/manageDomain";
import { checkDomainIsNormal, generateSign, domainListSort } from "@/utils/trendsDomain/workTools";
import { getCurrentTimestamp13Digits } from "@/utils/trendsDomain/tools";
import { getClientTokenData } from "@/utils/trendsDomain/manageToken";
import { getDomainListApi } from "@/api/imDomain";
import { handleEncode, handleDecode, AES_KEY, baseBuildUrl } from "@/api/base/unit";
import { getAesKeySync, getApiMacAddress } from "@/utils/trendsAesKey";
import eventCommon from "@/event/common.js";
import config from "@/config.js";
import { domainsTesting } from "./domains";

/**
 * 获取动态域名列表（用于QrCode）
 * @param {string} moduleCode - 模块代码，默认 "webBiz"
 * @returns {Promise<string[]>} - 域名URL列表
 */
export const getDynamicDomainListForQrCode = async (moduleCode = "webBiz") => {
  const { mchId, secretKey, accessToken } = await getClientTokenData();
  const reqTime = getCurrentTimestamp13Digits();
  const listDomainReq = {
    mchId,
    reqTime,
    sign: "",
    moduleCode,
    deviceIp: "",
    deviceNo: "",
  };
  listDomainReq.sign = generateSign(listDomainReq, secretKey);

  const payload = {
    secretKey,
    datas: listDomainReq,
    headers: { accessToken },
  };

  const res = await getDomainListApi(payload);
  let domainDtoList = res?.domainDtoList || [];

  // 按优先级排序
  domainDtoList = domainListSort(domainDtoList);

  // 筛选对应模块的域名并去重
  const domainUrls = [...new Set(
    domainDtoList
      .filter((item) => item.moduleCode === moduleCode)
      .map((item) => item.domainUrl)
  )];

  return domainUrls;
}
export default {
  name: "NetworkCheck",
  emits: ["validDomainList", "close"],
  data() {
    return {
      domainList: [],
      isChecking: false,
      isCompleted: false,
      validCount: 0,
      cancelled: false,
      retryCount: 0,
      checkedUrls: [], // 记录已检测过的URL，避免重复
    };
  },
  computed: {
    buttonText() {
      if (this.isCompleted && this.validCount > 0) {
        return `${this.$t("有")}${this.validCount}${this.$t("个可用域名")}`;
      }
      return this.$t("返回");
    },
  },
  mounted() {
    domainsTesting();
    this.fetchDomainList();
  },
  beforeDestroy() {
    this.cancelled = true;
  },
  methods: {
    formatUrl(url) {
      if (!url) return "";
      return url
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
    },
    getDnsStatusClass(status) {
      if (status === 1) return "success";
      if (status === 0) return "error";
      if (status === -1) return "checking";
      return "pending";
    },
    getQrStatusClass(status) {
      if (status === -1) return "checking";
      if (status === null) return "pending";
      if (status === 200) return "success";
      return "error";
    },
    getQrStatusText(status) {
      if (status === -1) return "...";
      if (status === null) return "-";
      if (status === 0) return "ERR";
      return String(status);
    },
    async fetchDomainList() {
      this.isChecking = true;
      this.cancelled = false;
      this.isCompleted = false;
      this.validCount = 0;
      this.retryCount = 0;
      this.checkedUrls = [];

      try {
        await this.loadAndCheckDomains();

        // 如果全部检测失败，进行域名补充（计入总补充次数）
        if (this.validCount === 0 && this.retryCount < 2 && !this.cancelled) {
          this.retryCount++;
          console.log(`[NetworkCheck] 全部检测失败，进行第${this.retryCount}次域名补充`);

          // 补充域名
          await this.fetchAndUpdateDomainPool();

          // 重新加载并检测新域名
          await this.loadAndCheckDomains();
        }
      } catch (error) {
        console.error("[NetworkCheck] fetchDomainList error:", error);
      }

      this.isChecking = false;
      this.isCompleted = true;
    },
    async loadAndCheckDomains() {
      // 获取动态域名列表
      let trendsDomains = await getTrendsDomainPool({ moduleCode: "webBiz" }) || [];

      // 如果动态域名池为空，进行补充（计入总补充次数）
      if (!trendsDomains.length && this.retryCount < 2 && !this.cancelled) {
        this.retryCount++;
        console.log(`[NetworkCheck] 动态域名池为空，进行第${this.retryCount}次补充`);
        await this.fetchAndUpdateDomainPool();
        trendsDomains = await getTrendsDomainPool({ moduleCode: "webBiz" }) || [];
      }

      let domainUrls = trendsDomains.map((item) => item.domainUrl);

      // 将 baseBuildUrl 作为默认域名加入列表
      if (baseBuildUrl && !domainUrls.includes(baseBuildUrl)) {
        domainUrls.push(baseBuildUrl);
      }

      // 去重并过滤已检测过的URL
      domainUrls = [...new Set(domainUrls)].filter(url => !this.checkedUrls.includes(url));

      if (!domainUrls.length) {
        return;
      }

      // 记录本次要检测的URL
      this.checkedUrls = [...this.checkedUrls, ...domainUrls];

      // 添加到域名列表
      const newItems = domainUrls.map((url) => ({
        url,
        dnsStatus: null, // null: pending, -1: checking, 0: error, 1: success
        qrStatus: null,
      }));
      this.domainList = [...this.domainList, ...newItems];

      // 逐个检测新增的域名
      const startIndex = this.domainList.length - newItems.length;
      await this.checkDomainsFromIndex(startIndex);
    },
    async checkDomainsFromIndex(startIndex = 0) {
      for (let i = startIndex; i < this.domainList.length; i++) {
        if (this.cancelled) break;

        const item = this.domainList[i];

        // DNS 检测
        this.$set(this.domainList, i, { ...item, dnsStatus: -1 });
        const dnsResult = await checkDomainIsNormal(item.url);
        if (this.cancelled) break;

        const dnsSuccess = dnsResult === 1;
        this.$set(this.domainList, i, {
          ...this.domainList[i],
          dnsStatus: dnsSuccess ? 1 : 0,
        });

        if (!dnsSuccess) {
          this.$set(this.domainList, i, {
            ...this.domainList[i],
            qrStatus: null,
          });
          continue;
        }

        // QR Code 获取检测 (request code)
        this.$set(this.domainList, i, {
          ...this.domainList[i],
          qrStatus: -1,
        });
        const httpCode = await this.checkQrCode(item.url);
        if (this.cancelled) break;

        this.$set(this.domainList, i, {
          ...this.domainList[i],
          qrStatus: httpCode,
        });

        if (httpCode === 200) {
          this.validCount++;
        }
      }
    },
    async checkQrCode(domainUrl) {
      try {
        const url = `${domainUrl.replace(/\/$/, "")}/login/qrCodeUrl`;

        // 获取 AES KEY
        let aesKey = AES_KEY;
        const openTrendsAesKey = config.TRENDS_AES_KEY;
        if (openTrendsAesKey) {
          try {
            aesKey = getAesKeySync() || AES_KEY;
          } catch (e) {
            aesKey = AES_KEY;
          }
        }

        // 构建请求参数（与 getQrCodeUrl 一致）
        const params = {
          clientInfo: eventCommon.fnClientInfoGet(),
        };

        // protobuf 编码 + AES 加密
        const body = handleEncode({
          protoType: undefined, // 默认使用 web.js
          type: "QrCodeUrl",
          params,
          aesKey: aesKey.toString(),
        });

        // 构建 headers
        const headers = {};
        if (openTrendsAesKey) {
          const macAddress = await getApiMacAddress();
          headers["X-MAC-ADDRESS"] = macAddress || "";
        }

        const response = await fetch(url, {
          method: "POST",
          mode: "cors",
          body,
          headers,
        });

        // 检查HTTP状态码
        if (response.status !== 200) {
          return response.status;
        }

        // 解析响应数据，验证 token 是否有正常值
        const data = await response.arrayBuffer();
        const message = handleDecode({
          data,
          protoType: undefined,
          type: "QrCodeUrl",
          aesKey: aesKey.toString(),
        });

        // 检查 token 是否有有效值
        if (message?.token) {
          return 200;
        }

        // token 无效，返回错误状态
        return 0;
      } catch (error) {
        return 0;
      }
    },
    // 获取域名并添加到本页列表（无节流，不影响其他模块）
    async fetchAndUpdateDomainPool() {
      try {
        const webBizDomains = await getDynamicDomainListForQrCode("webBiz");

        // 过滤已检测过的URL
        const newUrls = webBizDomains.filter(
          (url) => !this.checkedUrls.includes(url)
        );

        if (newUrls.length) {
          // 记录本次要检测的URL
          this.checkedUrls = [...this.checkedUrls, ...newUrls];

          // 添加到本页域名列表
          const newItems = newUrls.map((url) => ({
            url,
            dnsStatus: null,
            qrStatus: null,
          }));
          const startIndex = this.domainList.length;
          this.domainList = [...this.domainList, ...newItems];

          // 检测新增的域名
          await this.checkDomainsFromIndex(startIndex);
        }

        console.log(`[NetworkCheck] 域名补充完成，新增 ${newUrls.length} 个域名`);
      } catch (error) {
        console.error("[NetworkCheck] fetchAndUpdateDomainPool error:", error);
      }
    },
    handleButtonClick() {
      this.cancelled = true;

      // 获取所有有效的域名列表
      const validDomainList = this.domainList
        .filter((item) => item.dnsStatus === 1 && item.qrStatus === 200)
        .map((item) => item.url);

      // 发送所有有效域名列表
      if (validDomainList.length) {
        this.$emit("validDomainList", validDomainList);
      }

      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.network-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #2a2a2a;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.network-panel {
  background-color: #2a2a2a;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #3a3a3a;

  .header-text {
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
  }
}

.domain-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
}

.domain-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333333;
  }

  &.valid .domain-url {
    color: #5be87a;
  }
}

.domain-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
  font-size: 13px;
  color: #c0c0c0;
}

.status-cell {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.code-status {
    width: auto;
    min-width: 36px;
    margin-left: 8px;

    .status-text {
      font-size: 11px;
      font-weight: 500;
      color: #666666;
    }

    &.pending .status-text {
      color: #666666;
    }

    &.checking .status-text {
      color: #e6c44a;
      animation: pulse 1s ease-in-out infinite;
    }

    &.success .status-text {
      color: #5be87a;
    }

    &.error .status-text {
      color: #e85b5b;
    }
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #555555;

  &.pending {
    background-color: #555555;
  }

  &.checking {
    background-color: #e6c44a;
    animation: pulse 1s ease-in-out infinite;
  }

  &.success {
    background-color: #5be87a;
  }

  &.error {
    background-color: #e85b5b;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.empty-tip {
  text-align: center;
  padding: 24px 20px;

  .empty-text {
    font-size: 13px;
    color: #888888;
  }
}

.action-btn {
  margin: 16px 20px 20px;
  padding: 12px 16px;
  border: none;
  border-radius: 0;
  background-color: #3369fe;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s, opacity 0.2s;

  &:hover {
    background-color: #2554d9;
  }

  &:active {
    opacity: 0.9;
  }

  &.loading {
    background-color: #505050;
  }

  .btn-text {
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
  }
}

.loading-icon {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
