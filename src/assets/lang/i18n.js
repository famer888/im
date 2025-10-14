import VueI18n from "vue-i18n";
import Vue from "vue";
import { Local } from "@/utils";

Vue.use(VueI18n, {
  i18n: function (path, options) {
    let value = i18n.t(path, options);
    if (value !== null && value !== undefined) {
      return value;
    }
    return "";
  },
});
export default new VueI18n({
  // 使用localStorage存储语言状态是为了保证页面刷新之后还是保持原来选择的语言状态
  locale: Local("lang") || "zh", // 定义默认语言为中文
  messages: {
    zh: require("@/assets/lang/zh-CN.json"),
    en: require("@/assets/lang/en.json"),
    vi: require("@/assets/lang/vi.json"),
    pt: require("@/assets/lang/pt.json"),
    'zh-tw': require("@/assets/lang/zh-TW.json"),
  },
});
