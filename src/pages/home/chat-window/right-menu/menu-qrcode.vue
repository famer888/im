<template>
  <div class="comGroupQrCode">
    <div class="head">
      <picture>
        <img
          src="@/assets/images/chat/arrow-left-blue.png"
          @click="$emit('close')"
        />
      </picture>
      {{ title }}
    </div>
    <section>
      <template v-if="codeUrl">
        <qrcode-vue
          class="code"
          ref="qrcode"
          :value="codeUrl"
          level="H"
          :size="180"
        />
        <h3>{{ $t("二维码长期有效") }}</h3>
        <p
          v-if="isResetCode"
          @click="handleGroupQrCodeGet"
        >
          <img class="refresh-icon" src="@/assets/images/common/refresh.png" />
          {{ $t("重置二维码") }}
        </p>
        <ComTextAvatar 
          v-if="iconType === 'textAvatar'" 
          class="textAvatar"
          :id="id"
          :value="name"
        />
        <!-- <ComImage v-else ref="groupPic" :src="pic" type="group" /> -->
      </template>
      <span v-else>{{ $t("二维码链接异常") }}</span>
    </section>
    <div v-if="codeUrl" class="buttons">
      <div class="btn-item">
        <button @click="handleExportQrCode">
          <img src="@/assets/images/system/down.png" />
        </button>
        <span class="btn-title">{{ $t("保存图片") }}</span> 
      </div>
      <div class="btn-item">
        <button @click="handleGroupQrCodeImageForward">
          <img src="@/assets/images/system/share.png" />
        </button>
        <span class="btn-title">{{ $t("转发给朋友") }}</span> 
      </div>
      <div class="btn-item">
        <button @click="handleGroupQrCodeImageForward">
          <img src="@/assets/images/system/link.png" />
        </button>
        <span class="btn-title">{{ $t("复制链接") }}</span> 
      </div>
    </div>
  </div>
</template>
<script>
import QrcodeVue from "qrcode.vue";
import {
  exportBase64ImgToLocal,
  userSelectSavePath,
  base64ToFile,
} from "@/utils/fileTools";
import { copyToClipboard } from "@/utils/base";
import { canvasAddTest, canvasAddRadiusImg } from "@/utils/canvasTools";
import ComTextAvatar from '@/components/text-avatar';

// api
import { groupQrCode } from "@/api/imGroup";

// 事件
import eventBase from "@/event/base";

export default {
  components: { QrcodeVue, ComTextAvatar },
  props:  ["codeUrl", "isResetCode", "pic", "name", "title", "id", "iconType"],
  data() {
    return {
      showMoreDetail: false,
    };
  },
  mounted() {
  },
  methods: {
    /**
     * 复制链接
     */
    handleCopyLink() {
      copyToClipboard(this.codeUrl);
      window.$toast(this.$t("复制成功"));
    },
    /**
     * 绘制二维码图片
     */
    handleDrawQrCodeImage() {
      // 获取qrcode的DOM元素
      const qrcodeElementBox = this.$refs.qrcode.$el;

      const qrcodeElement = qrcodeElementBox.querySelector("canvas");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = 270;
      canvas.height = 300;

      // 添加背景色
      ctx.fillStyle = "#F5F5F5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height - 35);

      // 将二维码元素绘制到canvas上
      let codeW = qrcodeElement.offsetWidth;
      let codeH = qrcodeElement.offsetHeight;
      let codeX = (canvas.width - codeW) / 2;
      ctx.drawImage(qrcodeElement, codeX, 15, codeW, codeH);

      //绘制文本信息
      canvasAddTest(canvas, ctx, "二维码长期有效", {
        y: 212,
        color: "#787878",
        fontSize: "10px",
      });

      canvasAddTest(canvas, ctx, this.name, {
        y: 232,
        color: "#000000",
        fontSize: "14px",
      });

      //绘制头像
      // if(this.iconType !== "textAvatar") {
      //   let groupPic = this.$refs.groupPic.$el;
      //   canvasAddRadiusImg(canvas, ctx, groupPic, 110, 242, 50, 50, 25);
      // }
      
      return canvas.toDataURL("image/png");
    },
    /**
     * 导出二维码
     */
    async handleExportQrCode() {
      const qrCodeBase64 = this.handleDrawQrCodeImage();
      let suffix = ".png";
      let fileName = this.name + suffix;
      let { filePath, canceled } = await userSelectSavePath(fileName);
      if (!filePath || canceled) return;
      if (!filePath.includes(suffix)) {
        filePath = filePath + suffix;
      }
      const errInfo = await exportBase64ImgToLocal(qrCodeBase64, filePath);
      if (errInfo) {
        window.$toast("保存失败！");
      } else {
        window.$toast("保存成功！");
      }
    },
    /**
     * 重新获取二维码
     */
    handleGroupQrCodeGet() {
      this.$emit("resetCodeUrl")
    },
    /**
     * 群二维码图片转发
     */
    async handleGroupQrCodeImageForward() {
      // 获取二维码图片的 base64
      const qrCodeBase64 = this.handleDrawQrCodeImage();

      // 文件名
      const fileName = this.name + ".jpg";

      // 转为文件
      const file = base64ToFile(qrCodeBase64, fileName, "image/jpeg");

      // 打开转发对话框
      eventBase.fnCommunicationSendMsg({
        operator: "groupQrCodeImageForward",
        data: {
          file,
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.comGroupQrCode {
  position: fixed;
  right: 0;
  top: 34px;
  width: 270px;
  height: calc(100% - 34px);
  background: #ffffff;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    background: #ffffff;
    border-bottom: 1px solid #f5f5f5;
    position: relative;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    color: #000;
    width: 100%;

    > picture {
      position: absolute;
      left: 0;
      top: 0;
      height: 50px;
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;

      > img {
        display: block;
        width: 25px;
      }
    }
  }

  > section {
    height: 250px;
    width: 100%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    padding-bottom: 30px;

    > h3 {
      display: block;
      font-size: 13px;
      color: #787878;
      line-height: 30px;
    }

    > p {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #333;
      cursor: pointer;

      &:hover {
        color: #000;
      }

      > img {
        height: 18px;
        margin-right: 4px;
      }
    }

    > img {
      width: 48px;
      height: 48px;
      border-radius: 99px;
      position: absolute;
      bottom: -24px;
      left: 50%;
      margin-left: -24px;
      background: #f2f2f2;
    }

    > span {
      color: red;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
    }
  }

  .buttons {
    display: flex;
    align-items: center;
    border: none;

    .btn-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-left: 20px;

      &:first-child {
       margin-left: 0;
      }
    }
    
    button {
      width: 54px;
      height: 54px;
      background: #F2F9FF;
      border-radius: 16px;
      border: none;
      font-size: 16px;
      font-weight: 500;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      cursor: pointer;
      position: relative;

      &:hover {
        background: #f9f9f9;
      }

      > img {
        display: block;
        width: 20px;
      }
    }

    .btn-title {
      font-size: 12px;
      color: #000;
      font-weight: 300;
    }
  }
}
</style>
