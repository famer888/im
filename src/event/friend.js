import { Cache } from "@/cache";
import { longToNum, objectComparisonUpdate, generateUniqueId, getNow } from "@/utils/base";
import i18n from "@/assets/lang/i18n";

// api
import { UpdateContacts } from "@/api/imBase";
import { getContactsDetail } from "@/api/imContacation";
import { getfriendCommonGroupList } from "@/api/imGroup";

// 事件
import eventBase from "./base";
import eventCommon from "./common";
import eventGroup from "./group";

const letterList = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "#",
];

/////////////////////////////// 好友备注
// 记录好友的备注名
let friendRemarkNameObj = {};

/**
 * 好友备注名读写
 */
const fnFriendRemarkNameObjRU = (data) => {
    const { key, value, info, getId } = data;
    if (data) {
        if (info) {
            friendRemarkNameObj = info;
        } else if (key && value) {
            friendRemarkNameObj[key] = value;
        } else if (getId) {
            return friendRemarkNameObj[String(getId)];
        }
    } else {
        return friendRemarkNameObj;
    }
};

// 次方法项目刷新，或者第一次登录，只会执行一次，就是获取好友备注名存储在 friendRemarkNameObj 对象上
const initFriendRemarkName = (loginId) => {
    Cache(`${loginId}-ContactList`).then((res) => {
        if (res && res.length) {
            let list = [...res];
            // 本地文件的好友列表，存储的备注名是 name 字段
            list.forEach((item) => {
                if (item.name) {
                    friendRemarkNameObj[item.id] = item.name;
                }
            });
        }
    });
};

/**
 * 好友 添加/修改
 */
const fnFriendCU = (data) => {
    const { id, friendRecordmsg } = data;
    const info = _.get(friendRecordmsg, "[0]");

    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // console.log(data, '93 --------------------> 好友更新', info, Object.prototype.toString.call(info))

    if (info) {
        const bfReadCancel = Boolean(
            _.get(info, "contactsDetail.bfReadCancel")
        );
        const msgCancelTime = _.get(info, "contactsDetail.msgCancelTime");

        const bfReadReceipt = Boolean(
            _.get(info, "contactsDetail.bfReadReceipt")
        );

        let receiveUid = Number(
            _.get(info, "contactsDetail.userInfo.uid") || 0
        );
        const isSelf = loginId === Number(info.sendUid);

        if (!isSelf) {
            // 不是自己的信息，则进入好友更新处理
            fnUpdateFriend(info, loginId);
        }
        // console.log('是自己开启/关闭的阅后即焚吗？', {isSelf},)

        const sendUserName = isSelf
            ? ""
            : (_.get(
                  info,
                  "contactsDetail.userInfo.friendRelation.remarkName"
              ) ||
                  _.get(info, "contactsDetail.userInfo.nickName") ||
                  "") + "";

        if (Number(receiveUid) === loginId) {
            receiveUid = Number(
                _.get(info, "contactsDetail.userInfo.uid") || 0
            );
        }

        if (receiveUid) {
            const params = {
                doType: info.doType,
                ChatType: 51,
                Content: "{}",
                bfReadCancel,
                bfReadReceipt,
                MsgID: id,
                ToUserID: receiveUid,
                UserID: Number(info.sendUid),
                chatType: 51,
                content:
                    info.doType === 2
                        ? `${Number(!!bfReadCancel)}||${msgCancelTime}`
                        : i18n.t("我们已成为好友，打声招呼吧"),
                customMsgId: id.toString(),
                errorType: 0,
                msgType: 51,
                receiveUid: receiveUid,
                sendTime: Number(info.createTime),
                sendUid: Number(info.sendUid),
                source: 0,
                user: _.get(info, "contactsDetail.userInfo"),
                sendUserName,
            };

            const data = {
                ...params,
                id: receiveUid,
                time: params.sendTime,
                type: "friend",
                isSelf,
                sendUserName: "",
                friendId: receiveUid,
                bfReadReceipt,
                bfReadCancel,
                msgCancelTime,
                letter: _.get(info, "contactsDetail.letter") || "#",
                nickName: params.user.nickName,
                pic: params.user.icon || "",
            };

            eventBase.fnCommunicationSendMsg({
                operator: info.doType === 2 ? "friendUpdate" : "friendAdd",
                operatorType: "notification",
                data,
            });

            eventBase.fnMsgAddToDB({ ...data }, data.friendId);

            if (info.doType === 2) {
                data.content = getReadCancelTip(
                    msgCancelTime,
                    sendUserName || i18n.t("你"),
                    bfReadCancel
                );
            }

            eventBase.fnCommunicationSendMsg({
                operator: "msgNew",
                operatorType: "notification",
                data: {
                    ...data,
                },
            });
        }
    }
};

// 好友阅后即焚时间格式化方法
function getReadCancelTip(second, name, bfReadCancel) {
    if (bfReadCancel) {
        let str = name + " " + i18n.t("设置了消息已读XX后销毁");
        // Set time
        let timeStr = "";
        if (second < 60) {
            timeStr = second + i18n.t("秒");
        } else if (second < 60 * 60) {
            timeStr = second / 60 + i18n.t("分钟");
        } else if (second < 60 * 60 * 24) {
            timeStr = second / (60 * 60) + i18n.t("小时");
        } else {
            timeStr = second / (60 * 60 * 24) + i18n.t("天");
        }
        return str.replace("XX", timeStr);
    } else {
        return name + i18n.t("关闭了阅后即焚");
    }
}

// 好友添加和更新处理
async function fnUpdateFriend(friendData, loginId) {
    // console.log(friendData, '224 --------->')
    const friendInfo = friendData.contactsDetail;
    const contactList = await Cache(`${loginId}-ContactList`);
    const friendId = Number(friendInfo.userInfo.uid);
    const index = contactList.findIndex((item) => item.id == friendId);
    const data = {
        bfReadReceipt: friendInfo.bfReadReceipt,
        msgCancelTime: friendInfo.msgCancelTime,
        lettet: friendInfo.letter,
        identify: friendInfo.userInfo.identify,
        nickName: friendInfo.userInfo.nickName,
        id: friendId,
    };
    if (friendInfo.userInfo.icon) {
        data.pic = friendInfo.userInfo.icon;
    }
    if (index !== -1) {
        contactList[index] = {
            ...contactList[index],
            ...data,
        };
    } else {
        contactList.push(data);
    }
    // console.log(contactList, '----------->248')
    Cache(`${loginId}-ContactList`, contactList);
}

// 被好友删除后，提示添加好友
function fnHandTipAddFriend(info) {
       let customMsgId = generateUniqueId();
       const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    let sendTime = getNow();
    const params = {
        ChatType: 52,
        Content: "{}",
        chatType: 52,
        content: i18n.t("请先添加对方为朋友"),
        customMsgId: customMsgId,
        errorType: info.commonResult.errCode,
        errMsg: info.commonResult.errMsg,
        msgType: 52,
        sendTime: sendTime,
        sendUid: loginId,
        targetId: Number(info.targetId),
        source: 0,
        id: Number(info.targetId),
        type: 'friend',
        messageProtocolId: info.messageProtocolId
    };

    eventBase.fnMsgAddToDB({ ...params }, Number(info.targetId));

    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        operatorType: "notification",
        data: {
            ...params,
        },
    });
}

// 私聊增加提示消息
const fnFriendAddMsgTip = (content, info) => {
      let customMsgId = generateUniqueId();
       const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    let sendTime = getNow();
    const params = {
        ChatType: 52,
        Content: "{}",
        chatType: 52,
        content,
        customMsgId: customMsgId,
        errorType: info.commonResult.errCode,
        errMsg: info.commonResult.errMsg,
        msgType: 52,
        sendTime: sendTime,
        sendUid: loginId,
        targetId: Number(info.targetId),
        source: 0,
        id: Number(info.targetId),
        type: 'friend',
        messageProtocolId: info.messageProtocolId
    };

    eventBase.fnMsgAddToDB({ ...params }, Number(info.targetId));

    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        operatorType: "notification",
        data: {
            ...params,
        },
    });
}

/**
 * 请求到的数据格式化
 */
const fnApiDataFormat = (friendList) => {
    return friendList.map((item) => {
        const id = longToNum(item.userInfo.uid);

        const info = {
            letter: item.letter,
            id,
            identify: item.userInfo.identify,
            nickName: item.userInfo.nickName,
            msgCancelTime: item.msgCancelTime,
            ...item.userInfo.bfCancel ? { bfCancel: item.userInfo?.bfCancel } : {},
            ...item.userInfo.bfBanned ? { bfBanned: item.userInfo?.bfBanned } : {},
        };

        const name = _.get(item.userInfo, "friendRelation.remarkName");
        if (name) {
            info.name = name;
        }

        if (item.userInfo.icon) {
            info.pic = item.userInfo.icon;
        }

        if (item.bfTop) {
            info.bfTop = item.bfTop;
        }

        if (item.bfDisturb) {
            info.bfDisturb = item.bfDisturb;
        }

        const online = _.get(item.userInfo, "userOnOrOffline.online");
        if (online) {
            info.online = online;
        }

        if (item.userInfo.depict) {
            info.depict = item.userInfo.depict;
        }

        if (item.bfReadCancel) {
            info.bfReadCancel = item.bfReadCancel;
        }
        if (item.signature) {
            info.signature = item.signature;
        }
        return info;
    });
};

/**
 * 好友列表格式化
 */
const fnFriendListFormat = (list) => {
    const letters = [];
    const letterIndexs = [];
    let friendList = [];
    let index = 0;

    for (const letter of letterList) {
        const arr = list.filter((item) => item.letter === letter);

        if (arr.length > 0) {
            letters.push(letter);
            letterIndexs.push(index);
            index = index + arr.length;
            friendList = [...friendList, ...arr];
        }
    }

    return {
        letters,
        letterIndexs,
        friendList,
    };
};

/**
 * 获取好友详情并对应更新
 */
const fnFriendDetailsGet = (id, { channelId, groupId } = {}) => {
    // 如果是系统账户，则不需要拉详情
    if (["10002"].includes(String(id))) {
        return;
    }
    let params = {
        targetUid: Number(id)
    };
    if (groupId) params.groupId = groupId;
    if (channelId) params.channelId = channelId;

    // 获取联系人详情
    getContactsDetail(params).then((res) => {
      console.log('获取联系人详情',res,'params',params)
        // 阅后即焚 是否开启
        const bfReadCancel =
            _.get(res, "contactsDetailBase.bfReadCancel") || false;

        /// 阅后即焚 时间
        const msgCancelTime =
            _.get(res, "contactsDetailBase.msgCancelTime") || 30;

        // 是否免打扰
        const bfDisturb = _.get(res, "contactsDetailBase.bfDisturb") || false;

        // 黑名单
        const bfMyBlack = _.get(res, "contactsDetailBase.bfMyBlack") || false;

        // 添加好友所需的token
        const addToken = _.get(res, "contactsDetailBase.addToken") || "";

        if (res && res.contactsDetailBase) {
            // 数据不更新置顶
            delete res.contactsDetailBase.bfTop;

            // 更新好友信息
            const list = fnApiDataFormat([res.contactsDetailBase]);

            eventBase.fnCommunicationSendMsg({
                operator: "friendUpdate",
                data: {
                    ...list[0],
                    bfReadCancel,
                    msgCancelTime,
                    bfDisturb,
                    bfMyBlack,
                    addToken,
                    type: "friend",
                },
            });
            if (list[0].name) {
                eventBase.fnCommunicationSendMsg({
                    operator: "friendRemarkUpdate",
                    operatorType: "name",
                    data: {
                      id: list[0].id,
                      type: "friend",
                      values: {
                        // 空字符串表示删除备注名
                        name: list[0].name,
                      },
                    },
                });
            }
        }
    });
};

/**
 * 好友更新
 */
const fnFriendUpdate = ({ info, friends, chats }) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    const dataNew = {};

    // 如果有好友更新，则比较 窗口和好友列表是否需要更新
    const friendIndex = friends.findIndex((item) => item.id === info.id);

    if (friendIndex !== -1) {
        const updateInfo = objectComparisonUpdate(friends[friendIndex], info);

        if (updateInfo) {
            // 信息被更新，则同步好友列表
            friends[friendIndex] = updateInfo;
            const { letters, letterIndexs, friendList } =
                fnFriendListFormat(friends);

            dataNew.friendData = {
                letters,
                letterIndexs,
                friendList,
            };
            Cache(`${loginId}-ContactList`, friendList);

            // 判断免打扰是否有更新，更新免打扰id列表
            eventCommon.fnDisturbInfoSync({
                id: updateInfo.id,
                type: "friend",
                bfDisturb: Boolean(updateInfo.bfDisturb),
            });
        }
    }

    // 如果聊天信息不一致则更新聊天信息
    const chatIndex = chats.findIndex(
        (item) => item.id === info.id && item.type === "friend"
    );
    if (chatIndex !== -1) {
        const updateInfo = objectComparisonUpdate(chats[chatIndex], info);
        if (updateInfo) {
            chats[chatIndex] = updateInfo;
            dataNew.chats = chats;
            Cache(
                `${loginId}MessageUserList`,
                chats.filter((item) => item.type === "friend")
            );
        }
    }

    return dataNew;
};

/**
 * 备注名，备注描述 更新
 */
const fnRemarkUpdate = (info, operatorType) => {
    const { name, depict } = info.values;
    // 设置接口传参
    const param = {
        contactsId: info.id,
    };

    if (operatorType === "name") {
        param.noteName = name;
        // 更新存储好友备注名的对象
        friendRemarkNameObj[info.id] = name;
    } else {
        param.depict = depict;
    }

    // 提交备注修改
    UpdateContacts({
        op: operatorType === "name" ? 4 : 5,
        param,
    });

    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    ///////////////////// 本地数据直接都给改了，这个频率低
    // 更新好友列表
    Cache(`${loginId}-ContactList`).then((res) => {
        if (res) {
            const index = res.findIndex((item) => item.id === info.id);

            if (index !== -1) {
                const list = res;
                if (operatorType === "name") {
                    list[index].name = name;
                } else {
                    list[index].depict = depict;
                }
                // 更新到本地
                Cache(`${loginId}-ContactList`, list);
            }
        }
    });

    // 更新好友备注专属数组
    if(operatorType === "name") {
      Cache(`${loginId}-FriendRemarks`).then((res) => {
        if(res) {
            let list = res;
            const index = list.findIndex((item) => item.id === info.id);
            if (index !== -1) {
                list[index].name = name;

            } else {
                list.push({
                    id: info.id,
                    name,
                })
            }
            // 更新到本地
            eventCommon.fnFriendRemarksSet(list);
            Cache(`${loginId}-FriendRemarks`, list);
        }
    });
    }


    // 更新聊天列表, 只有名称更新需要
    if (operatorType === "name") {
        Cache(`${loginId}MessageUserList`).then((res) => {
            if (res && res.length > 0) {
                const index = res.findIndex((item) => item.id === info.id);

                if (index !== -1) {
                    const list = res;
                    list[index].name = name;
                    // 更新到本地
                    Cache(`${loginId}MessageUserList`, list);
                }
            }
        });
        // 更新聊天列表群聊的会话框
        Cache(`${loginId}MessageGroupList`).then((res) => {
            if (res && res.length > 0) {
                let list = [...res];
                for (let i = 0; i < list.length; i++) {
                    let item = list[i];
                    if (item.sendUid && item.sendUid == info.id) {
                        item.sendUserName = name + "：";
                    }
                }
                Cache(`${loginId}MessageGroupList`, list);
            }
        });
    }

    // 更新群里的好友备注名
    if (operatorType === "name") {
        fnUpdateFriendRemarkNameInGroup(info.id, name, 1);
    }
};

/**
 * 更新在群里的好友备注名
 */
const fnUpdateFriendRemarkNameInGroup = (id, name, pageNum) => {
    const pageSize = 100;

    getfriendCommonGroupList({
        contactsId: id,
        pageNum,
        pageSize,
    }).then((res) => {
        if (res) {
            const { count, groups } = res;
            const groupIdList = groups.map((item) => Number(item.groupId));

            eventGroup
                .fnGroupMembersUpdateInSequence({
                    groupIdList,
                    id,
                    name,
                })
                .then(() => {
                    // 如果还存在未更新的群
                    if (count > pageNum * pageSize) {
                        fnUpdateFriendRemarkNameInGroup(id, name, pageNum + 1);
                    }
                });
        }
    });
};

export default {
    fnFriendRemarkNameObjRU,
    fnFriendCU,
    fnApiDataFormat,
    fnFriendListFormat,
    fnFriendDetailsGet,
    fnFriendUpdate,
    initFriendRemarkName,
    fnRemarkUpdate,
    fnHandTipAddFriend,
    fnFriendAddMsgTip,
};
