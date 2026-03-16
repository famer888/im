import { Cache } from "@/cache";
import eventCommon from "./common";
import eventBase from "./base";
import { getChannelList, getChannelDetail, getHistoryMsgs } from "@/api/imChannel";
import i18n from "@/assets/lang/i18n";
import { generateUniqueId } from "@/utils/base";
import packet from "@/api/base/imweb-web";


const handleChannelEvents = async (data) => {
    const { channelInfo, channelId, eventType, subscriberInfo, channelNoticeMsg, msgTime } = data || {};
    const { operateType } = channelInfo || {};
    const { operateType: subscriberOperateType } = subscriberInfo || {};
    const state = isValidSocketMsg(Number(msgTime))
    if(!state) {
        // console.log('阻止了条重复推送', data)
        return;
    };
    // 频道通知消息
    fnAddChannelNoticeToChat(data);
    // 频道订阅变更事件
    if (eventType === 2) {
        switch(subscriberOperateType) {
          case 0:
            // 频道订阅者加入事件
            fnHandleChannelSubscriberJoin(data);
            break;
        case 1:
            // 订阅者权限变更
            // 暂时没有其他用处，用来显示'您已成为创建者'
            if (data.subscriberInfo?.role === 0) {
              const message = fnChannelAddMessageNotification({
                channelId: Number(data.channelId),
                content: data.msg || '您已成为创建者',
                chatType: 50,
              });
              eventBase.fnMsgAddToDB({...message, customMsgId: Number(data.msgId) });
            }
            break;
          case 2:
            // 退出/被移除频道
            eventRemoveLocalChannel(Number(channelId));
            break;
        }
    }
    if(operateType) {
        switch(operateType) {
            // 修改频道名
            case 1:
                const { channelName } = channelInfo;
                eventUpdateChannelInfo(1, {channelId, channelName});
                break;
            // 修改频道头像
            case 2:
                const { icon } = channelInfo;
                eventUpdateChannelInfo(2, {channelId, icon});
                break;
            // 频道解散
            case 4:
                eventRemoveLocalChannel(Number(channelId));
                break;
            // 频道启用
            case 5:
                eventToggleChannelDisabled({
                    channelId: Number(channelId),
                    isDisable: false,
                });
                break;
            // 频道禁用
            case 6:
                eventToggleChannelDisabled({
                    channelId: Number(channelId),
                    isDisable: true,
                });
                break;
            // 注销频道
            case 7:
                eventRemoveLocalChannel(Number(channelId));
                break;
            default:
                break;
        }
    } else {
        eventBase.fnCommunicationSendMsg({
            operator: "updateChannelIdentity",
            data,
        });
    }

}

//  频道信息更新 operateType: 1-修改名称, 2-修改图片
const eventUpdateChannelInfo = (operateType, {channelId, channelName, icon}) => {
    const updateData = {
        channelId: Number(channelId),
        id: Number(channelId),
    };

    if (operateType === 1 && channelName) {
        // 频道名称更新
        updateData.name = updateData.channelName = channelName;
    } else if (operateType === 2 && icon) {
        // 频道图标更新
        updateData.pic = updateData.icon = icon;
    }

    eventBase.fnCommunicationSendMsg({
        operator: "channelUpdate",
        data: {
            type: "channel",
            channelId: updateData.channelId,
            id: updateData.id,
            values: updateData,
        },
    });
}

/**
 * 频道启用/禁用事件处理
 */
const eventToggleChannelDisabled = async ({ channelId, isDisable }) => {
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 同步更新 ChannelList 缓存的 isDisable
    const channelList = (await Cache(`${loginId}-ChannelList`)) || [];
    const idx = channelList.findIndex(i => Number(i.channelId) === Number(channelId));
    if (idx !== -1) {
        channelList[idx].isDisable = isDisable;
        Cache(`${loginId}-ChannelList`, channelList);
    }

    // 通过eventBase发送消息给其他订阅者
    eventBase.fnCommunicationSendMsg({
        operator: "channelToggleDisabled",
        data: {
            id: channelId,
            type: "channel",
            channelId,
            isDisable,
        },
    });

    // 通知 home-left 同步 channels 数组，防止后续 channelUpdate 事件覆盖缓存时丢失 isDisable
    eventBase.fnCommunicationSendMsg({
        operator: "channelUpdate",
        data: {
            channelId,
            values: { isDisable },
        },
    });
}

/**
 * 添加频道通知到统一的"频道通知"会话
 */
const fnAddChannelNoticeToChat = async (data) => {
    const { channelInfo, subscriberInfo, eventType, channelNoticeMsg, msg } = data || {};
    // const isChannelCreatedNotice = eventType === 2 && subscriberInfo?.operateType === 0;
    // console.log(`[DEBUG] 创建频道:${channelInfo?.operateType === 0 && eventType === 1} 加入频道:${eventType === 2 && subscriberInfo?.operateType === 0}, 通知消息:${channelNoticeMsg?.isNotice}`);
    if (channelNoticeMsg?.isNotice) {
        const { noticeMsg, unReadNum } = channelNoticeMsg || {};
        const timestamp = Number(data.msgTime) || Date.now();
        const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
        const customMsgId = generateUniqueId();
        const idStr = "channelNoticefriend"; // id + type

        // 更新未读数到缓存
        const res = await Cache(`${loginId}-unread`);
        const resUnread = (res && res.unread) || {};
        // 这里ws的unReadNum跟本地的不一致，因为有些事件他们没有计算未读
        const unReadCount = (unReadNum?.toNumber ? unReadNum.toNumber() : unReadNum) || (resUnread?.channelNoticefriend?.count || 0) + 1

        // 设置未读对象
        const unreadObj = {
            count: unReadCount,
            time: timestamp,
            unreadID: customMsgId,
        };

        // 更新缓存中的未读数
        resUnread[idStr] = unreadObj;
        await Cache(`${loginId}-unread`, { unread: resUnread });

        // 构建消息数据（用于显示在会话列表和聊天记录）

        // 发送msgNew通知，这会触发创建或更新会话
        eventBase.fnCommunicationSendMsg({
            operator: "msgNew",
            operatorType: "channelNotice",
            data: {
                id: "channelNotice",
                friendId: "channelNotice",
                type: "friend",
                name: "频道通知",
                content: noticeMsg || msg,  // 会话列表显示
                time: timestamp,
                sendTime: timestamp,
                receiveUid: loginId,
                customMsgId,
                unreadCount: unReadCount,  // 未读数
                unreadObj,  // 未读对象，同步到其他组件
                pic: require("@/assets/images/logo/channel-notice.webp"),
            },
        });


        // 通知频道通知列表更新
        eventBase.fnCommunicationSendMsg({
            operator: "channelNoticeUpdate",
            data: {},
        });
    }
}
/**
 * 移除本地的频道
 */
const eventRemoveLocalChannel = (channelId) => {
    if(!channelId) return;
    eventBase.fnCommunicationSendMsg({
        operator: "deleteChat",
        data: {
            id: channelId,
            type: "channel",
            isDeleteLocal: true,
        }
    });
}

/**
 * 频道添加通知消息
 */
const fnChannelAddMessageNotification = (info, notificationType) => {
    const chatType = 50;
    const timestamp = Date.now();
    // const channelInfo = fnGetChannelInfo(info.channelId)
    let data = {
        // ...channelInfo,
        id: info.channelId,
        time: info.updateTime || timestamp,
        sendTime: info.sendTime || timestamp,
        type: "channel",
        targetId: 0,
        channelId: info.channelId,
        content: info.content,
        name: info.channelName,
        channelName: info.channelName,
        logoColor: info.logoColor,
        operator: "message",
        MsgID: "",
        chatType,
        msgType: chatType,
        notificationType,
        messageProtocolId: info.messageProtocolId,
    };

    data = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== "")
    );

    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        operatorType: notificationType,
        data,
    });

    // 消息保存在本地
    // eventBase.fnMsgAddToDB({
    //     id: info.channelId,
    //     ChatType: chatType,
    //     type: "channel",
    //     Content: "{}",
    //     MsgID: info.msgId,
    //     msgId: info.msgId,
    //     channelId: info.channelId,
    //     chatType,
    //     content: info.content,
    //     customMsgId: info.customMsgId,
    //     errorType: 0,
    //     msgType: chatType,
    //     sendTime: info.updateTime,
    //     source: 0,
    //     groupName: info.name,
    //     pic: info.pic,
    // });
    return data;
};

const fnGetChannelInfo = async (channelId) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    const ChannelLists = await Cache(`${loginId}-ChannelList`);
    return ChannelLists.find(item => item.channelId === channelId)
}

/**
 * 添加成员
 */
const fnChannelAdd = async (info) => {
    if (info?.channelId === undefined || info?.channelId === null) return;

    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const id = Number(info.channelId);
    if (isNaN(id)) return;

    try {
        const ChannelLists = (await Cache(`${loginId}-ChannelList`)) || [];
        // 过滤掉已存在的相同ID频道（兼容数字和字符串比较）
        let list = ChannelLists.filter(item => Number(item.channelId) !== id);

        const channelInfo = fnChannelFormat(info);
        // 确保 channelId 是数字
        channelInfo.channelId = id;

        list.unshift(channelInfo);
        await Cache(`${loginId}-ChannelList`, list);
    } catch (error) {
        console.error("fnChannelAdd 缓存写入失败:", error);
    }
}

export const fnChannelFormat = (info) => {
    return {
        adminPrivacy: info.adminPrivacy || 0,
        channelId: Number(info.channelId),
        channelName: info.channelName || "",
        createTime: info.createTime,
        icon: info.icon || "",
        logoColor: info.logoColor || "#E11EFF",
        updateTime: info.updateTime || info.createTime || 0,
    }
}

/**
 * 获取所有频道列表
 */
const fnGetAllChannel = () => {
    return new Promise(resolve => {
        let pageNum = 1;
        const pageSize = 10;
        let resultList = [];
        async function getChannelPolling() {
            try {
                const res = await getChannelList({pageSize, pageNum})
                const list = res.data?.rowList || []
                resultList = [...resultList, ...list];
                if(list.length >= 10) {
                    pageNum += 1;
                    getChannelPolling()
                } else {
                    resolve(resultList)
                }
            } catch (err) {
                console.error('fnGetAllChannel 获取频道列表失败:', err);
                resolve(resultList); // 出错时返回已获取的列表
            }
        }
        getChannelPolling()
    })
}

/**
 * 频道更新
 */
const fnChannelUpdate = ({ info, channels, chats }) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const dataNew = {
        channels,
    };

    const id = Number(info.channelId);
    // 确保 info.channelId 是数字，方便后续处理
    if (!isNaN(id)) {
        info.channelId = id;
    }

    const index = channels.findIndex((item) => Number(item.channelId) === id);

    if (index === -1) {
        dataNew.channels.unshift(info);
    } else {
        dataNew.channels[index] = { ...dataNew.channels[index], ...info };
    }

    Cache(`${loginId}-ChannelList`, dataNew.channels);

    // 如果聊天信息不一致则更新聊天信息
    const chatIndex = chats.findIndex(
        (item) => item.id === info.channelId && item.type === "channel"
    );

    if (chatIndex !== -1) {
        const updateInfo = { ...chats[chatIndex] };
        let isUpdated = false;

        // 更新频道名称
        if (info.channelName && updateInfo.name !== info.channelName) {
            updateInfo.name = info.channelName;
            updateInfo.channelName = info.channelName;
            isUpdated = true;
        }

        // 更新频道图标
        if (info.icon && updateInfo.icon !== info.icon) {
            updateInfo.icon = info.icon;
            updateInfo.pic = info.icon;
            isUpdated = true;
        }

        // 更新频道id
        if (info.MsgID && updateInfo.MsgID !== info.MsgID) {
            updateInfo.MsgID = info.MsgID;
            isUpdated = true;
        }
         // 更新频道最新消息内容
        if (info.content && updateInfo.content !== info.content) {
            updateInfo.content = info.content;
            isUpdated = true;
        }
         // 更新频道消息时间
        if (info.time && updateInfo.time !== info.time) {
            updateInfo.time = info.time;
            updateInfo.sendTime = info.time;
            isUpdated = true;
        }
        // 更新聊天类型
        if (info.chatType !== undefined && updateInfo.chatType !== info.chatType) {
            updateInfo.chatType = info.chatType;
            isUpdated = true;
        }

        if (isUpdated) {
            chats[chatIndex] = updateInfo;
            dataNew.chats = chats;
            Cache(
                `${loginId}MessageChannelList`,
                chats.filter((item) => item.type === "channel")
            );
        }
    }

    return dataNew;
};

// 队列用于顺序执行频道订阅者加入事件，每次间隔100ms
let channelSubscriberJoinQueue = [];
let isProcessingQueue = false;

/**
 * 处理队列中的频道订阅者加入任务
 */
const processChannelSubscriberJoinQueue = async () => {
    if (isProcessingQueue || channelSubscriberJoinQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;

    while (channelSubscriberJoinQueue.length > 0) {
        const task = channelSubscriberJoinQueue.shift();
        try {
            await task();
        } catch (error) {
            console.error("执行频道订阅者加入任务失败:", error);
        }

        // 无论成功还是失败，都等待100ms后再继续下一个任务
        if (channelSubscriberJoinQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    isProcessingQueue = false;
};

/**
 * 处理频道订阅者加入事件
 */
const fnHandleChannelSubscriberJoin = async (latestChannelEventMessage) => {
    // 将任务添加到队列中
    channelSubscriberJoinQueue.push(async () => {
        await fnHandleChannelSubscriberJoinInternal(latestChannelEventMessage);
    });

    // 开始处理队列
    processChannelSubscriberJoinQueue();
};

/**
 * 内部处理频道订阅者加入事件的函数
 */
const fnHandleChannelSubscriberJoinInternal = async (latestChannelEventMessage) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const { channelId, subscriberInfo, msg, msgId } = latestChannelEventMessage;

    // 检查是否是本人加入（通过事件推送，说明是本人）
    // subscriberInfo.operateType: 0 = SUBSCRIBER_JOIN
    if (!channelId || !subscriberInfo || subscriberInfo.operateType !== 0) {
        return;
    }

    try {
        // 优先从 MessageChannelList 缓存获取频道详情
        const cachedMessageChannelList = (await Cache(`${loginId}MessageChannelList`)) || [];
        let channelDetail = null;

        // 查找缓存中的频道信息
        const cachedChannel = cachedMessageChannelList.find(
            item => Number(item.id) === Number(channelId) && item.type === "channel"
        );

        if (cachedChannel) {
            // 从缓存中获取频道详情，映射字段格式
            channelDetail = {
                channelName: cachedChannel.name || cachedChannel.channelName,
                icon: cachedChannel.pic || cachedChannel.icon,
                logoColor: cachedChannel.logoColor,
                createTime: cachedChannel.createTime,
                updateTime: cachedChannel.updateTime,
                adminPrivacy: cachedChannel.adminPrivacy,
            };
        } else {
            // 缓存中没有，从 API 获取
            const res = await getChannelDetail({ channelId: Number(channelId) });
            channelDetail = res?.data;

            if (!channelDetail) {
                console.error("获取频道详情失败",Number(channelId));
                return;
            }
        }

        // 格式化频道信息
        const channelInfo = fnChannelFormat({
            channelId: Number(channelId),
            channelName: channelDetail.channelName,
            icon: channelDetail.icon,
            logoColor: channelDetail.logoColor,
            createTime: channelDetail.createTime,
            updateTime: channelDetail.updateTime,
            adminPrivacy: channelDetail.adminPrivacy,
        });

        // 1. 更新频道列表缓存
        const ChannelLists = (await Cache(`${loginId}-ChannelList`)) || [];
        const existIndex = ChannelLists.findIndex(item => Number(item.channelId) === Number(channelId));

        // 如果频道列表中已存在，则忽略
        if (existIndex === -1) {
            // 调用 fnChannelAdd 统一处理缓存更新（包含 unshift 逻辑）
            await fnChannelAdd(channelInfo);

            // 通知界面更新频道列表（用于通讯录和搜索）
            eventBase.fnCommunicationSendMsg({
                operator: "channelUpdate",
                data: {
                    type: "channel",
                    channelId: Number(channelId),
                    id: Number(channelId),
                    values: channelInfo,
                },
            });
        }

        // 2. 更新聊天列表缓存
        const MessageChannelList = (await Cache(`${loginId}MessageChannelList`)) || [];
        const chatExistIndex = MessageChannelList.findIndex(
            item => Number(item.id) === Number(channelId) && item.type === "channel"
        );

        const timestamp = Number(latestChannelEventMessage?.msgTime) || Date.now();
        const customMsgId = Number(latestChannelEventMessage?.msgId) || generateUniqueId();
        const chatType = 50; // 系统通知消息类型
        const content = latestChannelEventMessage?.msg || "您已加入频道";

        // 如果聊天列表中不存在，则添加
        if (chatExistIndex === -1) {
            const chatItem = {
                ...channelInfo,
                id: Number(channelId),
                type: "channel",
                name: channelDetail.channelName,
                channelName: channelDetail.channelName,
                pic: channelDetail.icon,
                icon: channelDetail.icon,
                logoColor: channelDetail.logoColor,
                time: timestamp,
                sendTime: timestamp,
                content,
                unreadCount: 0,
                ...msg ? { content: msg } : {},
            };

            MessageChannelList.unshift(chatItem);
            await Cache(`${loginId}MessageChannelList`, MessageChannelList);

            // 3. 通知界面添加新频道会话
            eventBase.fnCommunicationSendMsg({
                operator: "msgNew",
                operatorType: "channelJoin",
                data: chatItem,
            });
        }

        // 4. 生成符合ComMsgSystemNotification的系统通知消息并存入数据库
        const systemNotificationMsg = {
            id: Number(channelId),
            channelId: Number(channelId),
            chatType: chatType,
            msgType: chatType,
            type: "channel",
            content,
            sendTime: timestamp,
            msgTime: timestamp,
            time: timestamp,
            customMsgId: customMsgId,
            msgId: msgId,
            sendUid: loginId,
            isSelf: true,
            errorType: 0,
            source: 0,
        };

        // 存入数据库
        eventBase.fnMsgAddToDB(systemNotificationMsg);

    } catch (error) {
        console.error("处理频道订阅者加入事件失败:", error);
    }
};

const fnGetHistoryMsgs = (params) => {
    // console.log('getHistoryMsgs--', params)
   return getHistoryMsgs(params).then(res => {
        // console.log('getHistoryMsgs-2-', res)
        const msgTotal = res.messageBytes?.length || 0;
        let msgs = [];
        if(msgTotal) {
            for(let i = 0; i < msgTotal; i++) {
                const arrayBuffer = res.messageBytes[i];
                const data = packet['PushChannelMessage'].decode(arrayBuffer);
                msgs.push(data);
            }
        }
        return msgs;
    })
}

// 查询是否是重复的推送
const isValidSocketMsg = (msgTime) => {
    if(!msgTime) return true;
    // console.log('isValidSocketMsg-1-',msgTime)
    const { lastOfflineTime } = eventCommon.fnOnlineInfoGet();
        // console.log('isValidSocketMsg-2-',msgTime, lastOfflineTime)
    return msgTime > lastOfflineTime
}

// let lastChannelMsgs = {};
// 根据消息ID查询是否是重复的推送
// const isRepetitiveSocketMsg = async (channelId, msgId) => {
//     console.log('isRepetitiveSocketMsg-1-',channelId, msgId)
//     if(!channelId || !msgId) return false;
//   const id = Number(channelId);
//   const type = "channel";
//   const limit = 100;
//   let lastMsg = lastChannelMsgs[id]
//       console.log('isRepetitiveSocketMsg-2-',lastMsg)
//   if(!lastMsg) {
//     // 缓存没有则从数据库查询最后一条消息信息
//          console.log('getLastMsg--', type, id)
//     lastMsg = await window.$db.getLastMsg(type, id)
//            console.log('getLastMsg-2-', lastMsg)
//     lastChannelMsgs[id] = lastMsg
//   }
//         console.log('isRepetitiveSocketMsg-2-2-',msgId, lastMsg, lastMsg?.msgId,Number(lastMsg?.msgId),String(lastMsg?.msgId))
//   if(!lastMsg) {
//     return false
//   }
//   const lastMsgId = Number(lastMsg?.msgId) || Number(lastMsg?.msgId?.low) || 0
//           console.log('isRepetitiveSocketMsg-2-3-',msgId, lastMsgId)
//   if(msgId > lastMsgId) {
//     return false
//   } else if(msgId > (lastMsgId - limit)) {
//        console.log('rangeQueryMsg--')
//     const msgInfo = await window.$db.rangeQueryMsg({
//         type,
//         id,
//         msgId,
//         limit,
//     })
//      console.log('rangeQueryMsg-4-', msgInfo)
//     return !!msgInfo
//   } else {
//     return true
//   }
// }

export default {
    fnGetAllChannel,
    fnChannelAdd,
    fnChannelAddMessageNotification,
    fnChannelUpdate,
    fnHandleChannelSubscriberJoin,
    handleChannelEvents,
    // isRepetitiveSocketMsg,
    isValidSocketMsg,
    fnGetHistoryMsgs,
    fnChannelFormat
}
