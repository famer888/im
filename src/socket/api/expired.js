
// 所有解密后数据流经这里
// 目前只拦截所有频道消息，判断是否过期，如果过期则累积消息，
// stack: Map<id | groupId | channelId, message[]>
// add: 每次add对message[]根据.sendTime排序
// ticker: 三秒一次匹对，对stack中lastMessage进行判断，如果是退出或离开，则delete(id)，如果不是则slice(离开，最新)，然后遍历dispatch
export default class Expired {
  dispatch = () => null;
  constructor(dispatch) {
    this.dispatch = dispatch;
  }
  stack = new Map(); // Map<id, { messages: [], expiredTime }>
  inititalTime = +new Date();
  interval = setInterval(this.ticker.bind(this), 1000);
  expiredDelay = 3000; // 3秒后过期
  // 频道相关的code
  channelCodes = [4203, 4205, 4201, 4204, 4206];
  // 群聊相关的code（预留）
  // groupCodes = [];
  // 退出或离开的事件类型
  channelExitEventTypes = [2, 3, 4, 5]; // 退出、被踢、解散等

  ticker() {
    const now = Date.now();
    for (const [id, item] of this.stack) {
      if (item.messages.length === 0) {
        this.stack.delete(id);
        continue;
      }
      // 计算时间offset，检查是否到达expiredTime
      if (now < item.expiredTime) {
        continue;
      }
      // 频道消息处理
      if (this.channelCodes.includes(item.messages[0].code)) {
        this.channelTicker(id, item);
        continue;
      }
      // 群聊消息处理（预留）
      // if (this.groupCodes.includes(item.messages[0].code)) {
      //   this.groupTicker(id, item);
      //   continue;
      // }
    }
  }

  // 频道消息ticker处理
  channelTicker(channelId, item) {
    const lastMessage = item.messages[item.messages.length - 1];
    // 判断lastMessage是否是退出或离开事件
    const lastEventType = lastMessage.data?.latestChannelEventMessage?.eventType;
    if (this.channelExitEventTypes.includes(lastEventType)) {
      console.log('[Expired]频道已解散，所有事件删除', Number(channelId));
      this.stack.delete(channelId);
      return;
    }
    // 找到最后一个离开事件的位置
    let sliceIndex = 0;
    for (let i = item.messages.length - 1; i >= 0; i--) {
      const eventType = item.messages[i].data?.latestChannelEventMessage?.eventType;
      if (this.channelExitEventTypes.includes(eventType)) {
        sliceIndex = i + 1;
        break;
      }
    }
    // slice(离开，最新)，遍历dispatch
    const messagesToDispatch = item.messages.slice(sliceIndex);
    for (const msg of messagesToDispatch) {
      this.dispatch(msg.code, msg.data);
    }
    this.stack.delete(channelId);
  }

  // 群聊消息ticker处理（预留）
  // groupTicker(groupId, item) {}

  // 频道消息add处理
  channelAdd(channelId, code, data) {
    if (!this.stack.has(channelId)) {
      this.stack.set(channelId, { messages: [], expiredTime: 0 });
    }
    const item = this.stack.get(channelId);
    const sendTime = data?.latestChannelMessage?.sendTime ||
                     data?.latestChannelEventMessage?.msgTime ||
                     data?.clearTime ||
                     Date.now();
    item.messages.push({ code, data, sendTime });
    // 根据sendTime排序
    item.messages.sort((a, b) => a.sendTime - b.sendTime);
    // 更新expiredTime
    item.expiredTime = Date.now() + this.expiredDelay;
  }

  // 群聊消息add处理（预留）
  // groupAdd(groupId, code, data) {}

  // 获取频道ID
  channelGetId(code, data) {
    switch (code) {
      case 4203:
        return data?.latestChannelMessage?.channelId;
      case 4205:
        return data?.latestRecallChannelMessage?.msgTargetId;
      case 4201:
        return data?.channelId;
      case 4204:
        return data?.latestChannelEventMessage?.channelId;
      case 4206:
        return data?.channelId;
      default:
        return null;
    }
  }

  // 获取群聊ID（预留）
  // groupGetId(code, data) {}

  // 频道消息check处理
  channelCheck(code, data) {
    if (!this.channelCodes.includes(code)) {
      return true;
    }
    const channelId = this.channelGetId(code, data);
    if (!channelId) {
      return true;
    }
    // 频道消息累积到stack
    this.channelAdd(channelId, code, data);
    return false;
  }

  // 群聊消息check处理（预留）
  // groupCheck(code, data) {}

  check(code, data) {
    // 频道消息处理
    if (this.channelCodes.includes(code)) {
      return this.channelCheck(code, data);
    }
    // 群聊消息处理（预留）
    // if (this.groupCodes.includes(code)) {
    //   return this.groupCheck(code, data);
    // }
    // 其他消息直接通过
    return true;
  }

  checkIdle() {
    return this.stack.size === 0;
  }
}

