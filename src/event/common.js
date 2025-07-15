import { Cache } from "@/cache";
import { websocketClose } from "@/socket";
import i18n from "@/assets/lang/i18n";
import { Local, getEnvType } from "@/utils";

// api
import { UpdateContacts, getChatSensitive } from "@/api/imBase";
import { GroupUpdate, groupOrUserDetail } from "@/api/imGroup";

// 事件
import eventBase from "./base";
import eventCommon from "./common";

// 复制的id
let idCopy = "";

const fnIdCopyRU = (value) => {
    if (value) {
        idCopy = value;
    }

    return idCopy;
};

// 公共信息
let commonInfo = {};

/**
 * 公共信息 读/写
 */
const fnCommonInfoRU = (data) => {
    if (data) {
        const { key, value, info, infoMerge, getId, deleteId } = data;

        if (info) {
            commonInfo = info;
        } else if (infoMerge) {
            commonInfo = {
                ...commonInfo,
                ...infoMerge,
            };
        } else if (key && value) {
            commonInfo[key] = value;
        } else if (getId) {
            return commonInfo[String(getId)];
        } else if (deleteId) {
            delete commonInfo[deleteId];
        }
    } else {
        return commonInfo;
    }
};

// 网络状态类型
let networkStatusType = "socketLoginout";

const fnNetworkStatusTypeRU = (data) => {
    if (data) {
        networkStatusType = data;
    } else {
        return networkStatusType;
    }
};

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 登出
 */
const fnLoginout = (args) => {
    // 断开长链接
    websocketClose(true);

    // 网络状态类型
    networkStatusType = "socketLoginout";

    // 变更登录列表信息
    Cache("login-account-list").then(async (res) => {
        // 如果退出需要清空数据
        if (accountConfig.isLoginoutClearHistory) {
            //
            eventBase.fnCommunicationSendMsg({
                operator: "clearAll",
                data: {},
            });

            // 等待 1.5秒
            await sleep(1500);
        }

        if (res) {
            const list = res.map((item) => {
                return item.id === commonInfo.loginId
                    ? {
                          ...item,
                          sourceId: "",
                          sessionId: "",
                      }
                    : item;
            });

            // 清空公共信息
            commonInfo = {};

            Cache("login-account-list",args && args.isFix ? [] : list).then(() => {
                window.$loading(false);
                // 跳转
                location.href = location.href.slice(
                    0,
                    location.href.lastIndexOf("#/") + 2
                ) + 'login';
            });
        } else {
            window.$loading(false);
            // 跳转
            location.href =location.href.slice(
                0,
                location.href.lastIndexOf("#/") + 2
            ) + 'login';
        }
    });
};

// 草稿信息
let draftInfos = {};

/**
 * 公共信息 读/写
 */
const fnDraftInfosRU = (data) => {
    if (data) {
        const { key, value, info, infoMerge, getId, deleteId } = data;
        if (info) {
            draftInfos = info;
        } else if (infoMerge) {
            draftInfos = {
                ...draftInfos,
                ...infoMerge,
            };
        } else if (key && value) {
            draftInfos[key] = value;
        } else if (getId) {
            return draftInfos[String(getId)];
        } else if (deleteId) {
            delete draftInfos[deleteId];
        }
    } else {
        return draftInfos;
    }
};

/**
 * 群/好友 免打扰 设置
 */
const fnDisturbSet = (info) => {
    const { id, type, bfDisturb } = info;
    const loginId = commonInfo.loginId;

    // 同步本地免打扰
    // 判断免打扰是否有更新，更新免打扰id列表
    eventCommon.fnDisturbInfoSync({
        id,
        type,
        bfDisturb: Boolean(bfDisturb),
    });

    // 好友
    if (type === "friend") {
        UpdateContacts({
            op: 3,
            param: { bfDisturb: bfDisturb, contactsId: id },
        });

        // 更新本地好友信息
        Cache(`${loginId}-ContactList`).then((friendList) => {
            let friendInfo = null;
            if (friendList && friendList.length) {
                friendInfo = friendList.find((item) => item.id == id);
                if (friendInfo) {
                    friendInfo.bfDisturb = bfDisturb;
                    // 更新好友信息
                    Cache(`${loginId}-ContactList`, friendList);
                }
            }
        });
    } else {
        // 群
        GroupUpdate({
            op: 4,
            groupParam: { disturb: bfDisturb, groupId: id },
        });
        // 更新本地群信息
        Cache(`${loginId}-GroupList`).then((groupList) => {
            let groupInfo = null;
            if (groupList && groupList.length) {
                groupInfo = groupList.find((item) => item.id == id);
                if (groupInfo) {
                    groupInfo.bfDisturb = bfDisturb;
                    // 更新群信息
                    Cache(`${loginId}-GroupList`, groupList);
                }
            }
        });
    }
};

// 免打扰列表
let disturbIdStrList = [];

/**
 * 免打扰列表 操作
 */
const fnDisturbIdStrListRU = (data) => {
    if (data) {
        const { list, idStrIsExist, idStrAdd, idStrRemove } = data;

        if (list) {
            // 赋值
            disturbIdStrList = list;
            return;
        } else if (idStrIsExist) {
            // 指定id是否存在
            return disturbIdStrList.includes(idStrIsExist);
        } else if (idStrAdd) {
            // 添加
            disturbIdStrList.push(idStrAdd);
        } else if (idStrRemove) {
            // 移除
            disturbIdStrList = disturbIdStrList.filter(
                (idStr) => idStr !== idStrRemove
            );
        }
    } else {
        return disturbIdStrList;
    }

    // 记录到本地
    Cache(commonInfo.loginId + "-mute", disturbIdStrList);
};

/**
 * 同步免打扰数据
 */
const fnDisturbInfoSync = ({ id, type, bfDisturb }) => {
    const idStr = id + type;

    // 当前是否为免打扰
    const isDisturb = disturbIdStrList.includes(idStr);

    // 如果与要设置的不一致，则更改
    if (isDisturb != bfDisturb) {
        if (bfDisturb) {
            fnDisturbIdStrListRU({ idStrAdd: idStr });
        } else {
            fnDisturbIdStrListRU({ idStrRemove: idStr });
        }
    }
};

// 关闭id列表
let closeIds = [];

/**
 * 关闭列表 读写
 */
const fnCloseListRU = ({ addId, removeIds, isCloseLast, isCloseAll }) => {
    let ids = [];

    // 如果关闭最后一个
    if (isCloseLast) {
        if (closeIds.length > 0) {
            ids = [closeIds[closeIds.length - 1]];
        }
    }

    // 如果关闭全部
    if (isCloseAll) {
        ids = closeIds;
    }

    // 添加
    if (addId) {
        closeIds.push(addId);
    }

    // 移除
    if (removeIds && removeIds.length > 0) {
        ids = _.intersection(closeIds, removeIds);
    }

    if (ids.length > 0) {
        // 修改 关闭id列表
        closeIds = closeIds.filter((id) => !ids.includes(id));

        // 关闭操作
        eventBase.fnCommunicationSendMsg({
            operator: "closeOperator",
            data: {
                ids,
            },
        });
    }
};

/**
 * 新的好友或群
 */
const fnNewFriendOrGroup = (text) => {
    groupOrUserDetail({
        fromUid: commonInfo.loginId,
        context: text,
    }).then(async (res) => {
        let errText = i18n.t("查询失败");

        if (res) {
            const { errCode, errMsg } = res.commonResult || {};

            if (errCode == 200) {
                // 好友
                if (res.groupOrUserType == 1) {
                    const { userInfo } = res?.targetUser || {};

                    if (userInfo) {
                        eventBase.fnCommunicationSendMsg({
                            operator: "memberDialogShow",
                            data: {
                                values: {
                                    id: Number(userInfo.uid),
                                    icon: userInfo.icon,
                                    nickName: userInfo.nickName,
                                },
                            },
                        });
                    }
                } else {
                    // 群
                    const { groupBase, addToken } = res.groupDetail || {};

                    if (groupBase) {
                        eventBase.fnCommunicationSendMsg({
                            operator: "openGroupDialog",
                            data: {
                                values: {
                                    id: Number(groupBase.groupId),
                                    pic: groupBase.pic,
                                    name: groupBase.name,
                                    memberCount: Number(groupBase.memberCount),
                                    addToken,
                                    groupAliasName: groupBase.groupAliasName,
                                    hostId: Number(groupBase.hostId),
                                    bfJoinFriend: groupBase.bfJoinFriend,
                                    bfJoinCheck: groupBase.bfJoinCheck,
                                },
                            },
                        });
                    }
                }

                return;
            } else if (errMsg) {
                errText = errMsg;
                window.$toast(i18n.t("抱歉，该用户/群似乎不存在"));
            }
        }

    });
};

// 设置信息 账户的
let accountConfig = {
    isLoginoutClearHistory: false, // 是否退出清空历史记录
    sendShortcutKey: "Enter", // 发送消息快捷键
    isAddingFriendsRequiresVerification: true, // 加好友验证
};

// 设置信息 设备的
let deviceConfig = {
    language: "zh",
    isNewMessageAlertTone: false, // 新消息提示音
    isMessageReminderWhenMinimized: true, // 最小化时消息提醒
};

/**
 * 配置信息 初始化
 */
const fnConfigInit = async (isAccount) => {
    if (isAccount) {
        // 初始化 账户的设置信息
        const res = await Cache(`${commonInfo.loginId}-account-config`);
        accountConfig = { ...accountConfig, ...res };
    } else {
        // 初始化 设备的设置信息
        Cache("device-config").then((res) => {
            deviceConfig = res || deviceConfig;
        });
    }
};

/**
 * 配置信息 读写
 */
const fnConfigRU = (values) => {
    if (values) {
        const { isAccount, infoMerge } = values;

        if (isAccount) {
            accountConfig = { ...accountConfig, ...infoMerge };

            // 写到本地
            Cache(`${commonInfo.loginId}-account-config`, accountConfig);
        } else {
            deviceConfig = { ...deviceConfig, ...infoMerge };

            // 写到本地
            Cache("device-config", deviceConfig);
        }
    } else {
        return {
            accountConfig,
            deviceConfig,
        };
    }
};

/**
 * at 点击
 */
const fnAtClick = (text, currentGuoupId) => {
    // 登录id
    const loginId = commonInfo.loginId;

    // 判断是否是当前已有的群
    Cache(`${loginId}-GroupList`).then((res) => {
        if (res) {
            const groupInfo = res.find((item) => item.groupAliasName === text);

            if (groupInfo) {
                if (currentGuoupId == groupInfo.id) {
                    window.$toast(i18n.t("您已在该群聊"));
                    return;
                }

                eventBase.fnCommunicationSendMsg({
                    operator: "activeChange",
                    data: {
                        ...groupInfo,
                        type: "group",
                        comType: "chat",
                    },
                });
            } else {
                // 判断打开新的好友或者群
                eventBase.fnCommunicationSendMsg({
                    operator: "openDialogNewFriendOrGroup",
                    data: {
                        text,
                    },
                });
            }
        }
    });
};

///////////////// 客户端的信息

// 登录的 sessionId
let sessionId = "";

/**
 * 登录的 sessionId 读写
 */
const fnLoginSessionIdRU = (value) => {
    if (value) {
        sessionId = value;
    }
    return sessionId;
};

/**
 * 获取跟后端交换用户的公共信息
 */
const fnClientInfoGet = () => {
    const languageIndex = ["en", "zh", "zh-tw", "vi", "pt"].indexOf(
        deviceConfig.language || "zh"
    );

    return {
        sessionId,
        appVer: "1.8.0".replaceAll(".", ""),
        packageCode: 1000,
        language: languageIndex + 1, // 默认简体中文
        plat: process.platform === "darwin" ? 3 : 4,
        sysModel: process.platform === "darwin" ? "MAC" : "WINDOWS",
    };
};

/////////////// 敏感词

let sensitiveWords = [];

/**
 * 敏感词初始化
 */
const fnSensitiveWordsInit = () => {
    getChatSensitive().then((res) => {
        if (res && res.addSensitives) {
            sensitiveWords = res.addSensitives;
        }
    });
};

/**
 * 敏感词获取
 */
const fnSensitiveWordsGet = () => {
    return sensitiveWords;
};

////////////// 动态域名
const domainsName = `domains_${getEnvType()}`
let domains = Local(domainsName) || {
    webBiz: "",
    webSession: "",
    domain: ""
};

const fnDomainsGet = () => {
    return domains || {};
}

const fnDomainsSet = (data) => {
    domains = data;
    Local(domainsName, data) 
}

const fnDomainsAttribSet = ({key, value}) => {
    domains[key] = value
    Local(domainsName, domains) 
}

export default {
    fnIdCopyRU,
    fnCommonInfoRU,
    fnNetworkStatusTypeRU,
    fnLoginout,
    fnDraftInfosRU,
    fnDisturbSet,
    fnDisturbIdStrListRU,
    fnDisturbInfoSync,
    fnCloseListRU,
    fnNewFriendOrGroup,
    fnConfigInit,
    fnConfigRU,
    fnClientInfoGet,
    fnSensitiveWordsInit,
    fnSensitiveWordsGet,
    fnAtClick,
    fnLoginSessionIdRU,
    fnDomainsGet,
    fnDomainsSet,
    fnDomainsAttribSet,
};
