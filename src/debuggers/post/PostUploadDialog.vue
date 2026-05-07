<template>
  <div v-if="visibleInner" class="postUploadDialog">
    <div class="dialogCard">
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <h3>上传日志</h3>
      <p class="desc">
        隐私提醒：日志可能包含设备与网络信息，请仅在官方客服指导下上传。我们理解你的顾虑，日志仅用于定位问题，不会用于其他用途。
      </p>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="result">
        <p><span>上传地址：</span>{{ result.filepath }}</p>
        <p><span>压缩密码：</span>{{ result.password }}</p>
        <p><span>上传uid：</span>{{ result.uploadUid }}</p>
        <p><span>上传时间：</span>{{ result.uploadTime }}</p>
      </div>

      <div class="actionBar">
        <button class="copyBtn" @click="handleCopyResult">复制到剪贴板</button>
        <button class="uploadBtn" :disabled="loading" @click="handleUpload">
          {{ uploadButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import eventCommon from "@/event/common";
import { copyText } from "@/utils/clipboard";
import { uploadPackagedLog } from "./renderer";

export default {
  data() {
    return {
      visibleInner: false,
      loading: false,
      percent: 0,
      errorMsg: "",
      result: {
        filepath: "",
        password: "",
        uploadUid: "",
        uploadTime: "",
      },
    };
  },
  computed: {
    uploadButtonText() {
      if (!this.loading) return "上传日志";
      return `上传中 ${this.percent}%`;
    },
  },
  methods: {
    open() {
      this.visibleInner = true;
    },
    close() {
      this.visibleInner = false;
    },
    handleClose() {
      if (this.loading) return;
      this.close();
    },
    async handleUpload() {
      const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
      if (!loginId) {
        this.errorMsg = "未获取到登录信息";
        return;
      }

      this.loading = true;
      this.percent = 0;
      this.errorMsg = "";
      this.result = {
        filepath: "",
        password: "",
        uploadUid: "",
        uploadTime: "",
      };

      const res = await uploadPackagedLog({
        loginId,
        onProgress: (percent) => {
          this.percent = percent;
        },
      });

      this.loading = false;
      if (!res || !res.success) {
        this.errorMsg = (res && res.msg) || "上传失败";
        return;
      }

      this.result = {
        filepath: res.filepath,
        password: res.password,
        uploadUid: String(loginId),
        uploadTime: String(Date.now()),
      };
    },
    handleCopyResult() {
      const text = `上传地址：${this.result.filepath || ""}\n压缩密码：${this.result.password || ""}\n上传uid：${this.result.uploadUid || ""}\n上传时间：${this.result.uploadTime || ""}`;
      copyText(text);
      window.$toast("已复制到剪贴板");
    },
  },
};
</script>

<style scoped lang="scss">
.postUploadDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialogCard {
  width: 460px;
  min-height: 260px;
  background: #fff;
  border-radius: 8px;
  padding: 20px 20px 72px;
  position: relative;
}

.dialogCard > picture {
  position: absolute;
  right: 12px;
  top: 10px;
  cursor: pointer;
}

.dialogCard > h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialogCard > .desc {
  margin: 12px 0;
  color: #666;
  font-size: 13px;
}

.actionBar {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.uploadBtn {
  border: 1px solid #3369fe;
  background: #3369fe;
  color: #fff;
  border-radius: 4px;
  width: 120px;
  height: 34px;
  cursor: pointer;
}

.error {
  margin-top: 12px;
  color: #f44141;
  font-size: 12px;
}

.result {
  margin-top: 12px;
  background: #f8f9fd;
  padding: 10px;
  border-radius: 4px;
  word-break: break-all;
}

.result p {
  margin: 4px 0;
  font-size: 12px;
  color: #333;
}

.result span {
  color: #999;
}

.copyBtn {
  border: 1px solid #3369fe;
  color: #3369fe;
  background: #fff;
  border-radius: 4px;
  width: 120px;
  height: 34px;
  cursor: pointer;
}

.uploadBtn:disabled,
.copyBtn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
