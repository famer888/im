import Vue from 'vue'
import { baseUrl } from "./base/unit";

//获取公钥接口
export function getPublicKey(payload) {
    return Vue.prototype.$getAxios(`${baseUrl()}/dynamicKeys/getPublicKey`, payload)
}
//申请Aes秘钥接口
export function applyAesKey(payload) {
    return Vue.prototype.$postAxios(`${baseUrl()}/dynamicKeys/applyAesKey`, payload)
}