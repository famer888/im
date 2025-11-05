<template>
    <MenuQrcode
      title="通过二维码邀请"
      :logoColor="chatContent.logoColor"
      :codeUrl="qrcodeUrl"
      :pic="chatContent.pic"
      :name="chatContent.channelName"
       iconType="textAvatar"
       chatType="channel"
      :id="chatContent.channelId"
      :isResetCode="[0].includes(chatContent.memberType) || chatContent.bfResetQrcode"
      @close="$emit('close')"
      @resetCodeUrl="handleGroupQrCodeGet">
    </MenuQrcode>
</template>
<script>
import MenuQrcode from "./menu-qrcode";

// api
import { groupQrCode } from "@/api/imGroup";

export default {
  components: { MenuQrcode },
  props: ["chatContent"],
  data() {
    return {
      showMoreDetail: false,
      qrcodeUrl: "",
    };
  },
  mounted() {
    this.qrcodeUrl = this.chatContent.link;
  },
  methods: {
    /**
     * 获取群二维码
     */
    handleGroupQrCodeGet() {
      groupQrCode({
        groupId: this.chatContent.id,
        force: true,
      }).then((res) => {
        const { qrUrl } = res || {};
        if (qrUrl) {
          this.groupCodeUrl = qrUrl;
        } else {
          window.$toast("二维码获取失败！");
        }
      });
    },

  },
};
</script>

<style scoped lang="scss">

</style>
