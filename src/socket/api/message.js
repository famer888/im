import {
    OneToOneMessageReq,
    SendGroupMessageReq,
    SendChannelMessage,
    SendRecallOneToOneMessageReq,
    SendRecallGroupMessageReq,
    SendReceiptMessageReq,
    SendRecallChannelMessage,
    ReceiveServerToClientReq,
    ReceiveKeyPairMessageReq,
    ReceiveGroupEventReceiptMessage,
    SendReadChannelMessage,
} from "@/api/base/imweb-web";

import { initHeader } from "./request";
import { webSocketSend } from "@/socket";
import { FairGuard } from "@/api/base/unit";
/**
 * 用户发送私聊消息
 * uint32  UserID = 1;                                    // 发送用户ID
 * uint32  ClientType = 2;                                // 发送端类型
 * uint32  ToUserID = 3;                                  // 接受用户ID
 * uint32  FriendType = 4;                                // 好友类型: 0 -- 不区分类型 1 -- 上级好友  2 -- 下级好友 3 -- 普通好友 4 -- 临时私聊
 * uint32  ChatType = 5;                                  // 聊天类型: 0--文字+表情, 1 -- 图片, 2 -- 文件, 3 -- 语音  4 -- 图文混合  5 -- 撤回 6 -- 删除 7 系统  8 -- 红包 20 -- 视频  21 -- GIF 22 -- 回复/引用(content:增加字段{quote:msgid}) 23 -- 消息转发
 * string  Content = 6;
 */
export function CReqChatSendPrivate(data, flag) {
    const message = OneToOneMessageReq.create({
        oneToOneMessage: data,
        flag,
    });
    const buffer = OneToOneMessageReq.encode(message).finish();
    const rb = initHeader(buffer, 10101, flag);
    console.log("发出推送-10101-")
    webSocketSend(rb);
}

export function ReceiveServerToClient(id) {
    if (!id) return;
    const message = ReceiveServerToClientReq.create({ ids: [parseInt(id)] });
    const buffer = ReceiveServerToClientReq.encode(message).finish();
    const rb = initHeader(buffer, 19902);
    console.log("发出推送-19902-")
    webSocketSend(rb);
}

export function receiveGroupEvent(value) {
    const message = ReceiveGroupEventReceiptMessage.create(value);
    const buffer = ReceiveGroupEventReceiptMessage.encode(message).finish();
    const rb = initHeader(buffer, 10210);
    console.log("发出推送-10210-")
    webSocketSend(rb);
}

export function ReceiveKeyPairMessage(data) {
    if (!data.version) return;
    const message = ReceiveKeyPairMessageReq.create(data);
    const buffer = ReceiveKeyPairMessageReq.encode(message).finish();
    const rb = initHeader(buffer, 10501);
    console.log("发出推送-10501-")
    webSocketSend(rb);
}

/**
 * 消息回执
 * int64 msgId = 1; // 消息ID
 * ChatMessageType type = 2 ; // 聊天消息类型  0 私  1群
 * int64 sendUid = 3; // 发送者UID
 * int64 groupId = 4; // 群ID(群聊消息才会值)
 * MsgReceiptStatusBase receiptStatus = 5;  0 送达  1查看  // 回执状态
 * MessageType messageType = 6; // 消息类型
 * int32 snapchatTime = 7; //消息设置的阅后即焚时间
 * int32 duration = 8; //音频 视频的时长
 * int64 targetId = 9; //目标id
 * MessageSource   source   = 10; //消息来源 v1.6.2
 */
export function CReqMessageReceipt(receipts) {
    // console.log('[回执]开始', receipts);
    // console.log('[debug] CReqMessageReceipt--', receipts);
    const message = SendReceiptMessageReq.create({ receipts });
    // console.log('[回执]消息体构建SendReceiptMessageReq.create({ receipts })', message);
    const buffer = SendReceiptMessageReq.encode(message).finish();
    // console.log('[回执]消息content编码SendReceiptMessageReq.encode(message).finish()', buffer);
    const rb = initHeader(buffer, 10106);
    // console.log('[回执]添加头部后', rb);
    console.log("发出推送-10106-")
    webSocketSend(rb);
    // console.log('[回执]发送完成');
}

// 频道消息已读
export function CReqChannelMessageReceipt(channelId, msgId) {
    const message = SendReadChannelMessage.create({channelId, msgId});
    const buffer = SendReadChannelMessage.encode(message).finish();
    const rb = initHeader(buffer, 4103);
    console.log("发出推送-4103-")
    webSocketSend(rb);
}

/**
 * 发送频道消息
 * @param {*} data
 * @param {*} flag
 */
export function CReqSendChatChannel(data, flag) {
    if (data.atUids && data.atUids.length && data.atUids[0] == undefined) {
        data.atUids = [];
    }
    //    console.log('CReqSendChatChannel-1-',data, flag)
    const message = SendChannelMessage.create({ channelMessage: data, flag });
    // console.log('CReqSendChatChannel-2-',message)
    const buffer = SendChannelMessage.encode(message).finish();
        // console.log('CReqSendChatChannel-3-',buffer)
    const rb = initHeader(buffer, 4101, flag);
            // console.log('CReqSendChatChannel-4-',rb)
    console.log("发出推送-4101-")
    webSocketSend(rb);
}

/**
 * 用户发送群聊消息
 * uint32  UserID = 1;                                      // 发送用户ID
 * uint32  ClientType = 2;                                  // 发送端类型
 * uint32  GroupType = 3;                                   // 群组类型 写死为1
 * uint32  GroupID = 4;                                     // 群组ID
 * repeated StAtUserInfo  AtUsers = 5;                      // 被at的用户ID列表
 * uint32  AtType = 6;                                      // @类型类型 0--没有\@用户, 1 -- 有\@用户, 3 -- \@所有用户
 * uint32  ChatType = 7;                                    // 聊天类型: 0--文字+表情, 1 -- 图片, 2 -- 文件, 3 -- 语音  4 -- 图文混合  5 -- 撤回 6 -- 删除 7 系统  8 -- 红包 9 -- 只能个人看到的信息  20 -- 视频   21 -- GIF 22 -- 回复/引用(content:增加字段{quote:msgid})
 * uint32  ManagerID = 8;                                   // 发送用户是否是管理员
 * string  Content = 9;                                     // 聊天内容
 */
export function CReqSendChatGroup(data, flag) {
    if (data.atUids && data.atUids.length && data.atUids[0] == undefined) {
        data.atUids = [];
    }
    // console.log('CReqSendChatGroup--', data, flag)
    const message = SendGroupMessageReq.create({ groupMsg: data, flag });
    const buffer = SendGroupMessageReq.encode(message).finish();
    const rb = initHeader(buffer, 10201, flag);
    console.log("发出推送-10201-")
    webSocketSend(rb);
}

/**
 * 删除消息
 * int64   msgId   = 1; // 消息ID 当为 clear为0 或者 channelName 不为空时， msgID 设置为-1
 * int64   msgTargetId = 2; // 群ID、接收者ID、发送者ID
 * string  channelName    = 3; // 流媒体
 * int32   clear          = 4; // 0: 默认删单条消息 1： 清空所有消息 2： 清空所有消息和会话记录
 * int64   maxId          = 5; // 当前最大id
 * int64   clearTime      = 6; // 清空时间
 */
export function CReqRemoveMessage(data) {
    const { isGroup, type } = data;
    const params = {};
    let msg = 10105;
    let method = SendRecallOneToOneMessageReq;
    // 群消息撤回
    if (type === "group") {
        method = SendRecallGroupMessageReq;
        msg = 10205;
        params.recallGroupMessage = data;
    } else if(type === "channel") {
        method = SendRecallChannelMessage;
        msg = 4102;
        params.recallChannelMessage = data;
    } else {
        params.recallOneToOneMessage = data;
    }
    const message = method.create(params);
    const buffer = method.encode(message).finish();
    const rb = initHeader(buffer, msg);
    console.log('CReqRemoveMessage--', msg)
    webSocketSend(rb);
}
