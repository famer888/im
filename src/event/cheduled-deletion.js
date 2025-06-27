import dayjs from "dayjs";
import { Cache } from "@/cache";

// api
import { UpdateContacts } from "@/api/imBase";
import { GroupUpdate } from "@/api/imGroup";

// 事件
import eventBase from "./base";
import eventCommon from "./common";

////////////////////////////////// 定时删除的配置

// 定时删除 群消息的配置
let groupMsgConfig = {};

// 定时删除 好友消息的配置
let friendMsgConfig = {};

/**
 * 初始化 定时删除消息的配置
 */
const fnCheduledDeletionConfigInit = () => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 群定时删除 配置获取
    Cache(`${loginId}-read-cancel-group`).then((res) => {
        groupMsgConfig = res || {};
    });

    // 好友定时删除 配置获取
    Cache(`${loginId}-read-cancel`).then((res) => {
        friendMsgConfig = res || {};
    });
};

/**
 * 群定时删除的配置 读/改/删
 */
const fnGroupMsgConfigRUD = (data) => {
    if (data) {
        const { key, value, info, infoMerge, deleteId, getId } = data;

        const loginId = eventCommon.fnCommonInfoRU({
            getId: "loginId",
        });

        if (info) {
            groupMsgConfig = info;
        } else if (infoMerge) {
            groupMsgConfig = {
                ...groupMsgConfig,
                ...info,
            };
        } else if (key && value) {
            groupMsgConfig[String(key)] = value;
        } else if (deleteId) {
            delete groupMsgConfig[deleteId];
        } else if (getId) {
            return groupMsgConfig[String(getId)];
        }

        Cache(`${loginId}-read-cancel-group`, groupMsgConfig);
    }

    return groupMsgConfig;
};

/**
 * 好友定时删除的配置 读/改/删
 */
const fnFriendMsgConfigRUD = (data) => {
    if (data) {
        const { key, value, info, infoMerge, deleteId, getId } = data;

        const loginId = eventCommon.fnCommonInfoRU({
            getId: "loginId",
        });

        if (info) {
            friendMsgConfig = info;
        } else if (infoMerge) {
            friendMsgConfig = {
                ...friendMsgConfig,
                ...info,
            };
        } else if (value) {
            friendMsgConfig[key] = value;
        } else if (deleteId) {
            delete friendMsgConfig[deleteId];
        } else if (getId) {
            return friendMsgConfig[getId];
        }

        Cache(`${loginId}-read-cancel`, friendMsgConfig);
    }
    return friendMsgConfig;
};

////////////////////////////////// 定时删除的消息

// 要删除的消息列表
let autoDeleteMsgList = [];
let autoDeleteMsgListGroup = [];

/**
 * 获取 定时删除的消息列表
 */
const fnMsgListGet = () => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    if (!loginId) {
        return;
    }

    ////////////////// 好友删除消息
    Cache(`${loginId}-autoDeleteMsgList`).then((res) => {
        autoDeleteMsgList = res || [];
    });

    ////////////////// 群删除消息
    Cache(`${loginId}-autoDeleteMsgGroup`).then((res) => {
        autoDeleteMsgListGroup = res || [];
    });
};

/**
 * 添加 定时删除信息
 */
const fnCheduledDeletionMsgAdd = (msg) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const filePath = `${loginId}-autoDeleteMsgList${
        msg.type === "friend" ? "" : "Group"
    }`;

    if (msg.type === "friend") {
        autoDeleteMsgList.push(msg);
        console.log({filePath, autoDeleteMsgList})
        Cache(filePath, autoDeleteMsgList);
    } else {
        autoDeleteMsgListGroup.push(msg);
        Cache(filePath, autoDeleteMsgListGroup);
    }
};

/**
 * 删除消息 按定时删除的信息去删除
 */
const fnCheduledDeletionMsgDelete = () => {
    const now = new Date().getTime();

    // 如果数据还有昨天的，就清除昨天所有数据，并获取新的要删除的信息

    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 好友的消息定时删除
    const msgFriendArr = [];
    let isUpdateMsgFriend = false;

    for (const item of autoDeleteMsgList) {
        if (item.time <= now) {
            // 删除消息
            eventBase.fnCommunicationSendMsg({
                operator: "msgDelete",
                data: {
                    id: item.id,
                    type: "friend",
                    idsDelete: [{ customMsgId: item.customMsgId }],
                },
            });

            isUpdateMsgFriend = true;
        } else {
            msgFriendArr.push(item);
        }
    }

    if (isUpdateMsgFriend) {
        autoDeleteMsgList = msgFriendArr;
        Cache(`${loginId}-autoDeleteMsgList`, autoDeleteMsgList);
    }

    // 群的消息定时删除
    const msgGroupArr = [];
    let isUpdateMsgGroup = false;

    for (const item of autoDeleteMsgListGroup) {
        if (item.time <= now) {
            // 删除消息
            eventBase.fnCommunicationSendMsg({
                operator: "msgDelete",
                data: {
                    id: item.id,
                    type: "group",
                    idsDelete: [{ customMsgId: item.customMsgId }],
                },
            });
            isUpdateMsgGroup = true;
        } else {
            msgGroupArr.push(item);
        }
    }

    autoDeleteMsgListGroup = msgGroupArr;
    if (isUpdateMsgGroup) {
        Cache(`${loginId}-autoDeleteMsgGroup`, autoDeleteMsgListGroup);
    }
};

/**
 * 阅后即焚 设置
 */
const fnRcheduleDeletionSet = (info) => {
    const { id, type, bfReadCancel, msgCancelTime } = info;

    // 好友
    if (type === "friend") {
        // 开启/关闭 阅后即焚
        if (bfReadCancel !== undefined) {
            UpdateContacts({
                op: 11,
                param: { bfReadCancel, contactsId: id },
            }).then(res => {
                eventBase.fnCommunicationSendMsg({
                    operator: "msgReadDelete",
                    data: {
                      id,
                      type,
                      ...res.commonResult
                    },
                  });
            });
        } else {
            // 修改时间
            UpdateContacts({
                op: 13,
                param: { msgCancelTime, contactsId: id },
            }).then(res => {
                eventBase.fnCommunicationSendMsg({
                    operator: "msgReadDelete",
                    data: {
                      id,
                      type,
                      ...res.commonResult
                    },
                  });
            });
        }
    } else {
        // 群
        // 开启/关闭 阅后即焚
        if (bfReadCancel !== undefined) {
            GroupUpdate({
                op: 16,
                groupParam: { bfGroupReadCancel: bfReadCancel, groupId: id },
            });
        } else {
            GroupUpdate({
                op: 17,
                groupParam: { groupMsgCancelTime: msgCancelTime, groupId: id },
            });
        }
    }
};

export default {
    fnGroupMsgConfigRUD,
    fnFriendMsgConfigRUD,
    fnCheduledDeletionMsgAdd,
    fnCheduledDeletionMsgDelete,
    fnCheduledDeletionConfigInit,
    fnMsgListGet,
    fnRcheduleDeletionSet,
};
