<template>
    <MenuQrcode
      :title="$t('群二维码')"
      :codeUrl="groupCodeUrl"
      :pic="chatContent.pic"
      :name="chatContent.name"
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
      groupCodeUrl: "",
    };
  },
  mounted() {
    this.groupCodeUrl = this.chatContent.shortLink;
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
        const { qrUrl, shortLink } = res || {};
        if (qrUrl) {
          this.groupCodeUrl = shortLink;
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
