import Vue from 'vue'

// 文件上传
export function getFilePath(payload) {
    return Vue.prototype.$postAxios(`http://t68-imfile.flywaycdn.net:8087/upload?sign=${payload.sign}&time=${payload.time}&spaceType=${payload.spaceType}`, payload.file)
}