import { ipcRenderer, shell } from "@/platform";

// 事件
import eventCheduledCeletion from "./cheduled-deletion";
import eventMsg from "./msg";
import eventCommon from "./common";
import eventChat from "./chat";
import eventFriend from "./friend";
import eventGroup from "./group";

const fnHint = (idStr) => {
    const isExist = eventCommon.fnDisturbIdStrListRU({
        idStrIsExist: idStr,
    });

    if (!isExist) {
        ipcRenderer.send("messageblur");

        const { deviceConfig } = eventCommon.fnConfigRU();
        if (deviceConfig.isNewMessageAlertTone) {
            shell.beep();
        }
    }
};

/**
 * 消息添加到数据库
 */
const fnMsgAddToDB = (data, friendId) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const id = data.channelId || data.groupId || friendId;
    let tableType = "message";
    if(Boolean(data.groupId)) {
        tableType = "groupMessage";
    } else if(Boolean(data.channelId)) {
        tableType = "channelMessage";
    }
    const tableName = `${loginId}-${tableType}.man${id}`;
    if (id) {
        window.$db.addDB(tableName, data);
    }
};

//////////////////////// 通讯
const mgsGetFns = {};

/**
 * 通讯 监听
 */
const fnCommunicationMonitoring = (type, eventIdList, runEvent) => {
    if (!eventIdList) {
        delete mgsGetFns[type];
        return;
    }

    mgsGetFns[type] = {
        eventIdList,
        runEvent,
    };
};

/**
 * 通讯 发消息
 */
const fnCommunicationSendMsg = (params, noProcessing) => {
    if (mgsGetFns) {
        // 如果需要进行处理
        if (!noProcessing) {
            // 处理后是否停止信息传递
            if (!fnCommunicationProcessing(params)) {
                return;
            }
        }

        // 只发送给有注册处理的控件
        for (const key of Object.keys(mgsGetFns)) {
            const eventsObj = mgsGetFns[key];
            if (eventsObj) {
                if (eventsObj.eventIdList.includes(params.operator)) {
                    eventsObj.runEvent(
                        params.data,
                        params.operator,
                        params.operatorType
                    );
                }
            }
        }
    }
};

/**
 * 通讯 本地处理
 * 返回 是否继续信息传递
 */
const fnCommunicationProcessing = (values) => {
    const { data, operator, operatorType } = values;
    switch (operator) {
        case "clearAll": {
            // 全部清除 需要清除所有的本地文件 [当前文件存储设计有问题，没有分账户存储，后面再处理]
            break;
        }
        case "friendUpdate": {
            // 好友的更新，窗口的更新 暂时放列表

            // 更新阅后即焚
            eventCheduledCeletion.fnFriendMsgConfigRUD(
                data.bfReadCancel
                    ? {
                          key: Number(data.id),
                          value: data.msgCancelTime,
                      }
                    : {
                          deleteId: Number(data.id),
                      }
            );
            break;
        }
        case "groupUpdate": {
            // 好友的更新，窗口的更新 暂时放列表
            break;
        }
        case "msgDelete": {
            // 消息删除 如果清空了可以继续执行，但如果是删除消息，则需要确认聊天窗是否要改变
            eventMsg.fnMsgDelete({
                info: data,
                operator,
                operatorType,
            });

            return false;
        }
        case "msgReadByMe": {
            // 我已读消息
            eventMsg.fnMsgReadByMe(data);

            // 全部已读 可以不进行阻塞
            return !data.time;
        }
        case "msgSend": {
            // 消息发送
            eventMsg.fnMsgSend(data);
            return false;
        }
        case "msgResend": {
            eventMsg.fnMsgSend(data, true);
            return false;
        }
        case "groupNotification": {
            // 删除群 删除对应聊天窗 在列表中进行
            // console.log({ values });
            // operatorType === "exit"
            break;
        }
        case "archiveUpdate": {
            // 归档更新
            eventChat.fnArchiveInfoUpdate();
            return false;
        }
        case "archiveChange": {
            // 归档改变
            eventChat.fnArchiveInfoChange(data, operatorType);
            return false;
        }
        case "friendRemarkUpdate": {
            // 好友备注修改
            eventFriend.fnRemarkUpdate(data, operatorType);
            break;
        }
        case "msgNew": {
            if (data.chatType < 50) {
                // 新消息 设置未读
                eventMsg.fnMsgNewAdd(data);
                return false;
            }
            break;
        }
        case "msgListPropertyUpdate": {
            // 如果修改消息列表的属性 是修改骰子，则同步数据库，并延迟一秒再发送【旋转1秒】
            if (operatorType === "dice") {
                eventMsg.fnMsgDiceResultSet(data);
                return false;
            }
            break;
        }
        case "rcheduleDeletionSet": {
            // 阅后即焚设置
            eventCheduledCeletion.fnRcheduleDeletionSet(data);
            // 不要直接处理，会有推送，直接走推送来的流程
            return false;
        }
        case "bfTopSet": {
            // 置顶/取消 置顶 设置
            // 置顶不走接口，暂时在聊天窗口列表处理就好
            break;
        }
        case "bfDisturbSet": {
            // 免打扰 设置
            eventCommon.fnDisturbSet(data);
            break;
        }
        case "bfAddressSet": {
            // 群 是否保存到通讯录 设置
            eventGroup.fnAddressSet(data);
            break;
        }
        case "bfJoinCheckSet": {
            // 群 进群是否需要审核 设置
            eventGroup.bfJoinCheckSet(data);
            break;
        }
        case "bfJoinFriendSet": {
            // 群 是否能添加好友 设置
            eventGroup.bfJoinFriendSet(data);
            break;
        }
        case "groupNoticeSet": {
            // 群 公告 设置
            eventGroup.fnNoticeSet(data);
            break;
        }
        case "openDialogNewFriendOrGroup": {
            // 打开 新的好友或群 的对话框
            eventCommon.fnNewFriendOrGroup(data.text);
            return false;
        }
        case "groupQrCodeImageForward": {
            // 群二维码图片转发，添加 转发对话框
            eventCommon.fnCloseListRU({
                addId: "forwardSelectDialog",
            });
            break;
        }
        case "uploadFilesSet": {
            // 上传文件设置，添加 文件对话框
            eventCommon.fnCloseListRU({
                addId: "fileDialog",
            });
            break;
        }
        case "forwardInfoAdd": {
            // 添加转发信息，移除 转发选择对话框
            eventCommon.fnCloseListRU({
                addId: "forwardInfoDialog",
                removeIds: ["forwardSelectDialog"],
            });
            break;
        }
        case "openGroupNoticeDialog": {
            // 打开 群公告对话框
            eventCommon.fnCloseListRU({
                addId: "groupNoticeDialog",
            });
            break;
        }
        case "openChannelNoticeDialog": {
            // 添加 频道简介对话框
            eventCommon.fnCloseListRU({
                addId: "channelNoticeDialog",
            });
            break;
        }
        case "memberDialogShow": {
            // 添加 好友对话框
            eventCommon.fnCloseListRU({
                addId: "memberDialog",
            });
            break;
        }
        case "openGroupDialog": {
            // 添加 群对话框
            eventCommon.fnCloseListRU({
                addId: "groupDialog",
            });
            break;
        }
        case "network": {
            // 网络改变记录
            eventCommon.fnNetworkStatusTypeRU(data.networkStatusType);
            break;
        }
        case "atClick": {
            // 点击at
            eventCommon.fnAtClick(data.text, data.groupId);
            return false;
        }
        default:
    }

    // 继续信息传递
    return true;
};

export default {
    fnHint,
    fnMsgAddToDB,
    fnCommunicationMonitoring,
    fnCommunicationSendMsg,
};
