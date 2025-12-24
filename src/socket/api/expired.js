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

  /**
   * 【频道退出/解散判定标准说明】
   * 参考：src/event/channel.js 中 handleChannelEvents 函数的处理逻辑
   *
   * 数据结构：latestChannelEventMessage = { eventType, subscriberInfo, channelInfo, ... }
   *
   * 1. 退出/被踢出频道：
   *    - eventType === 2 (频道订阅变更事件)
   *    - subscriberInfo.operateType === 2 (退出/被移除)
   *
   * 2. 频道解散：
   *    - channelInfo.operateType === 4
   *
   * 3. 频道注销：
   *    - channelInfo.operateType === 7
   *
   * subscriberInfo.operateType 取值：
   *    - 0: 频道订阅者加入事件 (SUBSCRIBER_JOIN)
   *    - 1: 订阅者权限变更
   *    - 2: 退出/被移除频道
   *
   * channelInfo.operateType 取值：
   *    - 1: 修改频道名
   *    - 2: 修改频道头像
   *    - 4: 频道解散
   *    - 5: 频道启用
   *    - 6: 频道禁用
   *    - 7: 注销频道
   */

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

  /**
   * 判断消息是否是频道退出/解散事件
   * @param {Object} msg - 消息对象 { code, data, sendTime }
   * @returns {boolean} 是否是退出/解散事件
   */
  isChannelExitEvent(msg) {
    const eventData = msg.data?.latestChannelEventMessage;
    if (!eventData) return false;

    const { eventType, subscriberInfo, channelInfo } = eventData;

    // 【排查点1】退出/被踢出频道判定：eventType === 2 且 subscriberInfo.operateType === 2
    const isSubscriberExit = eventType === 2 && subscriberInfo?.operateType === 2;
    if (isSubscriberExit) {
      // console.log('[Expired][排查] 命中退出/被踢出频道: eventType=', eventType, 'subscriberInfo.operateType=', subscriberInfo?.operateType, eventData);
      return true;
    }

    // 【排查点2】频道解散判定：channelInfo.operateType === 4
    const isChannelDissolved = channelInfo?.operateType === 4;
    if (isChannelDissolved) {
      // console.log('[Expired][排查] 命中频道解散: channelInfo.operateType=', channelInfo?.operateType, eventData);
      return true;
    }

    // 【排查点3】频道注销判定：channelInfo.operateType === 7
    const isChannelCancelled = channelInfo?.operateType === 7;
    if (isChannelCancelled) {
      // console.log('[Expired][排查] 命中频道注销: channelInfo.operateType=', channelInfo?.operateType, eventData);
      return true;
    }

    return false;
  }

  // 频道消息ticker处理
  channelTicker(channelId, item) {
    // 【排查】打印消息的完整数据
    // console.log('[Expired][排查] channelTicker处理, channelId=', Number(channelId), '消息数量=', item.messages.length);

    // 找到最后一个退出/解散/被踢事件的位置
    let exitEventIndex = -1;
    for (let i = item.messages.length - 1; i >= 0; i--) {
      if (this.isChannelExitEvent(item.messages[i])) {
        exitEventIndex = i;
        break;
      }
    }

    let messagesToDispatch;
    if (exitEventIndex === item.messages.length - 1) {
      // 退出事件是最后一条，仅dispatch最后一条
      // console.log('[Expired] 退出事件是最后一条，仅dispatch最后一条', Number(channelId));
      messagesToDispatch = [item.messages[exitEventIndex]];
    } else if (exitEventIndex >= 0) {
      // 退出事件不是最后一条，slice退出事件到最新的一条，不包含退出事件
      // console.log('[Expired][排查] 找到离开事件位置: index=', exitEventIndex, '从', exitEventIndex + 1, '开始dispatch');
      messagesToDispatch = item.messages.slice(exitEventIndex + 1);
    } else {
      // 没有退出事件，全部dispatch
      messagesToDispatch = item.messages;
    }

    // console.log('[Expired][排查] 准备dispatch消息数量:', messagesToDispatch.length);
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
    item.messages.sort((a, b) => Number(a.sendTime) - Number(b.sendTime));
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
    // 如果消息时间大于初始化时间，直接放行
    // 4203: latestChannelMessage.sendTime
    // 4204: latestChannelEventMessage.msgTime
    // 4205: latestRecallChannelMessage.sendTime
    // 4201/4206: clearTime
    const msgTime = data?.latestChannelMessage?.sendTime ||
                    data?.latestChannelEventMessage?.msgTime ||
                    data?.latestRecallChannelMessage?.sendTime ||
                    data?.clearTime;
    // console.log('[expired time check]msgTime', msgTime, this.inititalTime, data);
    if (!msgTime) {
      return true;
    }
    if (msgTime && Number(msgTime) > this.inititalTime) {
      return true;
    }
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
    // console.log('[expired]check', code, data);
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
