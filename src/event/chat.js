import { Cache } from "@/cache";

// api
import {
    CreateArchiveReq,
    QueryArchiveReq,
    RemoveArchiveReq,
} from "@/api/imBase";
import { getChannelDetail } from "@/api/imChannel";

// 事件
import eventCommon from "./common";
import eventBase from "./base";

/**
 * 聊天列表排序
 */
const fnChatListSort = (list) => {
    try {
        const chatTopList = list.filter((item) => item.bfTop);
        const chatList = list.filter((item) => !item.bfTop);
        return {
            list: [
                ...chatTopList.sort(
                    (a, b) => Number(b.bfTopTime) - Number(a.bfTopTime)
                ),
                ...chatList.sort(
                    (a, b) => Number(b.sendTime || 0) - Number(a.sendTime || 0)
                ),
            ].filter((item) => !(item.type === "friend" && item.id === 10002)),
            chatTopSize: chatTopList.length,
        };
    } catch (e) {
        console.log("//// ChatSort", e);
    }

    return {
        list: [],
        chatTopSize: 0,
    };
};

/**
 * 聊天窗口信息 更新
 */
const fnChatWindowUpdate =  (info) => {
    const { updateInfo, chats, friendList, groups, channels, unreadObj } = info;

    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 返回信息
    const returnInfo = {};

    // id + 类型 组合出来的唯一id
    const idStr = updateInfo.id + updateInfo.type;

    //////////////////////// 聊天窗口列表更新

    const chatList = _.cloneDeep(chats);

    // 或聊天窗口信息
    let chatIndex = chatList.findIndex(
        (item) => item.id === updateInfo.id && item.type === updateInfo.type
    );
    if (chatList[chatIndex]) {
        // 如果存在则直接变更窗口信息
        chatList[chatIndex] = {
            ...chatList[chatIndex],
            chatType: updateInfo.chatType,
            content: updateInfo.content,
            isSelf: updateInfo.isSelf,
            msgType: updateInfo.msgType,
            sendTime: updateInfo.sendTime,
            source: updateInfo.source,
            sendUid: updateInfo.sendUid,
            sendUserName: updateInfo.sendUserName,
            text: updateInfo.text,
            atUsers: updateInfo.atUsers,
            // bfShutup: updateInfo.bfShutup,
        };

        returnInfo.chatList = chatList;
    } else {
        // 聊天窗信息
        let chatInfo = null;

        // 如果不存在则获取信息后，再变更
        if (updateInfo.type === "friend") {
            // 如果是 系统账户的消息
            if ([10001, 10005].includes(updateInfo.id)) {
                chatInfo = {
                    pic: _.get(updateInfo, "sendUser.icon"),
                    name:
                        _.get(updateInfo, "sendUser.nickName") ||
                        (updateInfo.id === 10001 ? "68 Messenger" : "系统助手"),
                };
            } else {
                // 如果是好友， 在好友中查找
                chatInfo = friendList.find((item) => item.id === updateInfo.id);

                // 如果好友信息没找到
                if (!chatInfo) {
                    //
                }
            }
        }

        // 群信息同步
        if (updateInfo.type === "group") {
            // 在群中查找
            chatInfo = groups.find((item) => item.id === updateInfo.id);

            // 如果好友信息没找到
            if (!chatInfo) {
                //
            }
        }

        // 频道信息同步
            console.log('channels--', updateInfo, channels)
        if (updateInfo.type === "channel") {
            chatInfo = channels.find((item) => item.channelId === updateInfo.id);
            console.log('channels--', chatInfo)
            // if(!chatInfo) {
            //     const res = await getChannelDetail({ channelId: updateInfo.id });
            //     console.log('getChannelDetail--', res)
            // }
        }


        // 添加新窗口
        chatList.push({ ...chatInfo, ...updateInfo });

        // 聊天窗口列表有变更
        returnInfo.chatList = chatList;
    }

    // 聊天列表有变更
    if (returnInfo.chatList) {
        // 聊天窗口重新排序
        const { list, chatTopSize } = fnChatListSort(returnInfo.chatList);

        returnInfo.chatList = list;
        returnInfo.chatTopSize = chatTopSize;

        const cacheNames = {"group": "MessageGroupList", "friend": "MessageUserList", "channel": "MessageChannelList"}
        // 同步到本地
        Cache(
            `${loginId}${ 
                cacheNames[updateInfo.type] || "MessageUserList"
            }`,
            returnInfo.chatList.filter((item) => item.type === updateInfo.type)
        );
    }

    //////////////////////// 未读更新
    if (updateInfo.unreadObj) {
        unreadObj[idStr] = updateInfo.unreadObj;
        returnInfo.unreadObj = unreadObj;
    }

    // 返回
    return returnInfo;
};

/**
 * 归档 更新
 */
const fnArchiveInfoUpdate = async () => {
    const res = await QueryArchiveReq();

    if (res && res.ArchiveInfo) {
        const list = res.ArchiveInfo.map((item) => {
            return {
                status: Number(item.status),
                id: Number(item.target),
                type: Number(item.type) === 1 ? "friend" : "group",
            };
        });

        const loginId = eventCommon.fnCommonInfoRU({
            getId: "loginId",
        });

        await Cache(`${loginId}-archive`, list);

        // 通讯
        eventBase.fnCommunicationSendMsg(
            {
                operator: "archiveUpdate",
            },
            true
        );
    }
};

/**
 * 归档 改变
 */
const fnArchiveInfoChange = async (info, operatorType) => {
    const params = {
        ArchiveInfo: [
            {
                target: Number(info.id),
                type: info.type === "group" ? 2 : 1,
                status: 1,
            },
        ],
    };

    // 添加
    if (operatorType === "add") {
        CreateArchiveReq(params).then((res) => {
            fnArchiveInfoUpdate();
        });
    } else {
        // 移除
        RemoveArchiveReq(params).then(() => {
            fnArchiveInfoUpdate();
        });
    }
};

/**
 * 聊天窗口列表 更新置顶
 */
const fnChatsUpdateBfTop = (chats, { id, type, bfTop }) => {
    const index = chats.findIndex(
        (item) => item.id === id && item.type === type
    );

    // 如果没有找到，直接返回 null
    if (index === -1) {
        return null;
    }

    // 如果修改的跟目前一致，则没有必要修改
    if (Boolean(chats[index].bfTop) === bfTop) {
        return null;
    }

    // 直接引用修改
    chats[index].bfTop = bfTop;

    return fnChatListSort(chats);
};

export default {
    fnChatListSort,
    fnChatWindowUpdate,
    fnArchiveInfoUpdate,
    fnArchiveInfoChange,
    fnChatsUpdateBfTop,
};
