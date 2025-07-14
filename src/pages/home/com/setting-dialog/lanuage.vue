<template>
  <div class="comSettingDialogLanuage">
    <h3>{{ $t("语言") }}</h3>
    <dl>
      <dt>{{ $t("选择语言") }}</dt>
      <dd>
        <div class="select">
          <span>
            {{ languageList[languageIndex] }}
          </span>
          <img src="@/assets/images/setting/choice-icon.png" />
          <ul>
            <li
              v-for="(item, index) in languageList"
              :key="index"
              @click="handleLanguageSet(index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </dd>
    </dl>
  </div>
</template>
<script>
import i18n from "@/assets/lang/i18n";
import { updateUserInfo } from "@/api/imBase";

export default {
  data() {
    return {
      languageIndex: 1,
      languageList: ["English", "中文", "繁体", "Tiếng Việt", "Português"],
      languageValueList: ["en", "zh", "zh-tw", "vi", "pt"],
    };
  },
  mounted() {
    this.languageIndex = this.languageValueList.indexOf(i18n.locale);
  },
  methods: {
    /**
     * 语言设置
     */
    handleLanguageSet(index) {
      // 设置索引
      this.languageIndex = index;

      // 改变翻译
      i18n.locale = this.languageValueList[index];

      // 记录到本地
      eventCommon.fnConfigRU({
        infoMerge: {
          language: this.languageValueList[index],
        },
      });

      // api
      updateUserInfo({
        userParam: {
          language: index + 1,
        },
        ops: [10],
      });
    },
  },
};
</script>
