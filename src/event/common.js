import { Cache } from "@/cache";
import { websocketClose } from "@/socket";
import i18n from "@/assets/lang/i18n";
import { Local, getEnvType } from "@/utils";
import { remote } from "@/platform";

// api
import { UpdateContacts, getChatSensitive } from "@/api/imBase";
import { GroupUpdate, groupOrUserDetail } from "@/api/imGroup";
import { updateMember, searchAliasContent } from "@/api/imChannel";
import buildTimeConfig from "../build-time.json";

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
      // const list = res.map((item) => {
      //   return item.id === commonInfo.loginId
      //     ? {
      //       ...item,
      //       sourceId: "",
      //       sessionId: "",
      //     }
      //     : item;
      // });
      let list = [...res];
      let index = list.findIndex((item) => item.id === commonInfo.loginId);
      // 如果通过 loginId 找不到，尝试通过 sourceId 查找（容错）
      if (index === -1) {
        try {
          const sourceId = remote.getCurrentWindow().getMediaSourceId();
          index = list.findIndex((item) => item.sourceId === sourceId);
        } catch (e) {
          console.error("Error sourceId findIndex:", e);
        }
      }
      if (index !== -1) {
        const item = list[index];
        list.splice(index, 1);
        list.push({
          ...item,
          sourceId: "",
          sessionId: "",
        });
      }

      // 清空公共信息
      commonInfo = {};

      Cache("login-account-list", args && args.isFix ? [] : list).then(() => {
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
      location.href = location.href.slice(
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
 * 群/好友/频道 免打扰 设置
 */
const fnDisturbSet = (info) => {
  const { id, type, bfDisturb, isDisturb } = info;
  const loginId = commonInfo.loginId;

  // 同步本地免打扰
  // 判断免打扰是否有更新，更新免打扰id列表
  eventCommon.fnDisturbInfoSync({
    id,
    type,
    bfDisturb: Boolean(bfDisturb),
    // 这里确保如果 isDisturb 明确存在，就以它为准。
    // ...type === 'channel' ? { isDisturb: Boolean(bfDisturb || isDisturb) } : {},
    ...type === 'channel' ? { isDisturb: isDisturb !== undefined ? Boolean(isDisturb) : Boolean(bfDisturb) } : {},
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
  } else if (type === "group") {
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
  } else if (type === "channel") {
    // 频道
    updateMember({
      channelId: id,
      isDisturb: isDisturb !== undefined ? isDisturb : bfDisturb,
    }).then(res => {
      if (res?.code === 200) {
        // 更新本地频道信息
        Cache(`${loginId}MessageChannelList`).then((channelList) => {
          let channelInfo = null;
          if (channelList && channelList.length) {
            channelInfo = channelList.find((item) => item.channelId == id);
            if (channelInfo) {
              channelInfo.bfDisturb = channelInfo.isDisturb = isDisturb !== undefined ? isDisturb : bfDisturb;
              // 更新频道信息
              Cache(`${loginId}MessageChannelList`, channelList);
            }
          }
        });
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
const fnDisturbInfoSync = ({ id, type, bfDisturb , isDisturb: isDisturbArg }) => {
  const idStr = id + type;

  // 当前是否为免打扰
  const isDisturb = disturbIdStrList.includes(idStr);

  const targetDisturb = isDisturbArg !== undefined ? isDisturbArg : bfDisturb;

  // 如果与要设置的不一致，则更改
  if (isDisturb != targetDisturb) {
    if (targetDisturb) {
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
  } else {
    // 这个函数实现有问题，切换过快，加减数不对称，导致无法关闭
    // 我不想改这个全局函数，所以这里强制关闭
    if (removeIds?.length && removeIds.includes('chatRightMenu')) {
      eventBase.fnCommunicationSendMsg({
        operator: "closeOperator",
        data: {
          ids: ['chatRightMenu'],
        },
      });
    }
  }
};

/**
 * 新的好友或群 存档（数据接口改变了）
 */
// const fnNewFriendOrGroup = (text) => {
//     searchAliasContent({
//         fromUid: commonInfo.loginId,
//         content: text,
//     }).then(async (res) => {
//         if (res?.code === 200) {
//           const { groupAlias, userDetail, channelInfo, searchType } = res.data;
//           // 好友
//           if (searchType == 0) {
//             eventBase.fnCommunicationSendMsg({
//               operator: "memberDialogShow",
//               data: {
//                 values: {
//                   id: Number(userDetail.uid),
//                   icon: userDetail.icon,
//                   nickName: userDetail.nickName,
//                 },
//               },
//             });
//           } else if (searchType == 1) {
//             // 群
//             eventBase.fnCommunicationSendMsg({
//               operator: "openGroupDialog",
//               data: {
//                   values: {
//                   id: Number(groupAlias.groupId),
//                   pic: groupAlias.pic,
//                   name: groupAlias.name,
//                   memberCount: Number(groupAlias.memberCount),
//                   addToken: groupAlias.addToken,
//                   groupAliasName: groupAlias.groupAliasName,
//                   hostId: Number(groupAlias.hostId),
//                   bfJoinFriend: groupAlias.bfJoinFriend,
//                   bfJoinCheck: groupAlias.bfJoinCheck,
//                   },
//               },
//             });
//           } else if (searchType == 2) {
//             // 频道
//             eventBase.fnCommunicationSendMsg({
//             operator: 'activeChange',
//             data: {
//                 ...channelInfo,
//                 id: channelInfo.channelId,
//                 name: channelInfo.channelName,
//                 pic: channelInfo.icon,
//                 type: 'channel',
//                 comType: 'chat',
//             },
//             });
//           }
//         } else {
//           window.$toast(res?.msg || i18n.t("抱歉，该用户/群似乎不存在"));
//         }
//     });
// };
/**
 * 新的好友或群
 */
const fnNewFriendOrGroup = (text) => {
  searchAliasContent({
    fromUid: commonInfo.loginId,
    content: text,
  }).then(async (res) => {
    if (res?.code === 200) {
      const { groupAlias, userDetail, channelInfo, searchType } = res.data;
      console.log('别名--', res.data)
      // searchType1 好友 0 群 2频道
      // 好友
      if (searchType == 1) {
        eventBase.fnCommunicationSendMsg({
          operator: "memberDialogShow",
          data: {
            values: {
              id: Number(userDetail.userInfoBaseResp.uid),
              icon: userDetail.userInfoBaseResp.icon,
              addToken: userDetail.addToken,
              nickName: userDetail.userInfoBaseResp.nickName,
            },
          },
        });
      } else if (searchType == 0) {
        // 群
        eventBase.fnCommunicationSendMsg({
          operator: "openGroupDialog",
          data: {
            values: {
              id: Number(groupAlias.groupBaseResp.groupId),
              pic: groupAlias.groupBaseResp.pic,
              name: groupAlias.groupBaseResp.name,
              memberCount: Number(groupAlias.groupBaseResp.memberCount),
              addToken: groupAlias.addToken,
              groupAliasName: groupAlias.groupBaseResp.groupAliasName,
              hostId: Number(groupAlias.groupBaseResp.hostId),
              bfJoinFriend: groupAlias.groupBaseResp.bfJoinFriend,
              bfJoinCheck: groupAlias.groupBaseResp.bfJoinCheck,
              remark: groupAlias.groupBaseResp.remark,
            },
          },
        });
      } else if (searchType == 2) {
        if (channelInfo && commonInfo.infoActive && commonInfo.infoActive.channelId === channelInfo.channelId) {
          window.$toast("您已在频道");
          return;
        }
        if (!channelInfo) {
          window.$toast("此频道已失效或过期");
        } else if (!channelInfo.linkType || channelInfo.memberType) {
          // 公开的频道链接或者已加入频道直接跳转窗口
          eventBase.fnCommunicationSendMsg({
            operator: 'activeChange',
            data: {
              ...channelInfo,
              id: channelInfo.channelId,
              name: channelInfo.channelName,
              pic: channelInfo.icon,
              type: 'channel',
              comType: 'chat',
            },
          });
        } else if (channelInfo) {
          // 私密频道打开加入窗口
          eventBase.fnCommunicationSendMsg({
            operator: "openChannelDialog",
            data: {
              values: channelInfo,
            },
          });
        }
      }
    } else {
      window.$toast(res?.msg || i18n.t("抱歉，该用户/群似乎不存在"));
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
const fnAtClick = async (text, currentGuoupId) => {
  // 登录id
  const loginId = commonInfo.loginId;

  // 判断是不是好友
  const friendList = (await Cache(`${loginId}-ContactList`)) || [];
  const memberValues = friendList.find(
    (item) => item.nickName === text || item.name === text
  );
  if (memberValues) {
    eventBase.fnCommunicationSendMsg({
      operator: "memberDialogShow",
      data: {
        values: memberValues,
      },
    });
    return;
  }

  // 判断是否是当前已有的群
  Cache(`${loginId}-GroupList`).then((res) => {
    if (res) {
      const groupInfo = (res || []).find((item) => item.groupAliasName === text);

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
  const version= "1.6.7"
  const appVer = version.replaceAll(".", "");
  const buildTime = (buildTimeConfig && buildTimeConfig.buildTime) || "";
  return {
    sessionId,
    appVer,
    version: `${version} ${buildTime}`,
    packageCode: 6000,
    language: languageIndex + 1, // 默认简体中文
    // plat: process.platform === "darwin" ? 3 : 4,
    plat: 4,
    sysModel: process.platform === "darwin" ? "MAC" : "WINDOWS",
  };
};

/////////////// 敏感词

let sensitiveWords = [];
let fakeSendSensitives = [];

/**
 * 敏感词初始化
 */
const fnSensitiveWordsInit = () => {
  getChatSensitive().then((res) => {
    // console.log('fnSensitiveWordsInit--', res)
    if (res && res.addSensitives) {
      sensitiveWords = res.addSensitives;
      fakeSendSensitives = res.fakeSendSensitives;
    }
  });
};

/**
 * 敏感词获取
 */
const fnSensitiveWordsGet = () => {
  return sensitiveWords;
};

const fnFakeSendSensitivesGet = () => {
  return fakeSendSensitives;
};

////////////// 动态域名
const domainsName = `domains_${getEnvType()}`
let domains = Local(domainsName) || {
  webBiz: "",
  webSession: "",
  domain: "",
  ossDefaultUrl: "",
};

const fnDomainsGet = () => {
  return domains || {};
}

const fnDomainsSet = (data) => {
  domains = data;
  Local(domainsName, data)
}

const fnDomainsAttribSet = ({ key, value }) => {
  domains[key] = value
  Local(domainsName, domains)
}

// 好友备注
let friendRemarks = [];
const fnFriendRemarksGet = () => {
  return friendRemarks || [];
}

const fnFriendRemarksSet = (data) => {
  friendRemarks = data || [];
}

let onlineInfo = {
  lastOfflineTime: 0, // 上一次离线的时间
  powerOnlineTime: 0, // 本次启动的时间(登录后)
}

const fnInitOnlineInfo = async () => {
  const loginId = commonInfo.loginId;
  const timestamp = Date.now();
  onlineInfo.powerOnlineTime = timestamp;
  const time = await Cache(`${loginId}-last-online-time`);
  console.log('fnInitOnlineInfo--', time)
  onlineInfo.lastOfflineTime = time || 0;

  clearInterval(window.timerRecordOnlinetime);
  window.timerRecordOnlinetime = setInterval(() => {
    fnRecordOnlinetime()
  }, 1000)
}

const fnOnlineInfoGet = (data) => {
  return onlineInfo || {};
}

// 记录本次在线时间
const fnRecordOnlinetime = () => {
  const loginId = commonInfo.loginId;
  if (!loginId) {
    clearInterval(window.timerRecordOnlinetime);
    return;
  };
  const timestamp = Date.now();
  // console.log('fnRecordOnlinetime--',loginId, timestamp)
  Cache(`${loginId}-last-online-time`, timestamp);
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
  fnFriendRemarksGet,
  fnFriendRemarksSet,
  fnInitOnlineInfo,
  fnOnlineInfoGet,
  fnFakeSendSensitivesGet,
};
