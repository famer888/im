import i18n from "@/assets/lang/i18n";
import { Local } from "@/utils";
// api
import { CReqChatLogin, SYS_HEARTBEAT } from "./api/login";

// 工具
import { sendErrToSentry } from "@/utils/sentry";
import { getNewNormalDomain } from "@/utils/trendsDomain";
import { benchmark } from "@/debuggers";

// 事件
import { eventWsReceivedMsg } from "@/event";
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

let webSocket; // websocket的实例

let wsUrl = "";

let timer;

// 延时提示断开
let timerLoginoutTip = null;

// 是否连接
let isContact = false;

// 心跳检测
let timerHeart = null;

export const websocketCreate = (url) => {
    // 如果已有 WebSocket 连接，先清除旧的事件监听器
    if (webSocket) {
        webSocket.removeEventListener("open", onOpen);
        webSocket.removeEventListener("message", onMessage);
        webSocket.removeEventListener("close", onClose);
        webSocket.removeEventListener("error", onError);

        if (timerHeart) {
            clearInterval(timerHeart);
        }

        webSocket.close(); // 关闭旧的 WebSocket 连接
        webSocket = null; // 清理 WebSocket 实例
    }

    isContact = true;

    webSocket = new WebSocket(url || wsUrl);

    // 新的事件监听器
    webSocket.addEventListener("open", onOpen);
    webSocket.addEventListener("message", onMessage);
    webSocket.addEventListener("close", onClose);
    webSocket.addEventListener("error", onError);

    timerHeart = setInterval(() => {
        if (isContact && webSocket) {
            SYS_HEARTBEAT();
        }

        if (!webSocket) {
            reconnect();
        }
    }, 3000);
};

const onError = () => {
    console.log("websocket ===> 错误重连");
    reconnect(wsUrl);
    sendErrToSentry(2, event);
};

const onClose = () => {
    if (isContact) {
        console.log("websocket ===> 关闭重连" + wsUrl);
        reconnect(wsUrl);
    }
};

const onOpen = () => {
    webSocket.binaryType = "arraybuffer";
    CReqChatLogin();
    clearTimeout(timerLoginoutTip);
    timerLoginoutTip = null;

    // socket连接成功
    eventBase.fnCommunicationSendMsg({
        operator: "network",
        data: {
            networkStatusType: "socketLogin",
        },
    });
};

const onMessage = (event) => {
    // 拿到任何消息都说明当前连接是正常的
    eventWsReceivedMsg(event.data);
    clearTimeout(timerLoginoutTip);
    timerLoginoutTip = null;

    // socket连接成功
    eventBase.fnCommunicationSendMsg({
        operator: "network",
        data: {
            networkStatusType: "socketLogin",
        },
    });
};

export const websocketClose = (isClose) => {
    if (isClose && isContact) {
        isContact = false;
    }

    if (webSocket) {
        webSocket.removeEventListener("open", onOpen);
        webSocket.removeEventListener("message", onMessage);
        webSocket.removeEventListener("close", onClose);
        webSocket.removeEventListener("error", onError);

        if (timerHeart) {
            clearInterval(timerHeart);
        }

        webSocket.close(); // 关闭旧的 WebSocket 连接
        webSocket = null; // 清理 WebSocket 实例
    }
};

export const setWsUrl = (url) => {
    wsUrl = url;
};

export const webSocketSend = (value) => {
    if (isContact && webSocket) {
        try {
            if (webSocket.readyState !== WebSocket.CLOSED) {
                webSocket.send(value);
            }
        } catch (error) {
            window.$toast(i18n.t("当前网络异常，请检查网络设置"));
        }
    } else {
        window.$toast(i18n.t("当前网络异常，请检查网络设置"));
    }
};

 const reconnect = () => {
    if (isContact) {
        // benchmark: 记录重连次数
        benchmark.recordReconnect();

        const networkStatusType = eventCommon.fnNetworkStatusTypeRU();
        if (networkStatusType !== "networkAnomaly" && !timerLoginoutTip) {
            timerLoginoutTip = setTimeout(() => {
                 // socket重新连接中
                eventBase.fnCommunicationSendMsg({
                    operator: "network",
                    data: {
                        networkStatusType: "socketLoginout",
                    },
                });
                timerLoginoutTip = null;
            }, 9000)
        }

        // 没连接上会一直重连，设置延迟避免请求过多
        clearTimeout(timer);
        timer = setTimeout(async () => {
            if (isContact) {
                let url = await getNewWebSocketUrl();
                websocketCreate(url);
            }
        }, 4000);
    }
};

const getNewWebSocketUrl = async () => {
    let newUrl = (await getNewNormalDomain("webSession")) || "";
    if (!newUrl) {
        newUrl = wsUrl;
    }
    newUrl = ensureWsPrefix(newUrl);
    return newUrl;
};

function ensureWsPrefix(url) {
    if (!url) return url;
    // 检查字符串是否包含 "ws"
    // console.log("ensureWsPrefix--", url)
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
        // 如果没有以 "ws://" 或 "wss://" 开头，则添加 "ws://"
        url = "ws://" + url;
    }
    return url;
}

window.addEventListener("online", function () {
    console.log("网络连接已恢复!");
    // socket重新连接中
    eventBase.fnCommunicationSendMsg({
        operator: "network",
        data: {
            networkStatusType: "socketLogin",
        },
    });

    if (isContact) {
        websocketCreate(wsUrl);
    }
});

window.addEventListener("offline", function () {
    console.log("网络连接已断开!");

    // 网络异常
    eventBase.fnCommunicationSendMsg({
        operator: "network",
        data: {
            networkStatusType: "networkAnomaly",
        },
    });

    // 关闭web
    websocketClose();
});
