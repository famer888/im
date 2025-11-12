import { CReqChatSendPrivate, CReqSendChatGroup, CReqSendChatChannel } from "@/socket/api/message";
import { fnFormartMsgParams } from "./encryption-decryption";

// 工具
import { strIsSafe } from "@/utils/base";

// 事件
import eventCommon from "@/event/common";

export const sendMessage = async (params, flag) => {
    const loginInfo = eventCommon.fnCommonInfoRU({
        getId: "loginInfo",
    });

    const { id, name, icon } = loginInfo;

    const defaultParams = {
        atUids: [],
        msgType: 0,
        chatType: 0,
        sendUid: id,
        receiveUid: "",
        sendUser: {
            nickName: name,
            uid: id,
            pic: icon,
        },
        text: "",
        groupName: "",
    };

    let info = Object.assign({}, defaultParams, params);

    if (info.groupId) {
        const { groupId, groupNickName } = info;
        info.sendMember = {
            user: info.sendUser,
            groupNickName,
            groupId,
        };
    }

    if(info.content) {
      // 替换br
       info.content =  info.content.replace(/<br\s*\/?>/gi, '\n');
       info.text = info.text.replace(/<br\s*\/?>/gi, '\n');
    }
    sendMessageList.push({ info, flag });
};

let sendMessageList = [];

setInterval(() => {
    if (sendMessageList.length > 0) {
        const { info, flag } = sendMessageList[0];
        sendMessageList = sendMessageList.filter((_, index) => index !== 0);
        if (info && info.text) {
            if (!strIsSafe(info.text)) {
                return;
            }
        }

        if (info.groupId) {
            fnFormartMsgParams({
                data: [12, 18].includes(info.msgType) ? info : { ...info, version: 1 },
                customMsgId: flag,
                id: info.groupId,
                type: "group",
            }).then((res) => {
                if (res) {
                    // console.log("CReqSendChatGroup--", res)
                    CReqSendChatGroup(res, flag);
                }
            });
        } else if(info.channelId) {
             fnFormartMsgParams({
                data: [12, 18].includes(info.msgType) ? info : { ...info, version: 1 },
                customMsgId: flag,
                id: info.channelId,
                type: "channel",
            }).then((res) => {
                if (res) {
                    console.log("CReqSendChatChannel--", res, flag)
                    CReqSendChatChannel(res, Number(flag));
                }
            });
        } else {
            fnFormartMsgParams({
                data: info,
                customMsgId: flag,
                id: info.receiveUid,
                type: "friend",
            }).then((res) => {
                if (res) {
                    // console.log("CReqChatSendPrivate--", res)
                    CReqChatSendPrivate(res, flag);
                }
            });
        }
    }
}, 100);
