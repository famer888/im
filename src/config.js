import { isElectron } from "./platform";

export default class Config {
    //是否开启动态密钥
    static TRENDS_AES_KEY = false;
    // 调试用
    static ENABLE_AUTO_LOGIN = true;
    // 是否支持多人音视频通话
    static ENABLE_MULTI_VOIP_CALL = true;
    // 是否支持1对1音视频通话
    static ENABLE_SINGLE_VOIP_CALL = true;

    // APP SERVER的地址，不能省略http(s)前缀。
    // 默认的app server使用端口是8888，注意端口号别忘记了。
    // 上线建议使用https，使用https更安全。
    //static APP_SERVER = 'http://app.wildfirechat.net:8888';
    static APP_SERVER = "https://app.otc.net";

    static QR_CODE_PREFIX_PC_SESSION = "otc://pcsession/";
    // turn server 配置，可以添加多个
    static ICE_SERVERS = [
        {
            uri: "turn:turn.otc.net:3478",
            userName: "wfchat",
            password: "wfchat",
        },
    ];
    static LANGUAGE = "zh_CN";

    static SDK_PLATFORM_WINDOWS = 3;
    static SDK_PLATFORM_OSX = 4;
    static SDK_PLATFORM_WEB = 5;
    static SDK_PLATFORM_WX = 6;

    // html5 audio 标签不能播放amr格式的音频，需要将amr格式转换为mp3格式
    // 本服务传入amr音频文件的地址，将音频文件转换为mp3格式，并以application/octet-stream的格式返回
    // 如果语音消息很多，建议使用cdn
    static AMR_TO_MP3_SERVER_ADDRESS = Config.APP_SERVER + "/amr2mp3?path=";
    // 文件传输助手ID
    static FILE_HELPER_ID = "wfc_file_transfer";

    /**
     * 允许重新编辑多长时间内的撤回消息，单位是秒
     */
    static RECALL_REEDIT_TIME_LIMIT = 60;

    static SECRET_CHAT_MEDIA_DECODE_SERVER_PORT = 7982;
    static OPEN_PLATFORM_WORK_SPACE_URL =
        "https://open.wildfirechat.cn/work.html";
    static OPEN_PLATFORM_SERVE_PORT = 7983;

    // 允许主动加入多人音视频通话
    static ENABLE_MULTI_CALL_AUTO_JOIN = false;

    static getWFCPlatform() {
        if (isElectron()) {
            if (window.process && window.process.platform === "darwin") {
                // osx
                return 4;
            }
            // windows
            return 3;
        }
        // web
        return 5;
    }

    static config(options) {
        Object.keys(options).forEach((key) => {
            Config[key] = options[key];
        });
    }

    /**
     * 网络地址重定向
     *
     * 仅当双网环境时，需要特殊处理，默认原样返回
     *
     * @param {string} url
     * @return {string} newUrl
     */
    static urlRedirect(url) {
        if (!url) {
            return url;
        }
        // 示例代码
        // url = url.replace('oss.xxxx.com', '192.168.2.19');
        return url;
    }
}
