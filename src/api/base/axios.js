import axios from "axios";
import { Local } from "@/utils";
import { sendErrToSentry } from "@/utils/sentry";
import { baseUrl, FairGuard } from "./unit";
let baseURL = baseUrl() || process.env.VUE_APP_BASE_API;
axios.defaults.baseURL = baseURL;
// 暫存：紀錄執行中的請求
const pending = new Map();

const addPending = (config) => {
    // 利用method和url來當作這次請求的key，一樣的請求就會有相同的key
    const key = [config.method, config.url].join("&");
    // 為config添加cancelToken屬性
    config.cancelToken = new axios.CancelToken((cancel) => {
        // 確認暫存中沒有相同的key後，把這次請求的cancel函式存起來
        if (!pending.has(key)) pending.set(key, cancel);
    });
};

const removePending = (config) => {
    // 利用method和url來當作這次請求的key，一樣的請求就會有相同的key
    const key = [config.method, config.url].join("&");
    // 如果暫存中有相同的key，把先前存起來的cancel函式拿出來執行，並且從暫存中移除
    if (pending.has(key)) {
        const cancel = pending.get(key);
        cancel(key);
        pending.delete(key);
    }
};
const createHash = (hashLength) => {
    // 默认长度 24
    let hash = Array.from(Array(Number(hashLength) || 24), () =>
        Math.floor(Math.random() * 36).toString(36)
    ).join("");
    Local("deviceId", hash);
    return hash;
};
const genReqBaseInfo = () => ({
    language: Local("lang") || "zh",
    platId: 190105,
});
// // 添加请求拦截器
// axios.interceptors.request.use(
//     function (config) {
//         if (config.data?.isformData) {
//             config.headers["content-type"] =
//                 "application/x-www-form-urlencoded";
//             config.data = config.data.file;
//         }
//         if (config.hasRemovePending) {
//             // // 先判斷是否有重複的請求要取消
//             removePending(config);
//         }

//         // 把這次請求加入暫存
//         addPending(config);

//         return config;
//     },
//     function (error, config) {
//         // 请求错误时弹框提示，或做些其他事
//         sendErrToSentry(1, error);
//         return Promise.reject(error);
//     }
// );

// // 添加响应拦截器
// axios.interceptors.response.use(
//     (response) => {
//         const res = response.data;
//         // 請求被完成，從暫存中移除
//         removePending(response);
//         // 如果返回的状态码不是200 就主动报错，根据自己的后台返回值进行判断
//         if (res.code == 3400) {
//             // window.vm.$router.push('/login')
//         } else if (
//             res.code !== 200 &&
//             res.StatusCode != 200 &&
//             res.ret_code != 1001
//         ) {
//             window.$toast(res.message);

//             sendErrToSentry(1, res, [{ name: "http_code", value: res.code }]);

//             // 失败返回信息
//             return Promise.reject(new Error(res.message || "请求失败"));
//         }

//         return res;
//     },
//     (error) => {
//         // ==============  错误处理  ====================
//         if (error && error.response) {
//             switch (error.response.status) {
//                 case 400:
//                     error.message = "请求错误(400)";
//                     break;
//                 case 401:
//                     error.message = "未授权，请重新登录(401)";
//                     break;
//                 case 403:
//                     error.message = "拒绝访问(403)";
//                     break;
//                 case 404:
//                     error.message = "请求出错(404)";
//                     break;
//                 case 408:
//                     error.message = "请求超时(408)";
//                     break;
//                 case 500:
//                     error.message = "服务器错误(500)";
//                     break;
//                 case 501:
//                     error.message = "服务未实现(501)";
//                     break;
//                 case 502:
//                     error.message = "网络错误(502)";
//                     break;
//                 case 503:
//                     error.message = "服务不可用(503)";
//                     break;
//                 case 504:
//                     error.message = "网络超时(504)";
//                     break;
//                 case 505:
//                     error.message = "HTTP版本不受支持(505)";
//                     break;
//                 default:
//                     error.message = `连接出错(${error.response.status})!`;
//             }
//         } else {
//             error.message = "连接服务器失败!";
//         }

//         // Message.err({ message: error.message })
//         // 返回接口的错误信息
//         return Promise.reject(error);
//     }
// );

// 封装数据返回失败提示函数---------------------------------------------------------------------------
function errorState(response) {
    // 隐藏loading
    if (
        response &&
        (response.status === 200 ||
            response.status === 304 ||
            response.status === 400)
    ) {
        // 如果不需要除了data之外的数据，可以直接 return response.data
        return response;
    } else {
        // 显示加载失败
    }
    return response;
}

// 封装数据返回成功提示函数---------------------------------------------------------------------------
function successState(res) {
    // 隐藏loading

    if (res.isSuccess) {
        return res.data;
    } else {
        return res;
    }
}

// 封装axios--------------------------------------------------------------------------------------
function apiAxios(
    method,
    url,
    params,
    hideLoading,
    requestId,
    hasRemovePending
) {
    // 显示loading
    baseURL = Local("baseUrl") || baseURL;
    axios.defaults.baseURL = params && params.ownUrl ? "" : baseURL;
    const appParams = {};
    params = { ...appParams, ...params };
    const httpDefault = {
        method: method,
        baseURL: baseURL,
        url: url,
        hideLoading: hideLoading,
        hasRemovePending: hasRemovePending,
        requestId: requestId,
        // `params` 是即将与请求一起发送的 URL 参数
        // `data` 是作为请求主体被发送的数据
        params: method === "GET" || method === "DELETE" ? params : null,
        data: method === "POST" || method === "PUT" ? params : null,
        timeout: 100000,
    };
    return new Promise((resolve, reject) => {
        axios(httpDefault)
            .then((res) => {
                FairGuard.recieve(res);
                resolve(successState(res));
            })
            .catch((response) => {
                if (response && response.request && response.request.response) {
                    const res = JSON.parse(response.request.response).error;
                    reject((res && res.message) || "error");
                } else {
                    reject("error", response);
                }
                errorState(response);
            });
    });
}

export default {
    install: function (Vue) {
        Vue.prototype.$postAxios = (
            url,
            params,
            hideLoading = false,
            requestId = "",
            hasRemovePending = true
        ) =>
            apiAxios(
                "POST",
                url,
                params,
                hideLoading,
                requestId,
                hasRemovePending
            );
        Vue.prototype.$getAxios = (
            url,
            params,
            hideLoading = false,
            requestId = "",
            hasRemovePending = true
        ) =>
            apiAxios(
                "GET",
                url,
                params,
                hideLoading,
                requestId,
                hasRemovePending
            );
        Vue.prototype.$deleteAxios = (
            url,
            params,
            hideLoading = false,
            requestId = "",
            hasRemovePending = true
        ) =>
            apiAxios(
                "DELETE",
                url,
                params,
                hideLoading,
                requestId,
                hasRemovePending
            );
    },
    baseURL: axios.defaults.baseURL,
};
