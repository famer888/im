import Vue from "vue";
import Confirm from "@/components/confirm.vue";
import Toast from "@/components/toast.vue";
import ComLoadingDialog from "@/components/loading-dialog.vue";

/**
 * 弹出提示
 */
const fnToast = (msg) => {
    const comp = Vue.extend(Toast);
    const instance = new comp({
        propsData: {
            msg,
        },
    });
    instance.$mount();

    document.body.appendChild(instance.$el);

    setTimeout(() => {
        document.body.removeChild(instance.$el);
    }, 2000);
};

// loading
let elLoadingDialog = null;

const fnLoadingDialog = (visible) => {
    if (elLoadingDialog) {
        document.body.removeChild(elLoadingDialog);
        elLoadingDialog = null;
    }

    if (visible) {
        const comp = Vue.extend(ComLoadingDialog);
        const instance = new comp();
        instance.$mount();
        elLoadingDialog = instance.$el;
        document.body.appendChild(elLoadingDialog);
    }
};

let elConfirm = null;

/**
 * 关闭确认弹窗
 */
const fnCloseConfirm = () => {
    if (elConfirm) {
        if (document.body.contains(elConfirm)) {
            document.body.removeChild(elConfirm);
        }
        elConfirm = null;
    }
};

/**
 * 确认弹窗
 */
const fnConfirm = async (params) => {
    fnCloseConfirm();

    return await new Promise((resolve) => {
        const comp = Vue.extend(Confirm);
        const instance = new comp({
            propsData: {
                ...params,
                callback: (value) => {
                    fnCloseConfirm();
                    resolve(value);
                },
            },
        });
        instance.$mount();
        elConfirm = instance.$el;

        document.body.appendChild(elConfirm);
    });
};

/**
 * 弹窗函数挂载到全局的变量 window
 */
export const fnPopUpMountToWindow = () => {
    // 挂载 确认弹窗
    window.$confirm = fnConfirm;
    window.$closeConfirm = fnCloseConfirm;

    // 挂载 loading
    window.$loading = fnLoadingDialog;

    // 挂载 弹出提示
    window.$toast = fnToast;
};
