<template>
  <div class="comSettingDialogSystem">
    <h3>{{ $t("通用") }}</h3>
    <dl>
      <dt>{{ $t("新消息提示音") }}</dt>
      <dd>
        <ComSwitch
          :value="isNewMessageAlertTone"
          @input="handleNewMessageAlertToneChange"
        />
      </dd>
    </dl>
    <dl>
      <dt>{{ $t("最小化时消息提醒") }}</dt>
      <dd>
        <ComSwitch
          :value="isMessageReminderWhenMinimized"
          @input="handleMessageReminderWhenMinimized"
        />
      </dd>
    </dl>
    <h3>{{ $t("关于我们") }}</h3>
    <dl>
      <dt>{{ $t("版本信息") }} v1.6.3</dt>
      <dd>
        <button @click="handleVisionUpdate">{{ $t("版本更新") }}</button>
      </dd>
    </dl>
    <dl v-if="isExport">
      <dt>ocs导出</dt>
      <dd>
        <button @click="handleExpotPc68">导出数据</button>
      </dd>
    </dl>
  </div>
</template>
<script>
// api
import { checkVersion } from "@/api/imBase";

// 控件
import ComSwitch from "../switch.vue";

// 事件
import eventCommon from "@/event/common";

export default {
  components: { ComSwitch },
  data() {
    return {
      isNewMessageAlertTone: false, // 新消息提示音
      isMessageReminderWhenMinimized: true, // 最小化时消息提醒
      isExport: false,
    };
  },
  mounted() {
    const { deviceConfig } = eventCommon.fnConfigRU();

    this.isNewMessageAlertTone = deviceConfig.isNewMessageAlertTone;
    this.isMessageReminderWhenMinimized =
      deviceConfig.isMessageReminderWhenMinimized;
  },
  methods: {
    /**
     * 新消息提示音 改变
     */
    handleNewMessageAlertToneChange() {
      this.isNewMessageAlertTone = !this.isNewMessageAlertTone;

      eventCommon.fnConfigRU({
        infoMerge: {
          isNewMessageAlertTone: this.isNewMessageAlertTone,
        },
      });
    },
    /**
     * 最小化时消息提醒 改变
     */
    handleMessageReminderWhenMinimized() {
      this.isMessageReminderWhenMinimized =
        !this.isMessageReminderWhenMinimized;

      eventCommon.fnConfigRU({
        infoMerge: {
          isMessageReminderWhenMinimized: this.isMessageReminderWhenMinimized,
        },
      });
    },
    /**
     * 版本更新
     */
    handleVisionUpdate() {
      checkVersion().then((res) => {
        if (res && res.version === Number("1.9.0".replace(/\./, ""))) {
          window.$toast(i18n.t("已是最新版本"));
          return;
        }

        window.open("https://ocs.com", "_blank");
      });
    },
    handleExpotPc68() {
      window
        .$confirm({
          remark:
            "此导出功能回导出所有在此设备登录过的ocs数据，并且导出过程中会退出登录",
        })
        .then((isExport) => {
          if (isExport) {
          }
        });
    },
  },
};
</script>
