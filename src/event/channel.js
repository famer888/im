import { Cache } from "@/cache";
import eventCommon from "./common";
import eventBase from "./base";
import { getChannelList } from "@/api/imChannel";

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

export default {
    fnGetAllChannel,
    fnChannelAdd,
    fnChannelAddMessageNotification,
}