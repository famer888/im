import { ipcRenderer, remote } from "@/platform";
import { Cache } from "@/cache";
import i18n from "@/assets/lang/i18n";
import fs from "fs";
const path = require("path");

// 工具
import {
    generateUniqueId,
    textToEmojiText,
    fnLongToNumInObj,
    enumMsgType,
    getNow,
    strIsSafe,
} from "@/utils/base";
import { sendMessage } from "@/utils/messageBuild";
import {
    downloadImageToLocal,
    isNetworkImageUrl,
    checkDirectory,
} from "@/utils/fileTools";
import { getUserDataDirectory, getWorkingDir, filterSensitiveWords } from "@/utils/tools";
import { fnMsgDecryption } from "@/utils/encryption-decryption";
import { getKeys } from "@/utils/upload";
import { fnEmojiToText, fnTextSendInfoGet } from "@/utils/widget/editor";

// 事件
import eventBase from "./base";
import eventCheduledCeletion from "./cheduled-deletion";
import eventFriend from "./friend";
import eventFile from "./file";
import eventCommon from "./common";
import eventChannel from "./channel";
import { benchmark } from "@/debuggers";

/**
 * 消息去重检查
 * @param {number} id - 会话ID (friendId/groupId/channelId)
 * @param {string} type - 消息类型 (friend/group/channel)
 * @param {number} msgId - 消息ID
 * @returns {Promise<boolean>} - true: 重复消息，应跳过; false: 非重复，继续处理
 */
const fnCheckMsgRepeat = async (id, type, msgId) => {
    if (!msgId) return false;
    const isRepeat = await window.$db.checkRepeat({ id, type, msgId });
    if (isRepeat) {
        console.log(`[repeat]${type}MsgAdd blocked`, id, msgId);
    }
    return isRepeat;
};

/**
 * 消息 添加
 */
export const fnMsgAdd = async ({ msg, contentStr, fileKey, type }) => {
    const msgId = Number(msg.msgId)
    // console.log(`fnMsgAdd-1-msgId:${msgId}`)
    // console.log("fnMsgAdd--", { msg, contentStr, fileKey, type })
    let msgNew = { msgType: 0, ...msg, content: contentStr };
    delete msgNew.attachmentKey;
    fnLongToNumInObj(msgNew);

    // 本地id
    msgNew.customMsgId = generateUniqueId();
    msgNew.MsgID = msgNew.msgId;
    // 如果有引用
    if ( String(msgNew.content).includes("-||-msgId:")) {
        msgNew = await fnMsgContentAddQuote(msgNew);
    }
    // console.log(`fnMsgAdd-2-msgId:${msgId}`)
    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    ////////////////////////////// 补充属性
    msgNew.UserID = msgNew.sendUid;
    msgNew.isSelf = loginId === msgNew.UserID;
    msgNew.ChatType = msgNew.msgType;
    msgNew.chatType = msgNew.msgType;
    msgNew.sendTime = msgNew.sendTime || msgNew.msgTime;
    const chatType = msgNew.chatType || msgNew.ChatType || msgNew.msgType;

    // id 和 名称
    if (type === "friend") {
        msgNew.id =
            msgNew.receiveUid === loginId ? msgNew.UserID : msgNew.receiveUid;
        msgNew.friendId = msgNew.id;
        //
    } else if(type === "channel") {
        msgNew.id = msgNew.channelId;
        // msgNew.name = msgNew.groupName;
    } else {
        msgNew.id = msgNew.groupId;
        msgNew.name = msgNew.groupName;
    }

    // 移除属性
    delete msgNew.appContent;
    delete msgNew.myselfWebContent;
    delete msgNew.webContent;

    if (fileKey) {
        msgNew.fileKey = fileKey;
    }



    // at 的信息
    if (msgNew.atUids) {
        const info = msgNew.atUids.find((item) => Number(item) === loginId);
        if (info) {
            msgNew.isAtMe = true;
        }
    }

    // 发送的用户名
    if (!msgNew.isSelf) {
        if (type === "group") {
            // 获取备注名
            const remarkName = eventFriend.fnFriendRemarkNameObjRU({
                getId: msgNew.sendUid,
            });

            // 如果有备注名
            if (remarkName) {
                msgNew.sendUserName = remarkName + "：";
                msgNew.sendMember.user.name = remarkName;
            } else {
                // 如果有名称
                const nickName = _.get(msgNew, "sendMember.user.nickName");
                if (nickName) {
                    msgNew.sendUserName = nickName + "：";
                }
            }
        }
    } else {
        // 不是自己发的，默认成功状态
        msgNew.readStatus = 1;
    }

    // 定时删除时间
    const seconds = eventCheduledCeletion.fnGroupMsgConfigRUD({
        getId: msgNew.id,
    });

    // 删除要等的时间
    if (typeof seconds === "number") {
        msgNew.deleteSeconds = 1000 * seconds;
    }
    // 如果是自己发送的骰子，对应修改状态就行
    if (msgNew.isSelf && chatType === 12) {
        const is = await fnDiceSendUpdate(msgNew, {
            id: msgNew.id,
            type,
        });

        if (is) {
            return;
        }
    }


    // 如果是自己发送的扑克，对应修改状态就行
    if (msgNew.isSelf && chatType === 18) {
        const is = await fnPokerSendUpdate(msgNew, {
            id: msgNew.id,
            type,
        });
        if (is) {
            return;
        }
    }

    // 如果是公告则需要记录
    if (msgNew.msgType === 8) {
        Cache(`${loginId}-groupNotice`).then((res) => {
            const obj = res || {};
            obj[msgNew.groupId] = msgNew.content;

            Cache(`${loginId}-groupNotice`, obj);
        });
    }

    // 文件信息
    if (msgNew.msgType === 7 && msgNew.content && msgNew.content.startsWith('http')) {
        let fileInfos = msgNew.content.split('||')
        msgNew.fileName = fileInfos[1] || 'unknown.file'
        msgNew.fileSize = fileInfos[2] || 0
        msgNew.size = fileInfos[2] || 0
    }
    if ([14, 15].includes(msgNew.msgType)) {
        // 收款消息提示不支持
        msgNew.content = '[暂不支持该消息类型]'
    }
    // console.log(`fnMsgAdd-3-msgId:${msgId}`)
    // 收到的新消息，进行传递
    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        data: {
            ...msgNew,
            time: msgNew.sendTime,
            type,
            user: type === "group" ? msgNew.sendMember.user : msgNew.sendUser,
        },
    });

    // 存储到indexdb
    eventBase.fnMsgAddToDB(msgNew, msgNew.friendId);
    eventBase.fnHint(msgNew.id + type);
};

/**
 * 群消息 添加
 */
const fnGroupMsgAdd = async (msg) => {
    // console.log(msg, 'fnGroupMsgAdd --------> 185')
    const type = "group";
    const groupId = Number(msg.groupId);
    const msgId = Number(msg.msgId);

    if (await fnCheckMsgRepeat(groupId, type, msgId)) return;
    const { contentStr, fileKey } = await fnMsgDecryption({
        id: groupId,
        type,
        msgType: msg.msgType || 0,
        msgEncryptionVersion: msg.version ,
        content: msg.content,
        attachmentKey: msg.attachmentKey,
    });

    // 如果解密失败，则终止执行
    if (!contentStr) {
        return;
    }

    fnMsgAdd({
        msg,
        contentStr,
        fileKey,
        type,
    });
};

/**
 * 好友消息 添加
 */
const fnFriendMsgAdd = async (msg) => {
    const type = "friend";
    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 好友id
    const friendId = Number(
        loginId == Number(msg.sendUid) ? msg.receiveUid : msg.sendUid
    );

    const msgId = Number(msg.msgId);
    if (await fnCheckMsgRepeat(friendId, type, msgId)) return;
    // 是否是自己发送的
    const isSelf = Number(msg.sendUid) === loginId;

    let content = null;
    let version = null;
    let attachmentKey = null;
   if (isSelf && msg.myselfWebContent && msg.myselfWebContent.version) {
        // 自己发送
        content = msg.myselfWebContent.content;
        version = msg.myselfWebContent.version;
        attachmentKey = msg.myselfWebContent.attachmentKey;
    } else if (msg.msgType == enumMsgType.dice || (!msg.version && !msg.text)) {
        content = msg.appContent?.content || msg.content;
    } else {
        // 好友发送
        version = msg.version;
        content = msg.webContent.content;
        attachmentKey = msg.webContent.attachmentKey;
    }
    if (msg.snapchatTime) {
        msg.deleteSeconds = msg.snapchatTime * 1000;
    }


    const { contentStr, fileKey } = await fnMsgDecryption({
        id: friendId,
        type,
        msgType: msg.msgType || 0,
        msgEncryptionVersion: version,
        content,
        attachmentKey,
        source: msg.source || 0,
        isSelf,
    });

    // 如果解密失败，则终止执行
    if (!contentStr) {
        return;
    }

    fnMsgAdd({
        msg,
        contentStr,
        fileKey,
        type,
    });
};


const fnChannelMsgAdd = async (msg, isOld) => {
    const channelId = Number(msg.channelId)
    const type = "channel"
    const msgId = Number(msg.msgId)
     if(msgId === 1) {
        //  console.log('fnChannelMsgAdd-c-', msg)
         // 频道消息删除
       await fnMsgDelete({
            info: {
                id: Number(channelId),
                type: "channel",
                msgId,
                idsDelete: [],
                isOtherPlatformOperate: true,
            },
        });
    }

    if(!isOld) {
        const state = eventChannel.isValidSocketMsg(Number(msg.msgTime))
        if(!state) {
            //  console.log('阻止了条重复推送-msg-', msg)
            return;
        };
    }

    if (await fnCheckMsgRepeat(channelId, type, msgId)) return;
    const { contentStr, fileKey } = await fnMsgDecryption({
        id: channelId,
        type,
        msgType: msg.msgType || 0,
        msgEncryptionVersion: msg.version,
        content:msg.content,
        attachmentKey: msg.attachmentKey,
    });
    //  console.log(channelId+'收到一条频道消息-msg-',contentStr, msg)
    if (!contentStr) {
        return;
    }
    // 确保channelId和msgId是数字类型，避免因类型不一致导致会话列表匹配失败
    const msgNum= {...msg, channelId: Number(msg.channelId), msgId: Number(msg.msgId)}
     fnMsgAdd({
        msg: msgNum,
        contentStr,
        fileKey,
        type,
    });
}

/**
 * 骰子发送 修改
 */
const fnDiceSendUpdate = async (values, { id, type }) => {
    const msgInfo = await window.$db.getMsgInfoForMsgId({
        id,
        type,
        msgId: values.MsgID,
    });

    // 如果存在就进行修改流程
    if (msgInfo && msgInfo.msgType === enumMsgType.dice && !msgInfo.content) {
        const params = {
            id,
            type,
            list: [
                {
                    customMsgId: msgInfo.customMsgId,
                    updated: { content: values.content },
                },
            ],
        };

        // 修改消息属性
        window.$db.updateMsgProperty(params);

        // 通讯
        eventBase.fnCommunicationSendMsg({
            operator: "msgListPropertyUpdate",
            data: params,
        });

        return true;
    }

    return false;
};

/**
 * 扑克发送 修改
 */
const fnPokerSendUpdate = async (values, { id, type }) => {
    const msgInfo = await window.$db.getMsgInfoForMsgId({
        id,
        type,
        msgId: values.MsgID,
    });
    // 如果存在就进行修改流程
    if (msgInfo && msgInfo.msgType === enumMsgType.animatedGame && !msgInfo.content) {
        const params = {
            id,
            type,
            list: [
                {
                    customMsgId: msgInfo.customMsgId,
                    updated: { content: values.content },
                },
            ],
        };

        // 修改消息属性
        window.$db.updateMsgProperty(params);

        // 通讯
        eventBase.fnCommunicationSendMsg({
            operator: "msgListPropertyUpdate",
            data: params,
        });

        return true;
    }

    return false;
};

/**
 * 群聊消息已读 记录 (体量较大记录后定时处理)
 */
let groupMsgReads = {};
const fnGroupMsgReadRecord = (receiptMessage) => {
     const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    receiptMessage.forEach(item => {
        const readState = item.receiptStatus?.status || 0;
        if(readState <= 0) return; // 只处理已读
        const groupId = Number(item.groupId);
        const sendUid = Number(item.sendUid);

        // console.log("fnGroupMsgReadRecord-2-", sendUid, loginId)
        if(sendUid === loginId) return;
        // console.log("fnGroupMsgReadRecord-3-")
        if(!groupId || !sendUid || !item.msgId) return;
        let groupObj =  groupMsgReads[groupId] || {};
        let groupMsgReadsOld = groupObj[item.msgId] || [];

        // 已读用户信息，需要新字段属性可在这里添加
        const readInfoNew = {
            userId: sendUid,
            readTime: Number(item.receiptStatus?.time),
            readState,
        };

        groupMsgReadsOld =  groupMsgReadsOld.filter(item => item.userId !== readInfoNew.userId)
        groupObj[item.msgId] = [...groupMsgReadsOld, readInfoNew];
        // console.log("fnGroupMsgReadRecord-4-", groupObj)
        groupMsgReads[groupId] = groupObj;
    })
}

/**
 * 群聊消息已读 更新
 */
const fnGroupMsgReadUpdate = async () => {
    let groups = JSON.parse(JSON.stringify(groupMsgReads));
    groupMsgReads = {};
    for (const groupId in groups) {
        const groupMsgObjs = groups[groupId] || [];
        let params = {
            id: Number(groupId),
            type: "group",
            list: [],
        };

        for(const msgId in groupMsgObjs) {
            let readUsersNew = groupMsgObjs[msgId];
            if(!readUsersNew.length) return;

            const msgInfo = await window.$db.getMsgInfoForMsgId({
                id: groupId,
                type: "group",
                msgId,
            });
            if(!msgInfo?.customMsgId) return;
            let readUsersOld = msgInfo?.readUsers || [];
            readUsersOld = readUsersOld.filter(item => readUsersNew.some(i => i.userId !== item.userId));
            const readUsers = [...readUsersOld, ...readUsersNew];
            let updated = { readUsers };
            // 更新消息显示的阅读状态
            if(msgInfo?.readStatus < 2 && readUsers.some(i => i.readState > 0)) {
                updated.readStatus = 2;
            }
            const param = {
                        customMsgId: msgInfo.customMsgId,
                        updated,
                    }

            params.list.push(param)
        }


        // 修改消息属性
        // console.log("updateMsgProperty--", params)
        window.$db.updateMsgProperty(params);

        // 通讯
        eventBase.fnCommunicationSendMsg({
            operator: "msgListPropertyUpdate",
            data: params,
        });
    }
}

/**
 * 频道消息已读 更新
 */
const fnChannelMsgReadUpdate = async (channelId, channelMsgReads) => {
    if(!channelId || !channelMsgReads?.length) return;
    let params = {
        id: Number(channelId),
        type: "channel",
        list: [],
    };

    for(let i=0; i< channelMsgReads.length; i++) {
        const item = channelMsgReads[i];
        const msgInfo = await window.$db.getMsgInfoForMsgId({
            id: channelId,
            type: "channel",
            msgId: Number(item.msgId),
        });
        if(!msgInfo?.customMsgId) return;
        let readTotal = item?.total || 0;
        let updated = { readTotal };
        const param = {
                    customMsgId: msgInfo.customMsgId,
                    updated,
                }
        params.list.push(param)
    }
    // 修改消息属性
    // console.log("updateMsgProperty--", params)
    window.$db.updateMsgProperty(params);

    // 通讯
    eventBase.fnCommunicationSendMsg({
        operator: "msgListPropertyUpdate",
        data: params,
    });
}

/**
 * 处理事件 消息删除，没有删除的id则为 清空
 * 如果操作类型是通知则为msgId，自己操作则为本地id
 */
const fnMsgDelete = async ({ info }) => {
    // id：要删除的会话框，就是好友id或者群id
    // type: 删除的类型，好友是friend,群是group
    // idsDelete: 删除的msgId集合，如果是空数组，表示全部删除，数组里有值，表示删除一条或者多条
    // isRemoteDeletion: 为true pc端本地操作删除所有端，同时也删除手机端等其它端
    // isDeleteChatWindow: 为true 表示删除窗口
    // isOtherPlatformOperate: 为true, 表示手机端等其它端操作删除所有端，pc端同步删除
    const { id, type, idsDelete, isRemoteDeletion, isOtherPlatformOperate } =
        info;
    // console.log(info,  '319 -----fnMsgDelete------> 319')
    let values = null;
    if (idsDelete && idsDelete.length) {
        values = await window.$db.deleteMsgForIdObjList({
            id,
            type,
            idObjList: idsDelete,
            isRemoteDeletion,
            isOtherPlatformOperate,
        });
    } else {
        values = await window.$db.clearMsgList({
            id,
            type,
            isRemoteDeletion,
        });
    }

    if (!values) {
        return;
    }

    const { msgLast, unreadMsgFirst, unreadMsgCount, idListClearReferenced } = values;

    let communicationInfo = {
        operator: "msgDelete",
        data: {
            ...info,
            lastInfo: msgLast,
            unreadMsgCount,
            unreadMsgFirst,
            idListClearReferenced, // 引用被删除，需要清空的引用
        },
    };

    // 通讯
    eventBase.fnCommunicationSendMsg(communicationInfo, true);

    if(type === 'channel' && !isRemoteDeletion && !isOtherPlatformOperate) {
        channelRecordDeleteHistory(info)
    }
};

// 记录频道本地删除/清空消息
const channelRecordDeleteHistory = async (info) => {
    const isClear = !info.idsDelete?.length;
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
    let res = await Cache(`${loginId}-channel-msg-delete-history`) || {};
    const channelId = Number(info.id)
    const oldData = res[channelId];
    const currentTime = Date.now();
    let data = {
            channelId,
            idsDelete: oldData?.idsDelete || [],
            clearTime: oldData?.clearTime || 0,
    }
    if(isClear) {
        data.idsDelete = [];
        data.clearTime = currentTime;
    } else {
        const ids = info.idsDelete.map(item => {
            return {
                msgId: item.msgId,
                clearTime: currentTime,
            }
        })
        data.idsDelete = [...data.idsDelete, ...ids].slice(-100);
    }
    res[channelId] = data;
    console.log('channelRecordDeleteHistory--', res)
    Cache(`${loginId}-channel-msg-delete-history`, res)
}


/**
 * 消息好友已读
 */
const fnMsgFriendRead = (msg) => {
    const MsgID = _.get(msg, "receipts[0].msgId");
    const status = _.get(msg, "receipts[0].receiptStatus.status");

    if (MsgID && status === 1) {
        const id = Number(msg.receipts[0].sendUid);
        const type = "friend";

        window.$db
            .sendMsgReadSet({
                id,
                type,
                msgId: Number(MsgID),
                readTime: Number(msg.receipts[0].receiptStatus.time),
            })
            .then((list) => {
                // 同步已读
                eventBase.fnCommunicationSendMsg({
                    operator: "msgListPropertyUpdate",
                    data: {
                        id,
                        type,
                        list: list.map((item) => {
                            return {
                                customMsgId: item.customMsgId,
                                updated: { readStatus: 2 },
                            };
                        }),
                    },
                });
            });
    }
};

/**
 * 新消息添加
 */
const fnMsgNewAdd = (info) => {
    const { id, type, customMsgId, isSelf, deleteSeconds } = info;

    // 如果是自己发的群消息，并且有设置阅后即焚，则直接开始记时
    if (type === "group" && isSelf && deleteSeconds) {
        const now = new Date().getTime();

        eventCheduledCeletion.fnCheduledDeletionMsgAdd({
            id,
            type,
            customMsgId,
            time: now + deleteSeconds,
        });
    }

    if (isSelf) {
        // 如果是自己发送的消息不需要更新未读
        eventBase.fnCommunicationSendMsg(
            {
                operator: "msgNew",
                data: info,
            },
            true
        );
        return;
    }

    // 未读消息设置
    fnUnreadMsgSet(info);
};

/**
 * 未读消息设置
 */
const fnUnreadMsgSet = async (info) => {
    const { id, type, customMsgId, sendTime, isSelf } = info;

    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
    const infoActive = eventCommon.fnCommonInfoRU({ getId: "infoActive" });

    // 如果当前是选中窗口，并且在底部直接已读，不添加未读
    if (infoActive && id + type === infoActive.id + infoActive.type) {
        const dom = document.getElementById("allMsgContainer");

        if (dom) {
            const atBottom =
                dom.scrollHeight - dom.clientHeight - 50 <= dom.scrollTop;

            // 如果在底部，直接已读
            if (atBottom) {
                eventBase.fnCommunicationSendMsg(
                    {
                        operator: "msgNew",
                        data: info,
                    },
                    true
                );

                if (!isSelf) {
                    // 直接已读
                    setTimeout(() => {
                        eventBase.fnCommunicationSendMsg({
                            operator: "msgReadByMe",
                            data: {
                                id,
                                type,
                                values: {
                                    sendTime: info.sendTime,
                                },
                                lastMessage: info,
                            },
                        });
                    }, 100);
                }

                return;
            }
        }
    }

    // 设置未读
    const res = await Cache(`${loginId}-unread`);
    const resUread = (res && res.unread) || {};

    if (resUread[id + type]) {
        resUread[id + type].count++;
    } else {
        resUread[id + type] = {
            count: 1,
            time: sendTime,
            unreadID: customMsgId,
        };
    }

    // 保存到本地
    await Cache(`${loginId}-unread`, { unread: resUread });

    eventBase.fnCommunicationSendMsg(
        {
            operator: "msgNew",
            data: { ...info, unreadObj: resUread[id + type] },
        },
        true
    );
};

const fnMsgEdit = (info) => {
     const { id, type, list } = info;

    // 记录到数据库
    for (const item of list) {
        window.$db.updateMsgForId({
            id,
            type,
            customMsgId: item.customMsgId,
            updated: { content: item.content },
        });
    }

    eventBase.fnCommunicationSendMsg(
        {
            operator: "msgListPropertyUpdate",
            data: info,
        },
        true
    );
}

/**
 * 消息的骰子结果设置
 */
const fnMsgDiceResultSet = (info) => {
    const { id, type, list } = info;

    // 记录到数据库
    for (const item of list) {
        window.$db.updateMsgForId({
            id,
            type,
            customMsgId: item.customMsgId,
            updated: item.updated,
        });
    }

    // 让骰子旋转1秒
    setTimeout(() => {
        eventBase.fnCommunicationSendMsg(
            {
                operator: "msgListPropertyUpdate",
                data: info,
            },
            true
        );
    }, 1000);
};

/**
 * 我已读消息
 */
const fnMsgReadByMe = async (info) => {
    // 指定时间已读， 没有发送时间，则为全部已读
    const { id, type } = info;

    // 获取时间区间内所有的未读信息, 以及剩余的第一个未读
    const unreadInfoNew = await window.$db.getMsgUnreadForTimeAfter(info);

    // 设置新的未读信息
    eventBase.fnCommunicationSendMsg(
        {
            operator: "msgReadByMe",
            data: {
                id,
                type,
                unreadInfo: unreadInfoNew,
            },
        },
        true
    );
};

//////////////////////// 消息发送

/**
 * 消息类型转为文本
 */
const fnMsgTypeToText = ({ chatType, msgType, haveBrackets }) => {
    let text = "";
    if (msgType === 13) {
        text = i18n.t("暂不支持该消息类型");
    } else {
        switch (chatType) {
            case 1: {
                text = i18n.t("图片");
                break;
            }
            case 9: {
                text = i18n.t("动画表情");
                break;
            }
            case 2: {
                text = i18n.t("语音");
                break;
            }
            case 3: {
                text = i18n.t("视频");
                break;
            }
            case 5: {
                text = i18n.t("名片");
                break;
            }
            case 7: {
                text = i18n.t("文件");
                break;
            }
            case 12: {
                text = i18n.t("骰子");
                break;
            }
            case 18: {
                text = i18n.t("扑克牌");
                break;
            }
            default:
        }
    }

    if (haveBrackets) {
        return text === "" ? "" : `[${text}]`;
    }
    return text;
};

/**
 * 消息内容 添加引用
 */
const fnMsgContentAddQuote = async (data) => {
    let content = _.get(data, "content") || "";
    if (typeof content === "string" && content.includes("-||-")) {
        const loginId = eventCommon.fnCommonInfoRU({
            getId: "loginId",
        });

        let id = data.groupId || data.channelId;
        if (!id) {
            id = data.UserID == loginId ? data.ToUserID : data.UserID;

            if (!id) {
                id =
                    data.receiveUid == loginId ? data.sendUid : data.receiveUid;
            }
        }
        const type = data.groupId ? "group"
                    :data.channelId ? "channel" : "friend";

        const arr = content.split("-||-");
        content = arr[0];
        const str = arr.filter((item) => item.includes("msgId:"))[0];

        if (!str) {
            return;
        }

        // 添加引用信息
        const quoteMessage = await window.$db.getMsgInfoForMsgId({
            id,
            type,
            msgId: str.replace("msgId:", ""),
        });

        if (quoteMessage) {
            // 设置引用
            data.quoteMessage = quoteMessage;

            // 被引用的id列表
            const associationIdList =
                (data.quoteMessage && data.quoteMessage.associationIdList) ||
                [];

            // 添加被引用的id
            associationIdList.push(data.customMsgId);

            // 更新被引用的id列表
            window.$db.updateMsgForId({
                id,
                type,
                customMsgId: quoteMessage.customMsgId,
                updated: {
                    associationIdList,
                },
            });
        }
    }

    return { ...data, content };
};

// 发送中消息列表 id和时间
let sendingInfoList = [];

/**
 * 消息发送，此方法是pc端操作，发送信息才会进入
 */
const fnMsgSend = async (info) => {
    let { id, type, list, quoteInfo, editInfo, createLinkOpts = [] } = info;
    console.log(info, 'fnMsgSend -------------> 663')
    const loginInfo = eventCommon.fnCommonInfoRU({
        getId: "loginInfo",
    });

    const infoActive = eventCommon.fnCommonInfoRU({
        getId: "infoActive",
    });

    // 转发信息列表
    let forwardMessageList = [];
    // console.log('infoActive -----------> 687', infoActive)
    if (infoActive && infoActive.forwardMessageList) {
        forwardMessageList = infoActive.forwardMessageList;

       let gameList = [];
       // 骰子和扑克走新发消息流程
       forwardMessageList = forwardMessageList.filter(item => {
            if (item.msgType === 18) {
                list.push({
                    type: "poker",
                    values: { chatType: 18, msgType: 18 }
                });
                return false; // 过滤掉该元素
            } else if(item.msgType === 12) {
                list.push({
                    type: "dice",
                    values: { chatType: 12, msgType: 12 }
                });
                return false; // 过滤掉该元素
            }
            return true; // 保留该元素
        });
        list = [...list, ...gameList];

        for (let i = 0; i < forwardMessageList.length; i++) {
            let item = forwardMessageList[i]
            // 转发不需要引用消息
            if(item.quoteMessage) {
               delete item.quoteMessage
            }
            if (!item.content && item.text) {
                item.content = item.text
            }
            if (!item.url && item.text) {
                item.url = item.text
            }
            if(item.chatType===1 && item.content.includes('||')) {
                const url = item.content.split('||')[0]
                item.text = url
                item.content = url
            }
            if (type == 'group') {
                //  获取群群文件加密key
                if (item.fileKey) {
                    const {groupAttachmentKey} = await getKeys({fileKey: item.fileKey, groupId: id})
                    item.groupAttachmentKey = groupAttachmentKey;
                }
            } else {
                //  获取好友文件加密key
                if (item.fileKey) {
                    const {ownAppAttachmentKey, appAttachmentKey, webAttachmentKey} = await getKeys({fileKey: item.fileKey, ToUserID: id})
                    item.ownAppAttachmentKey = ownAppAttachmentKey
                    item.appAttachmentKey = appAttachmentKey
                    item.webAttachmentKey = webAttachmentKey
                }
            }
        }
    }
    // console.log('forwardMessageList --------> 713', forwardMessageList)
    // 如果没有转发，也没有消息则 消息列表置底
    if (forwardMessageList.length === 0 && list.length === 0) {
        eventBase.fnCommunicationSendMsg({
            operator: "chatMsgListToBottom",
            data: {
                id,
                type,
            },
        });
        return;
    }

    // 发送时间
    // let sendTime = new Date().getTime();
    let sendTime = getNow();

    // 获取定时删除时间
    let deleteSeconds =
        type === "group"
            ? eventCheduledCeletion.fnGroupMsgConfigRUD({ getId: id })
            : eventCheduledCeletion.fnFriendMsgConfigRUD({ getId: id });
    if (deleteSeconds) {
        deleteSeconds *= 1000;
    }

    // 发送的消息列表
    const sendMsgList = [];

    for (const item of [
        ...forwardMessageList.map((item) => {
            return {
                values: item,
            };
        }),
        ...list,
    ]) {
        const customMsgId = editInfo ? editInfo.customMsgId : generateUniqueId();
        let { values, file } = item;

        // 引用
        if (quoteInfo) {
            values.quoteMessage = quoteInfo;
        }

        // 名片转发处理，
        if (item.values.msgType == 5 && Object.prototype.toString.call(item.values.content) == '[object Object]') {
            let obj = {
                name: item.values.content.name,
                pic: item.values.content.pic || '',
                id: item.values.content.id
            }
            let contents = Object.values(obj)
            item.values.content = contents.join('*|*|*')
        }
        const content = _.get(item, "values.content");
        if (content) {
            item.values.content = textToEmojiText(content);
        }


        // 处理文本链接
        let links = item.values?.links || [];
        createLinkOpts.forEach(createLinkOpt => {
            const { linkText, linkValue } = createLinkOpt || {};
            if(linkValue && linkText) {
                const linkPlainText = fnEmojiToText(linkText);
                const location = content.indexOf(linkPlainText);
                if(location > -1) {
                    links.push({
                        link: linkValue,
                        location,
                        length: linkPlainText.length
                    })
                }
            }
        })
        // 到数据库 的数据
        let dataDb = {
            ...values,
            MsgID: customMsgId,
            sendTime: sendTime.toString(),
            readStatus: -1,
            ToUserID: type === "friend" ? id : null,
            UserID: loginInfo.id,
            groupId: type === "group" ? id : null,
            sendUid: loginInfo.id,
            customMsgId,
            deleteSeconds,
            atUsers: values.atUsers,
            mute: info.mute,
            channelId: type === "channel" ? id : null,
            links,
        };
        // 文件信息
        let fileLocalInfos = {};

        // 文件缩略图
        let fileThumb = null;

        // 文件信息, 文件处理并返回文件信息，异步上传
        if (item.type === "file") {
            const fileInfos = await eventFile.fnFileInfosGet({
                file,
                id,
                type,
            });

            if (fileInfos) {
                dataDb = { ...dataDb, ...fileInfos.info };
                fileThumb = fileInfos.fileThumb;
                fileLocalInfos = fileInfos.info;
            } else {
                // 文件操作发生错误，跳过当前
                break;
            }
        }

        // 发送参数
        let params = {
            ...values,
            sendTime,
            sendUser: {
                nickName: loginInfo.name,
                pic: loginInfo.icon,
                uid: loginInfo.id,
            },
            links,
            ...fileLocalInfos,
        };
        if (quoteInfo) {
            params.text = fnQuoteTextGet(quoteInfo, values.content)
        }
        if (!params.text) {
            params.text = values.content
        }

        if(type === "channel") {
            params = {
                ...params,
                atUids: values.atUids,
                atUsers: values.atUsers || [],
                channelId: id,
            };
        } else if (type === "group") {
            params = {
                ...params,
                atUids: values.atUids,
                atUsers: values.atUsers || [],
                groupId: id,
                groupNickName: "",
                groupName: values.groupName,
            };
        } else {
            params.receiveUid = id;
        }

        let curInfo = {
            params,
            isFile: item.type === "file",
            file,
            fileThumb,
            customMsgId,
            edit: editInfo ? 1 : 0
        }

        let fileInfos = {};
        let saveFileInfo = {}

        //  通知到组件
        if(editInfo) {
            fnMsgEdit({
                id,
                type,
                list: [
                    { ...editInfo, content: values.content}
                ]
            });
        } else {
            eventBase.fnCommunicationSendMsg({
                operator: "msgNew",
                data: {
                    ...values,
                    id,
                    type,
                    time: sendTime,
                    sendTime,
                    isSelf: true,
                    readStatus: -1,
                    customMsgId,
                    deleteSeconds,
                    ...fileLocalInfos,
                    mute: info.mute,
                    ...saveFileInfo,
                    links,
                },
            });
        }


        // 置底
        eventBase.fnCommunicationSendMsg({
            operator: "chatMsgListToBottom",
            data: {
                id,
                type,
            },
        });

        if (curInfo.isFile) {
            fileInfos = await eventFile.fnFileUploadInfoGet({
                id,
                type,
                ...curInfo,
            });
            curInfo = {...curInfo, fileInfos}
            saveFileInfo = {
                fileKey: fileInfos.fileKey,
                fileName: fileInfos.fileName,
                fileSize: fileInfos.fileSize,
                fileType: fileInfos.fileType,
                width: fileInfos.width,
                height: fileInfos.height,
                text: fileInfos.text,
                url: fileInfos.url,
                size: fileInfos.size,
                thumbUrl: fileInfos.thumbUrl
            }
            // 更新ui
            const params = {
                id,
                type,
                list: [
                    {
                        customMsgId: customMsgId,
                        updated: saveFileInfo,
                    },
                ],
            };

            // 上传完成更新ui消息
            eventBase.fnCommunicationSendMsg({
                operator: "msgListPropertyUpdate",
                data: params,
            });

            // 文件上传发送异常
            if (!fileInfos) {
                break;
            }
        }


        // 添加发送信息到列表
        sendMsgList.push(curInfo);

        // 到数据库
        if(!editInfo) {
            eventBase.fnMsgAddToDB({...dataDb, ...saveFileInfo}, type === "friend" ? id : null);
        }

        // 发送一个之后下一个 + 1毫秒
        sendTime++;
    }

    // 引用
    if (quoteInfo) {
        // 引用记录到被引用的id列表，用于对应删除
        // 更新被引用的id列表
        window.$db.updateMsgForId({
            id,
            type,
            customMsgId: quoteInfo.customMsgId,
            updated: {
                associationIdList: [
                    ...(quoteInfo.associationIdList || []),
                    ...sendMsgList.map((item) => item.customMsgId),
                ],
            },
        });

        // 发送消息之后 清除转发和回复
        eventBase.fnCommunicationSendMsg({
            operator: "keydown",
            data: {
                id,
                type,
                key: "Escape",
            },
        });
    } else if (forwardMessageList.length > 0) {
        // 移除转发信息对话框
        eventCommon.fnCloseListRU({
            removeIds: ["forwardInfoDialog"],
        });
    }

    ///////////////////////// 真正发送消息
    // 没有需要上传，则直接发送
    for (const item of sendMsgList) {
        // 记录到列表
        sendingInfoList.push({
            id,
            type,
            customMsgId: item.customMsgId,
            sendTime: Number(item.sendTime),
        });

        // 清除多余的字段
        delete item.params.local;
        delete item.params.localThumbUrl;

        // benchmark: 初始化消息发送日志
        benchmark.initSendLog(item.customMsgId);

        // 发送
        sendMessage(
            { ...item.params, msgType: item.params.chatType, ...item.fileInfos },
            item.customMsgId
        );
    }

    // 关闭全部会话框
    eventCommon.fnCloseListRU({ isCloseAll: true });
};

/**
 * 消息发送成功
 */
const fnMsgSendSuccess = (msg, type) => {
    const { flag, msgId, groupId, channelId, receiveUid, sentOverTime } = msg;
    const id = type === "group" ? Number(groupId)
               : type === "channel" ? Number(channelId)
               : Number(receiveUid);
    const customMsgId = Number(flag).toString();
    let updated = {
        MsgID: Number(msgId),
        readStatus: 1,
    }
    if(sentOverTime) {
        updated.time = String(sentOverTime);
        updated.sendTime = String(sentOverTime);
    }
    // benchmark: 标记收到服务器确认
    benchmark.markRecieved(customMsgId);

    // 数据库内查找该消息，并修改状态 及 msgId
    window.$db
        .updateMsgProperty({
            id,
            type,
            list: [
                {
                    customMsgId,
                    updated,
                },
            ],
        })
        .then((res) => {
            if (res) {
                // 发送中的信息移除
                sendingInfoList = sendingInfoList.filter(
                    (item) => item.customMsgId !== customMsgId
                );

                // 通讯
                eventBase.fnCommunicationSendMsg({
                    operator: "msgListPropertyUpdate",
                    data: {
                        id,
                        type,
                        list: [
                            {
                                customMsgId,
                                updated,
                            },
                        ],
                        readStatus: 1,
                    },
                });
            }
        });
};

/**
 * 消息发送 超时
 */
const fnMsgSendTimeout = () => {
    // 当前时间戳
    const now = Date.now();

    // 超时信息列表
    const infoTimeoutList = _.cloneDeep(sendingInfoList.filter(
        (item) => now - item.sendTime > 15000
    ));
    // console.log('infoTimeoutList --------> 1045', infoTimeoutList)
    //  超时id列表
    const idTimeoutList = infoTimeoutList.map((item) => item.customMsgId);

    // 修改状态
    for (const item of infoTimeoutList) {
        // console.log('fnMsgSendFail')
        fnMsgSendFail(item);
    }

     // 发送中的信息对应移除
    sendingInfoList = sendingInfoList.filter(
        (item) => !idTimeoutList.includes(item.customMsgId)
    );
};

/**
 * 消息发送失败
 */
const fnMsgSendFail = async ({ id, type, customMsgId }) => {
    // benchmark: 标记发送失败
    benchmark.markFailed(customMsgId, 'fnMsgSendFail');
    // 数据库内查找该消息，并修改状态 及 msgId
    window.$db
        .updateMsgProperty({
            id,
            type,
            list: [
                {
                    customMsgId,
                    updated: { readStatus: 0 },
                },
            ],
        })
        .then((res) => {
            if (res) {
                // 通讯
                eventBase.fnCommunicationSendMsg({
                    operator: "msgListPropertyUpdate",
                    data: {
                        id,
                        type,
                        list: [
                            {
                                customMsgId,
                                updated: { readStatus: 0 },
                            },
                        ],
                        readStatus: 0,
                    },
                });
            }
        });
};

/**
 * 发送中的信息 添加
 */
const fnSendingInfoListAdd = (info) => {
    sendingInfoList = sendingInfoList.filter(
        (item) => item.customMsgId !== info.customMsgId
    );

    sendingInfoList.push(info);
};

export const notificationReply = (data) => {
    const { id, type, mute, value } = data;
    if(!value) return;
    let msgText = value;
    // 获取敏感词
    msgText = filterSensitiveWords(msgText);
    // 发送失败 发送的内容都是敏感词
    if (msgText === "") {
        window.$toast(this.$t("发送的内容全是敏感词"));
        return;
    }
    // 可能是xss攻击语句，限制发送
    if (!strIsSafe(msgText)) {
        console.log("当前消息被限制发送", msgText);
        return;
    }
    // 消息处理，或拆分成多个
    let textListSend = fnTextSendInfoGet(msgText);

    // 发送
     eventBase.fnCommunicationSendMsg({
        operator: "msgSend",
        data: {
          id,
          type,
          list: textListSend,
          mute,
        },
    });
}

/**
 * 文件信息列表 格式化
 */
const fnFileMsgListFormat = (list) => {
    return list.map((item) => {
        let url = "";
        let thumbUrl = null;

        if (item.chatType === 3) {
            const arr = item.content.split("*P");
            url = arr[0];
            thumbUrl = arr[1];
        } else if (item.chatType === 5) {
            const arr = item.content.pic.split("||");
            url = arr[0];
            return {
                ...item,
                url,
                text:
                    item.content.name +
                    "*|*|*" +
                    url +
                    "*|*|*" +
                    item.content.id,
                thumbUrl,
            };
        } else {
            const arr = item.content?.split("||");
            url = arr[0];
        }
        return {
            ...item,
            url,
            text: url,
            thumbUrl,
        };
    });
};

/**
 * 获取引用文本
 */
const fnQuoteTextGet = (quoteInfo, content) => {
    console.log('quoteInfo--', quoteInfo)
    const loginInfo = eventCommon.fnCommonInfoRU({
        getId: "loginInfo",
    });

    const name = quoteInfo.isSelf ? loginInfo.name : quoteInfo.user?.nickName;
    const uid = quoteInfo.isSelf ? loginInfo.id : Number(quoteInfo.user?.uid);
    const text = `${content}-||-type:${quoteInfo.chatType}-||-content:${ getQuoteContent(quoteInfo) }-||-uid:${uid}-||-msgId:${quoteInfo.MsgID}-||-name:${name}`;
    return text;
};

const getQuoteContent = (quoteInfo) => {
    if(quoteInfo.chatType === 0) {
       return textToEmojiText(quoteInfo.content)
    } else if(quoteInfo.chatType === 18) {
        return i18n.t("扑克牌");
    } else {
        return ""
    }
}

/**
 * 弹出提示
 */
// const fnAlertNotification = async (data, chatList) => {
//     const { deviceConfig } = eventCommon.fnConfigRU();
//     // 最小化时消息提醒, 只有不是自己的信息，并且没有开启免打扰
//     // console.log(
//     //     {isMessageReminderWhenMinimized: deviceConfig.isMessageReminderWhenMinimized,
//     //     isSelf: !data.isSelf,
//     //     idStrIsExist: !eventCommon.fnDisturbIdStrListRU({ idStrIsExist: data.id + data.type })
//     // }, '为什么开启了免打扰还会进来 --------> 1096')
//     if (
//         deviceConfig.isMessageReminderWhenMinimized &&
//         !data.isSelf &&
//         !eventCommon.fnDisturbIdStrListRU({ idStrIsExist: data.id + data.type })
//     ) {
//         const info = chatList.find(
//             (item) => item.id === data.id && item.type === data.type
//         );

//         if (info) {
//             const text = fnMsgTypeToText(data);
//             const content = data.chatType === 16 ? handleRichTextToText(data.content) : data.content
//             const icon = await handleNotificationIcon(info.pic, data.id);
//             const params = {
//                 id: data.id,
//                 type: data.type,
//                 icon,
//                 content: text ? "[" + text + "]" : content,
//                 name:
//                     info.name ||
//                     info.nickName ||
//                     info.sendUser.name ||
//                     info.sendUser.nickName,
//             };

//             ipcRenderer.send("alertNotification", {
//                 windowId: remote.getCurrentWindow().getMediaSourceId(),
//                 ...params,
//             });
//         }
//     }
// };



/**
 * 弹出提示
 */
const fnAlertNotification = async (data, chatList) => {
    const { deviceConfig } = eventCommon.fnConfigRU();
    const { id, type } = data;
    const { msgType, avatar, content, nickName, remarkName, sendUid } = data;
    const loginId = eventCommon.fnCommonInfoRU({getId: "loginId"});
    const showReplyIcon = await shouldShowReplyIcon(type, id, loginId);
    const isSelf = Number(sendUid) === loginId || !sendUid;
    // console.log("fnAlertNotification--", deviceConfig.isMessageReminderWhenMinimized, !isSelf, !eventCommon.fnDisturbIdStrListRU({ idStrIsExist: id + type }), ![51].includes(msgType))
    if (
        deviceConfig.isMessageReminderWhenMinimized &&
        !isSelf &&
        !eventCommon.fnDisturbIdStrListRU({ idStrIsExist: id + type }) &&
        ![51, 6, 10, 13, 14, 99].includes(msgType)
    ) {
        const info = chatList.find(item => item.id === id && item.type === type);
        if (info) {
            const params = {
                id,
                type,
                msgType,
                showReplyIcon,
                icon: type === "group" ? info.avatar : (avatar || info.avatar || info.pic),
                content: msgType === 8 ? `[${i18n.t("群简介")}]${content}` : content,
                userName: remarkName || nickName || "",
                name: info.name || info.nickName || info.channelName,
                loginId,
            };
            // console.log("alertNotification--", params)
            ipcRenderer.send("alertNotification", {
                // windowId: remote.getCurrentWindow().getMediaSourceId(),
                ...params,
            });
        }
    }
};

const shouldShowReplyIcon = async(type, id, loginId) => {
    if (type !== 'channel') return true;
    // 查询cache messageChannelList对应项，判断adminPrivacy是否有回复权限
    const messageChannelList = await Cache(`${loginId}MessageChannelList`);
    const channel = messageChannelList.find(item => item.channelId === Number(id));
    if (!channel) return false;
    return (channel.adminPrivacy & 2) !== 0;
}

// 处理Icon,由于electron的Notification只接受本地图片地址
const handleNotificationIcon = async (icon, id) => {
    let result = icon;
    const loginInfo = await eventCommon.fnCommonInfoRU({ getId: "loginInfo" });

    async function getSavePath() {
        let flieName = new URL(icon).pathname.replace(/\//g, "_");
        let fileFormat = flieName.split(".").pop().toLowerCase();
        if (!["jpg", "jpeg", "png"].includes(fileFormat)) flieName += ".jpg";
        let saveDir = await getUserDataDirectory({ UserID: loginInfo.id });
        saveDir = path.join(saveDir, "notification");
        const savePath = path.join(saveDir, flieName);
        return { savePath, saveDir };
    }

    async function getDefaultIcon() {
        const workingDir = await getWorkingDir();
        return path.join(workingDir, "images", "default_chat_icon.png");
    }

    try {
        if (isNetworkImageUrl(icon)) {
            const { savePath, saveDir } = await getSavePath();
            // 判断文件是否存在
            if (fs.existsSync(savePath)) {
                result = savePath;
            } else {
                await checkDirectory(saveDir);
                result = await downloadImageToLocal(icon, savePath);
            }
        }
    } catch (error) {
        result = await getDefaultIcon();
    }
    return result;
};

const handleRichTextToText = (htmlString) => {
    // 替换所有图片和视频标签为 [图片] 或 [视频]
    let replaced = htmlString
      .replace(/<img[^>]*>/g, '[图片]')  // 替换图片标签
      .replace(/<video[^>]*>.*?<\/video>/g, '[视频]');  // 替换视频标签（包括内容）
    // 移除所有其他 HTML 标签
    const textOnly = replaced.replace(/<[^>]*>/g, '');
    return textOnly;
};

export default {
    fnGroupMsgAdd,
    fnFriendMsgAdd,
    fnMsgSendSuccess,
    fnMsgDelete,
    fnMsgFriendRead,
    fnMsgTypeToText,
    fnMsgReadByMe,
    fnMsgSend,
    fnMsgSendTimeout,
    fnMsgSendFail,
    fnSendingInfoListAdd,
    fnUnreadMsgSet,
    fnFileMsgListFormat,
    fnMsgDiceResultSet,
    fnMsgNewAdd,
    fnAlertNotification,
    fnGroupMsgReadRecord,
    fnGroupMsgReadUpdate,
    fnChannelMsgAdd,
    fnChannelMsgReadUpdate,
};
