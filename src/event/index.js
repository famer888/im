import { ipcRenderer } from "@/platform";
import packet from "@/api/base/imweb-web";
import channelEvents from "@/api/base/channel_event";
import { decrypt } from "@/socket/api/request";
import { ReceiveServerToClient } from "@/socket/api/message";
import { fnUpdateKeyFriend } from "@/utils/encryption-decryption";
import { Cache } from "@/cache";

// 事件
import eventBase from "./base";
import eventMsg from "./msg";
import eventFriend from "./friend";
import eventGroup from "./group";
import eventCheduledCeletion from "./cheduled-deletion";
import eventCommon from "@/event/common";

// 之前的时间
let timeBefore = new Date().getTime();

/**
 * 接收到websocket的消息
 */
export function eventWsReceivedMsg(arrayBuffer) {
    let timeNow = new Date().getTime();
    let timeout = 0;

    if (timeNow - timeBefore < 20) {
        timeout = timeBefore + 20 - timeNow;
        timeBefore = timeBefore + 20;
    } else {
        timeBefore = timeNow;
    }

    setTimeout(() => {
        fnSocketMessage(arrayBuffer);
    }, timeout);
}

/**
 * 处理收到的消息
 */
const fnSocketMessage = (arrayBuffer) => {
    const packetStr = {
        20001: "LoginResp", // 登录
        20102: "PushOneToOneMessageResp", // 私聊消息接收
        20202: "PushGroupMessageResp", // 群聊消息接收(自己/其他人)
        20103: "PushRecallOneToOneMessageResp", // 私聊消息删除
        20201: "SendGroupMessageResp", //群聊消息发送
        20203: "PushRecallGroupMessageResp", // 群聊消息删除
        20101: "OneToOneMessageResp", // 消息发送成功
        20104: "PushReceiptMessageResp", // 消息发送同步
        20301: "PushFriendRecordMessageResp", //添加好友通知
        20302: "PushFriendReqNumResp", //好友申请
        20401: "PushGroupReqNumResp", // 推送群请求
        20402: "PushGroupReqMessageResp", // 推送群请求与处理消息
        20501: "PushKeyPairChangeMessageResp",
        29999: "ErrrMessageResp", // 消息报错
        20601: "PushUserOnOrOffLineMessageResp", // 推送用户上下线
        20701: "PushGroupEventMessage",
        20403: "PushGroupMsgReceiptMessage",
        4203: "PushChannelMessage", // 频道消息接收
        4205: "PushRecallChannelMessage", // 频道消息撤回/删除
        4201: "PushSendChannelMessageSuccessMessage", // 频道消息发送成功
    };

    const code = new DataView(arrayBuffer.slice(2, 4)).getUint16();
    const buffer = Buffer.from(arrayBuffer.slice(16));
    const method = packetStr[code];

    // 退出登录
    if(code === 20002) {
        console.log("20002-1--")
        ipcRenderer.send("auto-export-db", {});
    }

    if (![29901, 20001].includes(code)) {
        console.log('收到推送--', code);
    }

    // 推送敏感词更新事件及内容消息
    if (code == 30001) {
        // 敏感词初始化
        eventCommon.fnSensitiveWordsInit();
        return;
    }

    // 归档发生变化
    if (code === 20603) {
        eventBase.fnCommunicationSendMsg({
            operator: "archiveUpdate",
        });
        return;
    }

    /**
     * 如果不存在就不能解析
     */
    if (!method) {
        return;
    }

    const data = method
        ? packet[method].decode(new Uint8Array(decrypt(buffer)))
        : "";

    try {
        const id = parseInt(new DataView(arrayBuffer.slice(8)).getBigUint64());
        if (id != 0) {
            data.id = id;
        }
    } catch (error) {
        //
    }

    console.log({ data });

    // 确认接收
    if (code !== 20701) {
        ReceiveServerToClient(data.id);
    }

    switch (code) {
        case 20001: {
            // 登录成功 接口已对应处理，所以这个推送不需要处理
            break;
        }
        // 频道消息接收
        case 4203: {
            if (data.latestChannelMessage) {
                eventMsg.fnChannelMsgAdd(data.latestChannelMessage);
            }
            break;
        } 
        // 频道消息撤回/删除
        case 4205: {
            // 远程其它端操作清除全部，clear为1，表示全部清除
            const { msgId, msgTargetId, clear } = data?.latestRecallChannelMessage || {};
            if(!msgTargetId) return;
            let isClear = Boolean(clear);
            // 频道消息删除
            eventMsg.fnMsgDelete({
                info: {
                    id: Number(msgTargetId),
                    type: "channel",
                    msgId: Number(msgId),
                    idsDelete: isClear
                        ? []
                        : [{msgId: Number(msgId)}],
                    isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
                },
            });
            break;
        } 
        // 好友消息接收
        case 20102: {
            if (data.oneToOneMessage) {
                eventMsg.fnFriendMsgAdd(data.oneToOneMessage, data.id);
            }
            break;
        }
        case 20202: {
            // 群聊消息接收(自己/其他人)
            for (const item of data.groupMsg) {
                eventMsg.fnGroupMsgAdd(item);
            }
            break;
        }
        case 20101: {
            // 好友 消息发送成功
            eventMsg.fnMsgSendSuccess(data, "friend", code);
            break;
        }
        case 20201: {
            // 群组 消息发送成功
            eventMsg.fnMsgSendSuccess(data, "group", code);
            break;
        }
        case 4201: {
            // 频道 消息发送成功
            eventMsg.fnMsgSendSuccess(data, "channel", code);
            break;
        }
        case 20103: {
            // 私聊消息删除
            // 远程其它端操作清除全部，clear为1，表示全部清除
            let isClear = data.recallOneToOneMessages[0].clear;
            eventMsg.fnMsgDelete({
                info: {
                    id: Number(data.recallOneToOneMessages[0].msgTargetId),
                    type: "friend",
                    msgId: Number(data.recallOneToOneMessages[0].msgId),
                    idsDelete: isClear
                        ? []
                        : data.recallOneToOneMessages.map((item) => {
                              return { msgId: Number(item.msgId) };
                          }),
                    isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
                },
            });
            break;
        }
        case 20203: {
            // 远程其它端操作清除全部，clear为1，表示全部清除
            let isClear = data.recallGroupMessages[0].clear;
            // 群聊消息删除
            eventMsg.fnMsgDelete({
                info: {
                    id: Number(data.recallGroupMessages[0].msgTargetId),
                    type: "group",
                    msgId: Number(data.recallGroupMessages[0].msgId),
                    idsDelete: isClear
                        ? []
                        : data.recallGroupMessages.map((item) => {
                              return { msgId: Number(item.msgId) };
                          }),
                    isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
                },
            });
            break;
        }
        case 20104: {
            const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });

            if (Number(_.get(data, "receipts[0].targetId")) === loginId) {
                eventMsg.fnMsgFriendRead(data);
            }
            break;
        }
        case 20301: {
            if (
                data.friendRecordmsg[0].doType &&
                data.friendRecordmsg[0].doType === 5
            ) {
                // 好友删除
                const id = Number(
                    _.get(data.friendRecordmsg, "[0].targetUid") || 0
                );
                if (id) {
                    eventBase.fnCommunicationSendMsg({
                        operator: "deleteFriend",
                        data: { id },
                    });
                }
            } else {
                // 好友信息变更
                eventFriend.fnFriendCU(data);
            }

            break;
        }
        case 20302: {
            // 好友申请
            const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });
            const { friendReqNum = 0 } = data || {};
            const total = Number(friendReqNum);
            Cache(`${loginId}-newFriendReqTotal`, { total })
            eventBase.fnCommunicationSendMsg({
                operator: "updateNewFriendReqTotal",
                data: {
                    total,
                }
            });
            eventBase.fnCommunicationSendMsg({operator: "newFriendReq"});
            
            break;
        }
        case 20501: {
            // 更新好友密钥
            fnUpdateKeyFriend(data);
            break;
        }
        case 20701: {
            // let datas = handleDeleteItem(data, 4, 'event')
            eventGroup.fnRnGroupEvent(data);
            break;
        }
        case 29999: {
            // 退出登录
            let { commonResult } = data;
            if (commonResult.errCode == 100) {
                // 登出前要先导出
                ipcRenderer.send("auto-export-db", {}).then(res => {
                    eventCommon.fnLoginout();
                });
            }

            if ([1022, 1021].includes(commonResult.errCode)) { 
                // 群被禁用，被禁言 信息发送失败,更新信息状态和添加提示
                eventMsg.fnMsgSendFail({ id: Number(data.targetId), type: 'group',  customMsgId: String(Number(data.flag)) });
                eventGroup.groupEventHandleMsg(data);
            }
            if (commonResult.errCode == 5113) {
                eventFriend.fnHandTipAddFriend(data)
            }
            break;
        }
        case 20403: {
            // 群消息已读用户
            const { receiptMessage = [] } = data || {};
            eventMsg.fnGroupMsgReadRecord(receiptMessage)
        }

        default:
    }
};


// 测试方法，测试丢失群事件方法
function handleDeleteItem(data, index, type) {
    data = _.cloneDeep(data);
    if (data.groupReqEventMsgDto.length > 0 && data.groupReqEventMsgDto.length > index && type === 'event') {
        data.groupReqEventMsgDto.splice(index, 1);
    }
    if (data.groupUpdateEventMsgDto.length > 0 && data.groupUpdateEventMsgDto.length > index && type === 'update') {
        data.groupUpdateEventMsgDto.splice(index, 1);
    }
    return data
}
//////////////////  定时执行

let timerRunEvent = null;

export const intervalRunEvent = () => {
    if (timerRunEvent) {
        clearInterval(timerRunEvent);
    }

    timerRunEvent = setInterval(() => {
        eventCheduledCeletion.fnCheduledDeletionMsgDelete();
        eventGroup.fnTimer();
        eventMsg.fnMsgSendTimeout();
        eventMsg.fnGroupMsgReadUpdate();
    }, 200);
};

export const intervalRunEventClear = () => {
    if (timerRunEvent) {
        clearInterval(timerRunEvent);
    }
};
