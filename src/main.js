import Vue from "vue";
import VueRouter from "vue-router";
import router from "./routers";
import VueContext from "vue-context";
import "./common.scss";
import axiosApi from "./api/base/axios";
import i18n from "./assets/lang/i18n";
import ImeFixPlugin from "@/utils/ime-fix";
import ComImage from "@/components/image.vue";
import { fnPopUpMountToWindow } from "@/utils/pop-up";
import infiniteScroll from 'vue-infinite-scroll';
import { initLogCollectSystem } from "@/utils/logCollect";

Vue.use(infiniteScroll);
Vue.use(VueRouter);
Vue.component("ComImage", ComImage);
Vue.use(axiosApi);
Vue.use(VueContext);
Vue.use(ImeFixPlugin);
Vue.component("vue-context", VueContext);
Vue.prototype.$eventBus = new Vue();
initLogCollectSystem();

Vue.directive("copy", {
    inserted: function (el, binding, vnode) {
        el.node_name = binding.value || binding.expression;
        el.addEventListener("click", () => copyText(el, vnode));
    },
    update(el, binding, vnode) {
        el.node_name = binding.value || binding.expression;
    },
});

function copyText(el, vnode) {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.setAttribute("value", el.node_name);
    input.select();
    if (document.execCommand("copy")) {
        document.execCommand("copy");
        window.$toast(i18n.t("复制成功"));
    }
    document.body.removeChild(input);
}

// 公共方法挂在到全局window上
fnPopUpMountToWindow();

import("./App.vue").then((module) => {
    window.vm = new Vue({
        el: "#app",
        router,
        i18n,
        render: (h) => h(module.default),
    });
});
