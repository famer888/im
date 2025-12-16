import { ipcRenderer } from "@/platform";
import packet from "@/api/base/imweb-web";
import channelEvents from "@/api/base/channel_event";
import { decrypt } from "@/socket/api/request";
import { ReceiveServerToClient } from "@/socket/api/message";
import { fnUpdateKeyFriend } from "@/utils/encryption-decryption";
import { Cache } from "@/cache";

// 事件
import eventBase from "./base";
import eventMsg from "./msg";
import eventFriend from "./friend";
import eventGroup from "./group";
import eventChannel from "./channel";
import eventCheduledCeletion from "./cheduled-deletion";
import eventCommon from "@/event/common";

// 消息缓冲队列
let messageQueue = [];
// 队列处理状态
let isProcessingQueue = false;

// 需要限流的消息类型（主要涉及大量UI渲染的消息）
// 20102: 私聊消息, 20202: 群聊消息, 4203: 频道消息
// 20402: 群请求处理消息
// 20103/20203/4205: 撤回消息 (必须与消息保持同队列，防止撤回指令先于消息执行)
// 20104/20403/4206: 消息回执 (高频触发)
// 20601: 用户上下线 (大群/好友多时可能瞬间爆发)
// 20701: 群事件通知 (如成员变动)
const throttledCodes = new Set([
  20102, 20202, 4203, 20402,
  20103, 20203, 4205,
  20104, 20403, 4206,
  20601, 20701
]);

/**
 * 批量消费消息队列 (Time Slicing / 时间分片模式)
 */
const processMessageQueue = () => {
  if (isProcessingQueue) return;
  if (messageQueue.length === 0) return;

  isProcessingQueue = true;

  const consume = () => {
    if (messageQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    // 根据页面可见性动态调整处理逻辑
    const isHidden = document.hidden;

    // 1. 如果页面不可见（后台运行），无需考虑渲染帧率
    //    直接使用 setTimeout 宏任务，并分配更大的时间片（50ms），以最高效消化积压消息
    // 2. 如果页面可见，使用 requestAnimationFrame 对齐渲染帧
    //    时间片设为 6ms，为 120Hz 高刷屏 (一帧约 8.3ms) 预留充足的渲染时间 (约 2.3ms + 浏览器开销)
    //    对于 60Hz 屏幕 (一帧 16.6ms) 
    const TIME_BUDGET = isHidden ? 50 : 6;
    const startTime = performance.now();

    while (messageQueue.length > 0) {
      const buffer = messageQueue.shift();
      try {
        fnSocketMessage(buffer);
      } catch (e) {
        console.error("消息处理异常:", e);
      }

      // 检查当前帧/时间片是否耗尽
      if (performance.now() - startTime >= TIME_BUDGET) {
        // 调度下一次任务
        if (isHidden) {
          setTimeout(consume, 0); // 后台极速处理
        } else if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(consume); // 前台对齐渲染
        } else {
          setTimeout(consume, 16); // 降级兼容
        }
        return;
      }
    }

    // 循环结束，队列已空
    isProcessingQueue = false;
  };

  if (document.hidden) {
    setTimeout(consume, 0);
  } else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(consume);
  } else {
    setTimeout(consume, 0);
  }
};

/**
 * 接收到websocket的消息
 */
export function eventWsReceivedMsg(arrayBuffer) {
  // 如果数据包长度不足4字节（无法读取头部），直接丢弃，防止后续崩溃
  if (!arrayBuffer || arrayBuffer.byteLength < 4) {
    console.warn("收到非法Websocket消息: 长度不足");
    return;
  }

  // 预解析消息类型
  let code = 0;
  try {
    // 直接在原 buffer 上读取，避免 slice 产生临时对象
    code = new DataView(arrayBuffer).getUint16(2);
  } catch (e) {
    console.error("解析消息类型失败:", e);
    return;
  }

  if (throttledCodes.has(code)) {
    // 加入队列
    messageQueue.push(arrayBuffer);
    // 触发批量消费
    processMessageQueue();
  } else {
    // 先级消息（如发送回执、登录响应、状态变更等）
    // 直接处理，无需排队，解决"发消息要等接收队列处理完"的问题
    setTimeout(() => {
      try {
        fnSocketMessage(arrayBuffer);
      } catch (e) {
        console.error("处理高优先级消息异常:", e);
      }
    }, 0);
  }
}

const packetStr = {
  20001: "LoginResp", // 登录
  20102: "PushOneToOneMessageResp", // 私聊消息接收
  20202: "PushGroupMessageResp", // 群聊消息接收(自己/其他人)
  20103: "PushRecallOneToOneMessageResp", // 私聊消息删除
  20201: "SendGroupMessageResp", //群聊消息发送
  20203: "PushRecallGroupMessageResp", // 群聊消息删除
  20101: "OneToOneMessageResp", // 消息发送成功
  20104: "PushReceiptMessageResp", // 消息发送同步
  20301: "PushFriendRecordMessageResp", //添加好友通知
  20302: "PushFriendReqNumResp", //好友申请
  20401: "PushGroupReqNumResp", // 推送群请求
  20402: "PushGroupReqMessageResp", // 推送群请求与处理消息
  20501: "PushKeyPairChangeMessageResp",
  29999: "ErrrMessageResp", // 消息报错
  20601: "PushUserOnOrOffLineMessageResp", // 推送用户上下线
  20701: "PushGroupEventMessage",
  20403: "PushGroupMsgReceiptMessage",
  4203: "PushChannelMessage", // 频道消息接收
  4205: "PushRecallChannelMessage", // 频道消息撤回/删除
  4201: "PushSendChannelMessageSuccessMessage", // 频道消息发送成功
  4204: "PushChannelEventMessage", // 频道身份变更
  4206: "PushReadChannelMessage", // 频道已读
};

/**
 * 处理收到的消息
 */
const fnSocketMessage = (arrayBuffer) => {
  // 防止非法调用导致崩溃
  if (!arrayBuffer || arrayBuffer.byteLength < 4) {
    return;
  }

  const code = new DataView(arrayBuffer).getUint16(2);
  // 避免 slice 产生临时对象，Buffer.from 支持 offset 和 length
  // 确保 buffer 长度足够
  const buffer = arrayBuffer.byteLength >= 16
    ? Buffer.from(arrayBuffer, 16)
    : Buffer.alloc(0);
  const method = packetStr[code];

  // 退出登录
  if (code === 20002) {
    console.log("20002-1--")
    ipcRenderer.send("auto-export-db", {});
  }

  if (![29901, 20001].includes(code)) {
    console.log('收到推送--', code);
  }

  // 推送敏感词更新事件及内容消息
  if (code == 30001) {
    // 敏感词初始化
    eventCommon.fnSensitiveWordsInit();
    return;
  }

  // 归档发生变化
  if (code === 20603) {
    eventBase.fnCommunicationSendMsg({
      operator: "archiveUpdate",
    });
    return;
  }

  /**
   * 如果不存在就不能解析
   */
  if (!method) {
    return;
  }

  const data = method
    ? packet[method].decode(new Uint8Array(decrypt(buffer)))
    : "";

  try {
    // 直接读取，避免 slice 产生临时对象
    // 确保 buffer 长度足够：header(2) + code(2) + len(4) + id(8) = 16 字节
    // getBigUint64(8) 读取的是第 8-15 字节，所以总长度至少需要 16
    if (arrayBuffer.byteLength >= 16) {
      const id = parseInt(new DataView(arrayBuffer).getBigUint64(8));
      if (id != 0) {
        data.id = id;
      }
    }
  } catch (error) {
    //
  }

  console.log({ data });

  // 确认接收
  if (code !== 20701) {
    ReceiveServerToClient(data.id);
  }

  switch (code) {
    case 20001: {
      // 登录成功 接口已对应处理，所以这个推送不需要处理
      break;
    }
    // 频道消息接收
    case 4203: {
      if (data.latestChannelMessage) {
        eventMsg.fnChannelMsgAdd(data.latestChannelMessage);
      }
      break;
    }
    // 频道消息撤回/删除
    case 4205: {
      // 远程其它端操作清除全部，clear为1，表示全部清除
      const { msgId, msgTargetId, clear, clearTime } = data?.latestRecallChannelMessage || {};
      //  console.log('4205-2-', JSON.stringify(data))
      const state = eventChannel.isValidSocketMsg(Number(clearTime || 0))
      if (!state) {
        console.log('阻止了条重复推送[4205]', JSON.stringify(data))
        return;
      };
      if (!msgTargetId) return;
      let isClear = Boolean(clear);
      // 频道消息删除
      eventMsg.fnMsgDelete({
        info: {
          id: Number(msgTargetId),
          type: "channel",
          msgId: Number(msgId),
          idsDelete: isClear
            ? []
            : [{ msgId: Number(msgId) }],
          isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
        },
      });
      break;
    }
    // 好友消息接收
    case 20102: {
      if (data.oneToOneMessage) {
        eventMsg.fnFriendMsgAdd(data.oneToOneMessage, data.id);
      }
      break;
    }
    case 20202: {
      // 群聊消息接收(自己/其他人)
      for (const item of data.groupMsg) {
        eventMsg.fnGroupMsgAdd(item);
      }
      break;
    }
    case 20101: {
      // 好友 消息发送成功
      eventMsg.fnMsgSendSuccess(data, "friend", code);
      break;
    }
    case 20201: {
      // 群组 消息发送成功
      eventMsg.fnMsgSendSuccess(data, "group", code);
      break;
    }
    case 4201: {
      // 频道 消息发送成功
      eventMsg.fnMsgSendSuccess(data, "channel", code);
      break;
    }
    case 20103: {
      // 私聊消息删除
      // 远程其它端操作清除全部，clear为1，表示全部清除
      const recallMsg = data.recallOneToOneMessages?.[0];
      if (!recallMsg) break;

      let isClear = recallMsg.clear;
      eventMsg.fnMsgDelete({
        info: {
          id: Number(recallMsg.msgTargetId),
          type: "friend",
          msgId: Number(recallMsg.msgId),
          idsDelete: isClear
            ? []
            : data.recallOneToOneMessages.map((item) => {
              return { msgId: Number(item.msgId) };
            }),
          isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
        },
      });
      break;
    }
    case 20203: {
      // 远程其它端操作清除全部，clear为1，表示全部清除
      const recallMsg = data.recallGroupMessages?.[0];
      if (!recallMsg) break;

      let isClear = recallMsg.clear;
      // 群聊消息删除
      eventMsg.fnMsgDelete({
        info: {
          id: Number(recallMsg.msgTargetId),
          type: "group",
          msgId: Number(recallMsg.msgId),
          idsDelete: isClear
            ? []
            : data.recallGroupMessages.map((item) => {
              return { msgId: Number(item.msgId) };
            }),
          isOtherPlatformOperate: true, // 这个字段表示远程其它端操作删除，本地同步删除
        },
      });
      break;
    }
    case 20104: {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      if (Number(data?.receipts?.[0]?.targetId || 0) === loginId) {
        eventMsg.fnMsgFriendRead(data);
      }
      break;
    }
    case 20301: {
      if (
        data.friendRecordmsg?.[0]?.doType === 5
      ) {
        // 好友删除
        const id = Number(
          data.friendRecordmsg?.[0]?.targetUid || 0
        );
        if (id) {
          eventBase.fnCommunicationSendMsg({
            operator: "deleteFriend",
            data: { id },
          });
        }
      } else {
        // 好友信息变更
        eventFriend.fnFriendCU(data);
      }

      break;
    }
    case 20302: {
      // 好友申请
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      const { friendReqNum = 0 } = data || {};
      console.log('friendReqNum--', friendReqNum)
      const total = Number(friendReqNum);
      Cache(`${loginId}-newFriendReqTotal`, { total })
      eventBase.fnCommunicationSendMsg({
        operator: "updateNewFriendReqTotal",
        data: {
          total,
        }
      });
      eventBase.fnCommunicationSendMsg({ operator: "newFriendReq" });

      break;
    }
    case 20501: {
      // 更新好友密钥
      fnUpdateKeyFriend(data);
      break;
    }
    case 20701: {
      eventGroup.fnRnGroupEvent(data);
      break;
    }
    case 29999: {
      // 退出登录
      let { commonResult } = data || {};
      const errCode = commonResult?.errCode;
      if (errCode == 100) {
        // 登出前要先导出
        ipcRenderer.send("auto-export-db", {});
        eventCommon.fnLoginout();
      } else if ([1022, 1021].includes(errCode)) {
        // 群被禁用，被禁言 信息发送失败,更新信息状态和添加提示
        eventMsg.fnMsgSendFail({ id: Number(data.targetId), type: 'group', customMsgId: String(Number(data.flag)) });
        eventGroup.groupEventHandleMsg(data);
      } else if (errCode == 5113) {
        eventFriend.fnHandTipAddFriend(data)
      } else if (errCode == 5114) {
        eventFriend.fnFriendAddMsgTip('消息已发出，但对方绝收', data);
      }
      break;
    }
    case 20403: {
      // 群消息已读用户
      const { receiptMessage = [] } = data || {};
      eventMsg.fnGroupMsgReadRecord(receiptMessage)
      break;
    }
    case 4204: {
      const { latestChannelEventMessage = {} } = data || {};
      eventChannel.handleChannelEvents(latestChannelEventMessage);
      break;
    }
    case 4206: {
      const { msgTime } = data.latestChannelEventMessage || {};
      const state = eventChannel.isValidSocketMsg(Number(msgTime || 0))
      if (!state) {
        // console.log('阻止了条重复推送[4206]', data)
        return;
      };
      eventMsg.fnChannelMsgReadUpdate(data.channelId, data.readChannelMessages)
      break;
    }

    default:
  }
};


//////////////////  定时执行

let timerRunEvent = null;

export const intervalRunEvent = () => {
  if (timerRunEvent) {
    clearInterval(timerRunEvent);
  }

  timerRunEvent = setInterval(() => {
    eventCheduledCeletion.fnCheduledDeletionMsgDelete();
    eventGroup.fnTimer();
    eventMsg.fnMsgSendTimeout();
    eventMsg.fnGroupMsgReadUpdate();
  }, 200);
};

export const intervalRunEventClear = () => {
  if (timerRunEvent) {
    clearInterval(timerRunEvent);
  }
};
