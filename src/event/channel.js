import { Cache } from "@/cache";
import eventCommon from "./common";
import eventBase from "./base";
import { getChannelList, getChannelDetail } from "@/api/imChannel";
import i18n from "@/assets/lang/i18n";
import { generateUniqueId } from "@/utils/base";

const handleChannelEvents = (data) => {
    const { channelInfo, channelId, eventType, subscriberInfo, channelNoticeMsg } = data || {};
    const { operateType } = channelInfo || {};
    const { operateType: subscriberOperateType } = subscriberInfo || {};

    // 频道通知消息
    channelNoticeMsg?.isNotice && fnChannelNoticeMessage(data);
    // 频道订阅变更事件
    if (eventType === 2) {
        switch(subscriberOperateType) {
          case 0:
            // 频道订阅者加入事件
            fnHandleChannelSubscriberJoin(data);
            // 频道系统消息
            return;
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
                eventUpdateChannelInfo(2, {channelId, icon})
            // 频道解散
            case 4:
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

// 频道通知
const fnChannelNoticeMessage = async (data) => {

    const { channelInfo, subscriberInfo, eventType, channelNoticeMsg, channelId } = data || {};
    const text = (origin, replace) => i18n.t(origin) || i18n.t(replace) || replace;
    const { operateType } = channelInfo || {};
    const { operateType: subscriberOperateType } = subscriberInfo || {};
    let content = '', notificationType = '';
    switch(true) {
      // 加入频道
      case eventType === 2 && subscriberOperateType === 0:
        notificationType = "channelJoin";
        content = text(channelNoticeMsg?.noticeMsg, '你已加入该频道');
        break;
      // 管理员变更
      case eventType === 2 && subscriberOperateType === 1:
        content = text(channelNoticeMsg?.noticeMsg, '管理员变更');
        break;
      // 启用频道
      case eventType === 2 && subscriberOperateType === 5:
        content = text(channelNoticeMsg?.noticeMsg, '频道已启用');
        break;
      // 禁用频道
      case eventType === 1 && operateType === 6:
        content = text(channelNoticeMsg?.noticeMsg, '频道已禁用');
        break;
      default:
        return;
    }

    // 添加频道通知到统一的"频道通知"会话
    if (content) {
        await fnAddChannelNoticeToChat(content, channelId);
    }
}

/**
 * 添加频道通知到统一的"频道通知"会话
 */
const fnAddChannelNoticeToChat = async (content, channelId) => {
    const timestamp = Date.now();
    const customMsgId = generateUniqueId();

    // 获取频道信息
    let channelName = "";
    if (channelId) {
        const channelInfo = await fnGetChannelInfo(channelId);
        channelName = channelInfo?.channelName || "";
    }

    // 构建通知消息内容
    const noticeContent = channelName ? `【${channelName}】${content}` : content;

    // 消息类型为0，表示文本消息
    const chatType = 0;
    const msgType = 0;

    // 构建 sendUser 对象（发送者信息）
    const sendUser = {
        icon: "/images/default_chat_icon.png",
        nickName: channelName || "频道通知",
        uid: 0,
    };

    // 构建消息数据（用于显示在会话列表和聊天记录）
    const msgData = {
        id: 10006,
        friendId: 10006,
        type: "friend",
        name: "频道通知",
        content: noticeContent,
        text: noticeContent,
        time: timestamp,
        sendTime: timestamp,
        msgType: msgType,
        chatType: chatType,
        source: 0,
        isSelf: false,
        customMsgId: customMsgId,
        MsgID: customMsgId,
        msgId: customMsgId,
        sendUser: sendUser,
        user: sendUser,  // 用于消息列表显示
        sendUserName: channelName || "频道通知",
        UserID: 0,
        sendUid: 0,
        receiveUid: eventCommon.fnCommonInfoRU({ getId: "loginId" }),
        readStatus: 0,
        errorType: 0,
        ChatType: chatType,
        Content: noticeContent,
    };

    // 发送msgNew通知，这会触发创建或更新会话
    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        operatorType: "channelNotice",
        data: msgData,
    });

    // 保存消息到数据库（用于聊天记录）
    eventBase.fnMsgAddToDB(msgData, 10006);
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
    if(!info?.channelId) return
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    const ChannelLists = await Cache(`${loginId}-ChannelList`);
    let list = ChannelLists.filter(item => item.channelId !== info.channelId)
    const channelInfo = fnChannelFormat(info)
    list.unshift(channelInfo)
    Cache(`${loginId}-ChannelList`, list);
}

const fnChannelFormat = (info) => {
    return {
        adminPrivacy: info.adminPrivacy || 0,
        channelId: info.channelId,
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
            const res = await getChannelList({pageSize, pageNum})
            const list = res.data?.rowList || []
            resultList = [...resultList, ...list];
            if(list.length >= 10) {
                pageNum += 1;
                getChannelPolling()
            } else {
                resolve(resultList)
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

    const index = channels.findIndex((item) => item.channelId === info.channelId);

    if (index === -1) {
        dataNew.channels.push(info);
    } else {
        dataNew.channels[index] = { ...dataNew.channels[index], ...info };
    }

    Cache(`${loginId}-ChannelList`, channels);

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

/**
 * 处理频道订阅者加入事件
 */
const fnHandleChannelSubscriberJoin = async (latestChannelEventMessage) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const { channelId, subscriberInfo } = latestChannelEventMessage;

    // 检查是否是本人加入（通过事件推送，说明是本人）
    // subscriberInfo.operateType: 0 = SUBSCRIBER_JOIN
    if (!channelId || !subscriberInfo || subscriberInfo.operateType !== 0) {
        return;
    }

    try {
        // 查询频道详情
        const res = await getChannelDetail({ channelId: Number(channelId) });
        const channelDetail = res?.data;

        if (!channelDetail) {
            console.error("获取频道详情失败");
            return;
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
        const existIndex = ChannelLists.findIndex(item => item.channelId === Number(channelId));

        // 如果频道列表中已存在，则忽略
        if (existIndex === -1) {
            ChannelLists.unshift(channelInfo);
            await Cache(`${loginId}-ChannelList`, ChannelLists);
        }

        // 2. 更新聊天列表缓存
        const MessageChannelList = (await Cache(`${loginId}MessageChannelList`)) || [];
        const chatExistIndex = MessageChannelList.findIndex(
            item => item.id === Number(channelId) && item.type === "channel"
        );

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
                time: Date.now(),
                sendTime: Date.now(),
                content: "你已加入该频道",
                unreadCount: 0,
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

    } catch (error) {
        console.error("处理频道订阅者加入事件失败:", error);
    }
};

export default {
    fnGetAllChannel,
    fnChannelAdd,
    fnChannelAddMessageNotification,
    fnChannelUpdate,
    fnHandleChannelSubscriberJoin,
    handleChannelEvents,
}
