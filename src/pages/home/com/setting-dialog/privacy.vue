<template>
  <div class="comSettingDialogPrivacy">
    <h3>{{ $t("设置") }}</h3>
    <dl>
      <dt>{{ $t("加我为朋友时需要验证") }}</dt>
      <dd>
        <ComSwitch
          :value="isAddingFriendsRequiresVerification"
          @input="handleAddingFriendsRequiresVerificationChange"
        />
      </dd>
    </dl>
  </div>
</template>
<script>
import ComSwitch from "../switch.vue";

// api
import { updateUserInfo } from "@/api/imBase";

// 事件
import eventCommon from "@/event/common";

export default {
  components: { ComSwitch },
  data() {
    return {
      isAddingFriendsRequiresVerification: true, // 加我为朋友时需要验证
    };
  },
  mounted() {
    // 获取系统设置
    const { accountConfig } = eventCommon.fnConfigRU();

    // 初始化
    this.isAddingFriendsRequiresVerification =
      accountConfig.isAddingFriendsRequiresVerification;
  },
  methods: {
    /**
     * 加我为朋友时需要验证 改变
     */
    handleAddingFriendsRequiresVerificationChange() {
      this.isAddingFriendsRequiresVerification =
        !this.isAddingFriendsRequiresVerification;

      // 隐私设置
      updateUserInfo({
        userParam: {
          privacy: this.isAddingFriendsRequiresVerification ? 4096 : "",
        },
        ops: [4],
      }).then((rt) => {
        if (rt.commonResult.errCode == 200) {
          // 记录到本地
          eventCommon.fnConfigRU({
            isAccount: true,
            infoMerge: {
              isAddingFriendsRequiresVerification,
            },
          });

          // 成功提示
          window.$toast(this.$t("修改成功"));
        } else {
          this.isAddingFriendsRequiresVerification = false;
          window.$toast(rt.commonResult.errMsg || this.t("修改失败"));
        }
      });
    },
  },
};
</script>
