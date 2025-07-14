import { LoginReq } from "@/api/base/imweb-web";
import { initHeader } from "./request";
import { generateUniqueId } from "@/utils/base";
import { webSocketSend } from "@/socket";

// 事件
import eventCommon from "@/event/common.js";

/**
 * 登陆
 */
export const CReqChatLogin = () => {
    const { deviceConfig } = eventCommon.fnConfigRU();

    let installCode = deviceConfig.installCode;
    if (!installCode) {
        installCode = generateUniqueId();
        eventCommon.fnConfigRU({
            infoMerge: {
                installCode,
            },
        });
    }

    const message = LoginReq.create({
        clientInfo: eventCommon.fnClientInfoGet(),
        installCode,
    });
    const buffer = LoginReq.encode(message).finish();
    const rb = initHeader(buffer, 10001);
    console.log("发出推送-10001-")
    webSocketSend(rb);
};

/**
 * 心跳
 */
export const SYS_HEARTBEAT = () => {
    const message = LoginReq.create({
        clientInfo: eventCommon.fnClientInfoGet(),
    });
    const buffer = LoginReq.encode(message).finish();
    const rb = initHeader(buffer, 19901);
    webSocketSend(rb);
};
