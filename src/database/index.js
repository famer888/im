import Dexie from "dexie";
import { Cache } from "@/cache";
import { fs, ipcRenderer } from "../platform";

// 工具
import { Local } from "../utils";
import {
  fnDbMsgListFormat,
  fnMsgListToBlockInfos,
} from "@/utils/widget/chat-msg-list";

// api
import {
  CReqRemoveMessage,
  CReqMessageReceipt,
  CReqChannelMessageReceipt,
} from "@/socket/api/message";

// 事件
import eventCommon from "@/event/common";
import eventCheduledCeletion from "@/event/cheduled-deletion";

// todo  localStorageName 要本地文件持久化
// todo  要判断 如果结构未变化时候  （新增 删除） 不需要inittable  减少不必要的开销
// 完善  删除聊天记录   撤回、 删除等功能

const pageSize = 80;
export const afterfix = "-45-2.0.3";

const handleTableNameGet = (id, type) => {
  let typeName = "message";
  if (type === "group") {
    typeName = "groupMessage";
  } else if (type === "channel") {
    typeName = "channelMessage";
  }

  return `${eventCommon.fnCommonInfoRU({
    getId: "loginId",
  })}-${typeName}.man${id}`;
};

export default class dbBase {
  constructor(userId) {
    this.localStorageName = {};
    // 索引说明：
    // &customMsgId - 主键，用于 get/update/bulkGet/bulkDelete
    // &MsgID - 唯一键，用于通过消息ID查询
    // readStatus - 用于查询已读状态
    // sendTime - 用于时间排序和范围查询
    this.tableString = "&customMsgId, &MsgID, readStatus, sendTime";
    this.version = 1;
    // 初始化完成的 Promise 锁
    this._dbReadyResolve = null;
    this._dbReady = new Promise((resolve) => {
      this._dbReadyResolve = resolve;
    });
    this.initDB(userId);
    this.timer;
    this.addList = [];
  }

  async initDB(userId) {
    this.userId = userId;
    this.localStorageName = (await this.getLocalStorageName(userId)) || {};
    await this.updateVersionFromPreviousDatabase();
    await this.setTableVision();
    // 初始化完成，释放锁
    this._dbReadyResolve && this._dbReadyResolve();
  }

  async updateVersionFromPreviousDatabase() {
    let tempDb = null;
    try {
      // 创建临时数据库实例来检查现有schema
      tempDb = new Dexie(this.userId + afterfix);
      await tempDb.open();

      // 获取当前数据库中的表
      const existingTables = tempDb.tables;

      if (existingTables.length === 0) {
        return;
      }

      // 检查是否有schema不同的表
      let needUpdate = false;
      const tablesToUpdate = [];

      for (const table of existingTables) {
        // 获取表的当前schema：主键 + 索引
        const primKey = table.schema.primKey ? table.schema.primKey.src : '';
        const indexes = table.schema.indexes.map(idx => idx.src).join(', ');
        const existingSchema = primKey + (indexes ? ', ' + indexes : '');

        // 如果schema与当前定义的tableString不同
        if (existingSchema !== this.tableString) {
          needUpdate = true;
          tablesToUpdate.push(table.name);
        }
      }

      if (needUpdate) {
        // schema有变化，更新localStorageName中对应表的schema
        for (const tableName of tablesToUpdate) {
          if (this.localStorageName[tableName]) {
            this.localStorageName[tableName] = this.tableString;
          }
        }
        // 同步更新本地缓存
        await Cache(`${this.userId}` + "localStorageName", this.localStorageName);

        // 增加版本号并写入本地
        this.version = (await this.getVersion()) || 1;
        this.version += 1;
        await Cache(`${this.userId}storageVersion`, this.version);
      }
    } catch (e) {
      // 数据库可能不存在或其他错误，忽略
      console.log('[db]更新数据库版本号失败', e.message || e);
    } finally {
      // 确保临时数据库总是被关闭，避免文件句柄泄漏
      if (tempDb) {
        try {
          tempDb.close();
        } catch (closeError) {
          // 忽略关闭错误
        }
      }
    }
  }

  getListSearch(searchText) {
    return Promise.all(
      this.db._storeNames.map((tableName) => {
        const id = Number(tableName.slice(tableName.indexOf(".man") + 4));
        let type = "friend";
        if (tableName.includes("groupMessage")) {
          type = "group";
        } else if (tableName.includes("channelMessage")) {
          type = "channel";
        }

        return new Promise(async (reject) => {
          const list = await this.db[tableName]
            .filter((item) => {
              if (typeof item.content === "string") {
                return (
                  item.content &&
                  item.content
                    .toUpperCase()
                    .indexOf(searchText.toUpperCase()) !== -1 &&
                  ![50, 51].includes(item.msgType)
                );
              }
              return false;
            })
            .toArray();
          return reject({ id, type, list });
        });
      })
    );
  }

  searchTable({ id, type, searchText }) {
    const tableName = handleTableNameGet(id, type);
    return new Promise(async (reject) => {
      const list = await this.db[tableName]
        .filter((item) => {
          if (typeof item.content === "string") {
            return (
              // 放开群简介的搜索
              [0, 8].includes(item.msgType || item.chatType) &&
              item.content &&
              item.content.toUpperCase().indexOf(searchText.toUpperCase()) !==
                -1
            );
          }
          return false;
        })
        .toArray();
      return reject({ list });
    });
  }

  /**
   * 删除指定id列表的数据
   */
  async deleteMsgForIdObjList({
    id,
    type,
    idObjList,
    isRemoteDeletion,
    isOtherPlatformOperate,
  }) {
    const tableName = handleTableNameGet(id, type);
    const dbData = this.db[tableName];

    if (!dbData) {
      return null;
    }

    // 本地id列表
    let customMsgIdList = [];
    if (!isOtherPlatformOperate) {
      customMsgIdList = idObjList.map((item) => item.customMsgId);
    }

    // 没有本地id的 msgId 列表
    const msgIdOnlyList = idObjList
      .filter((item) => !item.customMsgId)
      .map((item) => item.msgId);
    ///////////////////////////// 获取要被删除的信息，更新id列表

    // 先通过本地id列表 获取
    let msgInfoList = await dbData.bulkGet(customMsgIdList);
    // 过滤掉未找到的数据（undefined），防止后续操作报错
    msgInfoList = msgInfoList.filter(item => item);

    // 如果存在没有本地id 只有 msgId的，用msgid列表获取本地数据
    if (msgIdOnlyList.length > 0) {
      const arr = await dbData
        .where("MsgID")
        .anyOf([
          ...msgIdOnlyList.map((item) => Number(item)),
          ...msgIdOnlyList.map((item) => String(item)),
        ])
        .toArray();

      msgInfoList = [...msgInfoList, ...arr];
    }

    // 设置 所有的本地id列表
    customMsgIdList = msgInfoList.map((item) => item.customMsgId);

    // 设置 所有的msgId列表
    const msgIdList = msgInfoList.map((item) => item.MsgID);

    ///////////////////////////// 更新关联的 引用/被引用

    // 设置 要清除引用的id列表
    let idListClearReferenced = msgInfoList
      .filter(
        (item) => item.associationIdList && item.associationIdList.length > 0
      )
      .map((item) => item.associationIdList);

    // 二维数组，摊平为1维数组
    idListClearReferenced = idListClearReferenced.flat();

    // 移除要被删除的
    idListClearReferenced = idListClearReferenced.filter(
      (id) => !customMsgIdList.includes(id)
    );

    //////////////////////////////// 修改被引用a的数据

    // 设置 更新引用id的id列表
    let idListUpdateAssociationId = msgInfoList
      .filter((item) => item.quoteMessage)
      .map((item) => item.quoteMessage.customMsgId);

    // 移除要被删除的
    idListUpdateAssociationId = idListUpdateAssociationId.filter(
      (id) => !customMsgIdList.includes(id)
    );

    // 获取要更新的引用信息
    if (idListUpdateAssociationId.length > 0) {
      // 获取更新被引用的信息
      const msgListUpdateAssociation = await dbData.bulkGet(
        idListUpdateAssociationId
      );

      // 更新Association id 列表，有引用需要清空的也同时处理
      const updatePromises = msgListUpdateAssociation.map((item) => {
        // 被引用id列表
        let updateInfo = {
          associationIdList: item.associationIdList.filter(
            (id) => !customMsgIdList.includes(id)
          ),
        };

        // 引用的清空
        if (idListClearReferenced.includes(item.customMsgId)) {
          updateInfo.quoteMessage = null;
        }

        return dbData.update(item.customMsgId, updateInfo);
      });

      // 更新
      await Promise.all(updatePromises);

      // 清除引用的id列表 过滤掉已处理了的
      idListClearReferenced = idListClearReferenced.filter(
        (id) => !idListUpdateAssociationId.includes(id)
      );
    }

    ////////////////////////////////

    // 引用移除，quoteMessage 设置为空
    const updatePromises = idListClearReferenced.map(
      (id) => dbData.update(id, { quoteMessage: null }) // 只更新 quoteMessage 字段
    );

    // 更新
    await Promise.all(updatePromises);

    ///////////////////////////// 本地数据删除
    await dbData.bulkDelete(customMsgIdList);

    ///////////////////////////// 最后一条消息
    const msgLast = await dbData.orderBy("sendTime").last();

    ///////////////////////////// 清除阅后即焚的消息信息【换数据库再处理，对目前逻辑不影响】

    ///////////////////////////// 未读

    // 如果原本有未读，判断是否需要修改未读信息
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 返回的未读信息
    let unreadMsgFirst = null;

    // 未读总数
    let unreadMsgCount = null;

    const unReadObj = await Cache(`${loginId}-unread`);
    if (unReadObj) {
      let resUread = _.cloneDeep(unReadObj.unread);
      if (resUread && resUread[id + type]) {
        // 如果有未读信息才需要修改
        if (resUread[id + type]) {
          // 如果有最后一条信息，则继续判断未读信息

          if (msgLast) {
            // 删除的未读消息列表
            const unreadMsgDeletedList = msgInfoList.filter(
              (item) =>
                item.chatType < 50 &&
                Number(item.sendTime) >= resUread[id + type].time &&
                loginId !== item.sendUid
            );

            if (unreadMsgDeletedList.length > 0) {
              // 如果未读数都没移除了，则直接删除未读
              if (resUread[id + type].count === unreadMsgDeletedList.length) {
                delete resUread[id + type];

                // 设置返回的未读总数
                unreadMsgCount = 0;
                unReadObj.unread = resUread;
                // 同步未读
                Cache(`${loginId}-unread`, unReadObj);
              } else {
                // 更新未读数
                resUread[id + type].count -= unreadMsgDeletedList.length;
                // 设置返回的未读总数
                unreadMsgCount = resUread[id + type].count;

                // 第一个未读被删除，则需要更新未读id和时间
                const isDeleteUnreadFirst = unreadMsgDeletedList.some(
                  (item) => item.sendTime == resUread[id + type].time
                );

                if (isDeleteUnreadFirst) {
                  // 获取新的第一个未读信息
                  unreadMsgFirst = await dbData
                    .filter(
                      (item) =>
                        Number(item.sendTime) > resUread[id + type].time &&
                        item.chatType < 50 &&
                        loginId !== item.sendUid
                    )
                    .orderBy("sendTime")
                    .first();
                }
                unReadObj.unread = resUread;
                // 同步未读
                Cache(`${loginId}-unread`, unReadObj);
              }
            }
          } else {
            // 没有最有一条信息，则直接清除未读
            delete resUread[id + type];

            // 设置返回的未读总数
            unreadMsgCount = 0;
            unReadObj.unread = resUread;
            // 同步未读
            Cache(`${loginId}-unread`, unReadObj);
          }
        }
      }
    }
    ///////////////////////////// 远程数据删除
    if (isRemoteDeletion) {
      // 多条消息删除信息 推送
      for (const msgId of msgIdList) {
        CReqRemoveMessage({
          msgId,
          msgTargetId: id,
          clear: 0,
          clearTime: new Date().getTime(),
          type,
        });
      }
    }
    return {
      msgLast,
      unreadMsgFirst,
      unreadMsgCount,
      idListClearReferenced,
    };
  }
  /**
   * 清空消息
   */
  async clearMsgList({ id, type, isRemoteDeletion }) {
    const tableName = handleTableNameGet(id, type);
    const dbData = this.db[tableName];

    if (!dbData) {
      return null;
    }
    // 清空数据
    dbData.clear();

    // 远程清空
    if (isRemoteDeletion) {
      CReqRemoveMessage({
        msgId: -1,
        msgTargetId: id,
        clear: 1,
        clearTime: new Date().getTime(),
        type,
      });
    }
    return { isClearAll: true };
    // 清除所有的定时删除信息【换数据库再处理，对目前逻辑不影响】
  }
  async deleteDataForId(tableName, id, isMsgId) {
    const name = isMsgId ? "MsgID" : "customMsgId";
    const info = await this.db[tableName].where(name).equals(id).toArray();
    if (info && info[0]) {
      this.db[tableName].where(name).equals(id).delete();
    }
  }
  /**
   * 修改消息 通过id
   */
  updateMsgForId({ id, type, customMsgId, updated }) {
    const tableName = handleTableNameGet(id, type);

    try {
      this.db[tableName].update(customMsgId, updated);
    } catch (e) {
      //
    }
  }
  /**
   * 发送的消息被已读
   */
  async sendMsgReadSet({ id, type, msgId, readTime }) {
    const tableName = handleTableNameGet(id, type);
    if (this.db[tableName]) {
      const msgInfo = await this.db[tableName]
        .where("MsgID")
        .anyOf([Number(msgId), String(msgId)])
        .first();

      if (msgInfo) {
        const arr = await this.db[tableName]
          .where("readStatus")
          .equals(1) // 只选择 readStatus = 1 的记录
          .filter((item) => item.sendTime <= msgInfo.sendTime) // 过滤 timestamp <= 指定时间的记录
          .toArray();

        // 批量更新
        arr.map(
          (item) =>
            this.db[tableName].update(item.customMsgId, {
              readStatus: 2,
            }) // 只更新 readStatus
        );

        // 定时删除消息列表
        const msgListCheduledCeletion = arr.filter(
          (item) => item.deleteSeconds
        );

        // 设置定时删除
        for (const item of msgListCheduledCeletion) {
          eventCheduledCeletion.fnCheduledDeletionMsgAdd({
            id,
            type,
            customMsgId: item.customMsgId,
            time: item.deleteSeconds + readTime,
          });
        }

        return arr;
      }
    }

    return [];
  }
  /**
   * 通过MsgId 获取ID
   */
  async getIdForMsgID({ id, type, msgId }) {
    const tableName = handleTableNameGet(id, type);
    if (this.db[tableName]) {
      const arr = await this.db[tableName]
        .where("MsgID")
        .anyOf([Number(msgId), String(msgId)])
        .toArray();

      if (arr && arr.length > 0) {
        return arr[0].customMsgId;
      }
    }

    return null;
  }
  /**
   * 指定时间之后
   */
  async getMsgUnreadForTimeAfter({ id, type, values, lastMessage }) {
    let unreadInfo = null;

    try {
      const { timeUnread, sendTime, isSync } = values;

      const tableName = handleTableNameGet(id, type);

      // 消息读取列表
      let msgReadList = [];

      // 如果未读时间存在，则获取未读时间到当前时间内的未读消息
      if (timeUnread) {
        if (sendTime) {
          const arr = await this.db[tableName]
            .where("sendTime")
            .between(String(timeUnread), String(sendTime), true, true) // 使用 .between() 查询区间
            .toArray();

          if (arr) {
            msgReadList = arr.filter((item) => !item.isSelf);
          }
        } else {
          // 获取第一个
          const infoFirst = await this.db[tableName]
            .where("sendTime")
            .equals(String(timeUnread))
            .first();

          if (infoFirst && !infoFirst.isSelf) {
            msgReadList.push(infoFirst);
          }

          // 获取后续的全部
          const arr = await this.db[tableName]
            .where("sendTime")
            .above(String(timeUnread))
            .toArray();

          if (arr) {
            msgReadList = [
              ...msgReadList,
              ...arr.filter((item) => !item.isSelf),
            ];
          }
        }
      } else {
        // 取在存之前，永远取不到
        // 获取最后一个等于的信息
        const infoLast =
          (await this.db[tableName]
            .where("sendTime")
            .equals(String(sendTime))
            .first()) || lastMessage;

        if (infoLast && !infoLast.isSelf) {
          msgReadList.push(infoLast);
        }
      }

      // 计算新的未读信息：
      // 如果有多端已读同步或本地已读，我们需要计算该截断时间（checkTime）之后，还有多少条真实的未读消息，
      // 并把最新的未读数和第一条未读的时间反馈给组件用于更新左侧会话列表的小红点。
      let checkTime = null;
      if (sendTime) {
        // 如果传了 sendTime，以此时间点作为截断点
        checkTime = sendTime;
      } else if (timeUnread && !sendTime) {
        // 如果只有 timeUnread 但没有 sendTime，说明从最早的未读到最新消息被一次性全部标为已读，此时已无剩余未读
        checkTime = null;
      }

      if (checkTime) {
        const remainArr = await this.db[tableName]
          .where("sendTime")
          .above(String(checkTime))
          .toArray();

        // 过滤规则：
        // 1. 过滤掉自己发出的消息（不计入未读）
        // 2. 兼容老数据：如果没有 chatType 字段（undefined 或 null），为了安全起见默认算作普通聊天消息
        // 3. 过滤系统消息：只有 chatType < 50 的才是真实的用户聊天消息，避免系统提示
        const unreadRemainList = remainArr.filter((item) => {
          if (item.isSelf) return false;
          if (item.chatType === undefined || item.chatType === null) return true;
          return item.chatType < 50;
        });

        if (unreadRemainList.length > 0) {
          // 确保按发送时间升序排列，取第一条未读作为下一次红点计算的起始游标
          unreadRemainList.sort((a, b) => Number(a.sendTime) - Number(b.sendTime));
          unreadInfo = {
            count: unreadRemainList.length,
            time: unreadRemainList[0].sendTime,
            unreadID: unreadRemainList[0].customMsgId,
          };
        }
      }

      const now = new Date().getTime();

      for (const item of msgReadList) {
        // 如果是有定时删除，则对应设置
        if (item.deleteSeconds) {
          // 阅后即焚设置
          eventCheduledCeletion.fnCheduledDeletionMsgAdd({
            id,
            type,
            customMsgId: item.customMsgId,
            time: now + item.deleteSeconds,
          });
        }
      }

      if (type === "channel") {
        const channelId = id;
        // 仅使用已确认消息的真实 MsgID：readStatus === -1 为发送中
        const msgIds = msgReadList
          .filter((item) => item.readStatus !== -1)
          .map((item) => Number(item.MsgID));

        // isSync: 如果为 true 表示这是由其它端（如手机端）操作已读推送过来的同步信令
        // 此时我们只负责更新本地数据库红点状态，不需要再向服务器回传已读
        if (msgIds.length && !isSync) {
          CReqChannelMessageReceipt(channelId, msgIds);
        }
        return unreadInfo;
      }

      // 确认消息收到
      const arr = msgReadList.map((item) => {
        const info = {
          type: 0,
          targetId: id,
          msgId: Number(item.MsgID),
          messageType: item.msgType,
          duration: 0,
          snapchatTime: 0,
          source: 1,
          sendUid: id,
          receiptStatus: {
            status: 1,
            time: now,
          },
        };

        if (type === "group") {
          info.groupId = id;
          info.sendUid = item.sendUid || item.sendMember?.user?.uid;
          info.type = 1;
        }

        return info;
      });

      // 多端同步引发的本地计算，拦截二次已读回执的网络请求
      if (arr.length > 0 && !isSync) {
        CReqMessageReceipt(arr);
      }
    } catch (e) {
      console.log(e);
    }

    return unreadInfo;
  }
  /**
   * 修改消息的属性
   * readStatus -1 发送中， 0 发送超时， 1 发送成功，2 已读
   */
  async updateMsgProperty({ id, type, list }) {
    try {
      const tableName = handleTableNameGet(id, type);
      const msgIdList = [];

      // 找到对应的信息
      for (const item of list) {
        const { customMsgId, updated } = item;

        const info = await this.db[tableName].get(customMsgId);

        // 信息存在则对应去修改
        if (info) {
          msgIdList.push(info.MsgID);
          await this.db[tableName].update(info.customMsgId, updated);
        }
      }

      return msgIdList;
    } catch (e) {
      //
      console.log('>>>> 报错了？', e)
    }

    return null;
  }
  /**
   * 获取未读的At我的id列表
   */
  async getIdsAtUnread({ id, type, sendTime }) {
    const tableName = handleTableNameGet(id, type);

    // 获取被at的ids
    if (this.db[tableName]) {
      return await this.db[tableName]
        .where("sendTime")
        .aboveOrEqual(String(sendTime))
        .and((message) => message.isAtMe === true) // isAtMe 等于 true
        .toArray() // 获取结果数组
        .then((messages) => {
          // 按照 sendTime 和 MsgID 降序排序，确保最新的未读消息排在前面 （跟app同步）
          messages.sort((a, b) => {
            if (a.sendTime > b.sendTime) return -1;
            if (a.sendTime < b.sendTime) return 1;
            if (a.MsgID > b.MsgID) return -1;
            if (a.MsgID < b.MsgID) return 1;
            return 0;
          });
          return messages.map((message) => message.customMsgId);
        }); // 提取 id
    }
  }
  /**
   * 获取消息列表
   */
  async getMsgList({ id, type, sendTime, msgBlockList }) {
    const tableName = handleTableNameGet(id, type);

    try {
      const pageNumListOld = msgBlockList.map((item) => item.pageNum);

      // 消息总数
      const count = await this.db[tableName].count();

      // 总页数
      const pageCount = Math.ceil(count / pageSize);

      // 最后一页的消息数
      const pageLastMsgCount = count - pageSize * (pageCount - 1);

      // 默认当前是底部
      let pageNumCurrent = pageCount;

      if (sendTime) {
        // 小于等于指定时间的消息总数
        const belowOrEqualCount = await this.db[tableName]
          .where("sendTime")
          .belowOrEqual(String(sendTime))
          .count();

        // 当前所在页面数
        pageNumCurrent =
          belowOrEqualCount === 0
            ? pageCount
            : Math.ceil(belowOrEqualCount / pageSize);
      }
      // 如果当前不是第一页，则往前多拿一页
      const pageNumFirst =
        pageNumCurrent > 1 ? pageNumCurrent - 1 : pageNumCurrent;

      // 要拿取得的页面号
      let pageNumList = [pageNumFirst];

      // 最多增加两页
      for (let i = 1; i < 3; i++) {
        if (pageNumFirst + i <= pageCount) {
          pageNumList.push(pageNumFirst + i);
        }
      }

      // 排除已有的
      pageNumList = pageNumList.filter((num) => !pageNumListOld.includes(num));

      // 获取数据
      if (pageNumList.length > 0) {
        const list = await this.getPaginatedEvents(
          tableName,
          pageNumFirst,
          pageNumList.length
        );

        if (list.length > 0) {
          return {
            pageNumCurrent,
            msgBlockList: fnMsgListToBlockInfos(
              pageNumList,
              list,
              msgBlockList
            ),
            pageCount,
            pageLastMsgCount,
          };
        }
      }

      // 即使没有新数据需要获取（页已缓存），也返回元信息
      return {
        pageNumCurrent,
        msgBlockList,
        pageCount,
        pageLastMsgCount,
      };
    } catch (e) {
      // console.error(e);
    }

    return null;
  }
  /**
   * 获取指定页面的消息列表
   */
  async getMsgListForPageNum({ id, type, pageNum, msgBlockList }) {
    try {
      const tableName = handleTableNameGet(id, type);

      const list = await this.getPaginatedEvents(tableName, pageNum, 1);

      if (list.length > 0) {
        return fnMsgListToBlockInfos([pageNum], list, msgBlockList);
      }
    } catch (e) {
      //
    }

    return null;
  }
  /**
   * 分页查询函数
   */
  async getPaginatedEvents(tableName, pageNum, multiple) {
    try {
      // 计算偏移量
      const offset = (pageNum - 1) * pageSize;

      // 查询事件并分页
      let events = await this.db[tableName]
        .orderBy("sendTime") // 以时间排序
        .offset(offset) // 设置偏移量
        .limit(pageSize * (multiple || 1)) // 设置每页记录数
        .toArray();
      events = this.msgListSort(events);
      return fnDbMsgListFormat(events, tableName.includes("group"));
    } catch (e) {
      // console.log(e);
    }

    return [];
  }

  // 获取最后的消息
  async getLastMsg(type, id) {
    try {
      const tableName = handleTableNameGet(id, type);
      let events = await this.db[tableName]
        .orderBy("sendTime") // 以时间排序
        .reverse()
        .first();
      return events;
    } catch (error) {
      console.log(error);
    }
    return [];
  }

  // 查询指定范围内的某条消息
  async rangeQueryMsg({ id, type, msgId, limit }) {
    try {
      const tableName = handleTableNameGet(id, type);
      let latestMsgIds = await this.db[tableName]
        .orderBy("sendTime") // 以时间排序
        .limit(limit) // 设置每页记录数
        .toArray();
      return latestMsgIds.find((item) => Number(item.msgId) === msgId);
    } catch (error) {
      console.error("查询失败：", error);
      return false;
    }
  }

  // 消息列表排序
  msgListSort(events) {
    return events.sort((a, b) => {
      // 先按 sendTime 升序排序（如果 sendTime 是字符串或时间戳）
      if (a.sendTime < b.sendTime) return -1;
      if (a.sendTime > b.sendTime) return 1;

      // 如果 sendTime 相同，则按 MsgID 升序排序
      if (a.MsgID < b.MsgID) return -1;
      if (a.MsgID > b.MsgID) return 1;

      return 0; // 如果 sendTime 和 MsgID 都相同，则保持原顺序
    });
  }
  /**
   * 检查消息ID是否重复
   * @param {Object} params - { id, type, msgId }
   * @returns {Promise<boolean>} true: 重复; false: 不重复
   */
  async checkRepeat({ id, type, msgId }) {
    const tableName = handleTableNameGet(id, type);
    if (!this.db[tableName] || !msgId) {
      return false;
    }

    try {
      const count = await this.db[tableName]
        .where("MsgID")
        .equals(String(msgId))
        .count();

      return count > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取消息信息 通过msgId
   */
  async getMsgInfoForMsgId({ id, type, msgId }) {
    const tableName = handleTableNameGet(id, type);

    if (!this.db[tableName]) {
      return null;
    }

    const arr = await this.db[tableName]
      .where("MsgID")
      .anyOf([Number(msgId), String(msgId)])
      .toArray();

    return arr && arr.length > 0 ? arr[0] : null;
  }
  /**
   * 删除表单
   */
  async deletTable(data) {
    const tableName = handleTableNameGet(data.id, data.type);
    if (this.localStorageName[tableName]) {
      this.db[tableName].clear();
      delete this.localStorageName[tableName];
      this.setTableVision();
      try {
        const userData = await ipcRenderer.invoke("get-user-data-path");

        let local;
        if (tableName.indexOf("groupMessage.man") != -1) {
          local = `group-${tableName.split("groupMessage.man")[1]}`;
        } else {
          local = `user-${tableName.split("message.man")[1]}`;
        }
        const url = `${userData}/Local Storage/${local}/`;

        if (fs.existsSync(url)) {
          let files = fs.readdirSync(url);
          if (!files.length) {
            fs.rmdirSync(url);
          } else {
            files.forEach((item) => {
              fs.unlinkSync(`${url}${item}`);
            });
            fs.rmdirSync(url);
          }
        }
      } catch (error) {}
    }
  }
  /**
   * 新增替换
   */
  async addDB(tableName, data, type) {
    // 等待数据库初始化完成
    await this._dbReady;
    let addData = this.setDataList(data, type, tableName);
    this.db[tableName]
      .bulkPut(addData)
      .then(() => {
        //
      })
      .catch((err) => {
        console.log('入库失败：', err);
        // 单条重复数据写入错误
        if (err.name === "ConstraintError") {
          console.warn("addDB: 重复数据已忽略");
          return;
        }
        // 批量操作部分失败
        if (err.name === "BulkError") {
          // 检查是否全部都是约束错误（重复数据）
          const allConstraintErrors = err.failures?.every(
            (f) => f.name === "ConstraintError"
          );
          if (allConstraintErrors) {
            console.warn("addDB: 重复数据已忽略", err.failures?.length);
            return;
          }
          // 存在非约束错误，剔除重复数据后重写
          // failuresByPos: { [operationNumber: number]: Error }
          const constraintFailedIndexes = new Set(
            Object.entries(err.failuresByPos || {})
              .filter(([, error]) => error.name === "ConstraintError")
              .map(([index]) => Number(index))
          );
          // 过滤掉重复数据（保留非约束错误的数据进行重试）
          const filteredData = addData.filter(
            (_, index) => !constraintFailedIndexes.has(index)
          );
          if (filteredData.length > 0) {
            console.warn("addDB: 剔除重复数据后重写", constraintFailedIndexes.size);
            this.db[tableName].bulkPut(filteredData).catch((e) => {
              console.error("addDB: 重写失败", e);
            });
          }
          return;
        }
        // 其他错误，尝试重新设置表版本后重试
        this.setTableVision(() => {
          this.addDB(tableName, data, type);
        });
      });
  }
  /**
   * 获取列表
   */
  getTableList(tableName, pageNum = 1, pageSize = 20, msgId, isRead) {
    return new Promise(async (reject) => {
      try {
        if (!this.db[tableName]) return reject([]);

        // 未读消息
        if (isRead) {
          let list = await this.db[tableName]
            .filter((item) => !item.hasRed)
            .toArray();
          return reject(list);
          //获取全部消息
        } else if (pageSize == 99 && !msgId) {
          let list = await this.db[tableName]
            .orderBy("sendTime")
            .reverse()
            .toArray();
          return reject(list);
        }
        let nums = this.getLimit(pageSize, pageNum);
        // let startTime = Date.now()
        let methods = this.db[tableName]
          .orderBy("sendTime")
          .reverse()
          .filter((item) => {
            let bol =
              item.Status != 2 &&
              item.sendTime &&
              (item.content || item.text || item.Content || item.local);
            if (msgId) {
              bol =
                item.MsgID * 1 >= msgId * 1 &&
                item.ChatType != 50 &&
                item.chatType != 50 &&
                item.msgType != 50;
            }
            if (nums[2]) {
              bol = bol && item.sendTime * 1 < nums[2] * 1;
            }
            return bol;
          });
        if (!msgId) methods = methods.limit(pageSize);
        methods
          .toArray()
          .then((list) => {
            if (!list.length) return reject([]);
            list.reverse();

            Local("MsgID_DB", list[0].sendTime);
            reject(list);
          })
          .catch(async (err) => {
            try {
              if (
                err.name == "DatabaseClosedError" &&
                err.message.split("is less than the existing version (").length
              ) {
                let visision = parseInt(
                  err.message
                    .split("is less than the existing version (")[1]
                    .split(")")[0]
                );
                if (visision % 10 == 0) {
                  visision = Math.floor(visision / 10);
                }
                Cache(`${this.userId}storageVersion`, visision + 1);
                await this.setTableVision();
                let list = await this.getTableList(
                  tableName,
                  pageNum,
                  pageSize,
                  msgId,
                  isRead
                );
                reject(list);
              } else {
                reject([]);
              }
            } catch (error) {
              reject([]);
            }
          });
      } catch (error) {
        reject([]);
      }
    });
  }
  getLimit(pageSize = 20, pageNum = 1) {
    if (pageNum == 1) Local("MsgID_DB", "");
    let nums = [
      (pageNum - 1) * pageSize,
      pageNum * pageSize + initCount,
      Local("MsgID_DB"),
    ];
    if (nums[0] != 0) nums[0] += initCount;
    return nums;
  }
  setDataList(data, type, tableName) {
    const startTime = performance.now();
    let result;

    if (data.forEach) {
      let arr = [];
      data.forEach((item) => {
        let Content;
        try {
          Content = JSON.parse(item.Content);
        } catch (error) {
          Content = item;
        }
        item.tableName = tableName;
        item.MsgID = String(item.MsgID);
        item.sendTime = String(item.sendTime);
        let customMsgId =
          item.customMsgId ||
          Content.customMsgId ||
          String(item.groupId || item.UserID) +
            String(Content.sendTime).substring(
              Content.sendTime.length - 5,
              Content.sendTime.length
            );
        arr.push({
          ...item,
          customMsgId,
          Status: item.Status == 2 ? 2 : "",
        });
      });

      result = arr;
    } else {
      let Content;
      try {
        Content = JSON.parse(data.Content);
      } catch (error) {
        Content = data;
      }
      data.MsgID = String(data.MsgID);
      data.sendTime = String(data.sendTime);
      let customMsgId = data.customMsgId || Content.customMsgId;
      result = [
        {
          ...data,
          customMsgId,
          tableName,
          Status: data.Status == 2 ? 2 : "",
        },
      ];
    }

    const endTime = performance.now();
    return result;
  }
  async setTableVision(cb, type) {
    let tables = this.localStorageName;
    this.version = (await this.getVersion()) || 1;
    if (this.version % 10 == 0) {
      this.version += 1;
    }
    await Cache(`${this.userId}storageVersion`, this.version + 1);
    // 关闭旧连接，防止版本更新阻塞
    if (this.db) {
      this.db.close();
    }
    this.db = new Dexie(this.userId + afterfix);

    if (!Object.keys(tables).length) {
      if (type == "init") cb && cb();
      return;
    }

    this.db.version(this.version).stores(tables);

    try {
      this.db
        .open()
        .then((rt) => {
          cb && cb();
        })
        .catch(async (err) => {
          console.log("----数据库版本---报错", err);
          try {
            if (
              err.name == "VersionError" &&
              err.message.split("is less than the existing version (").length
            ) {
              let visision = parseInt(
                err.message
                  .split("is less than the existing version (")[1]
                  .split(")")[0]
              );
              if (visision % 10 == 0) {
                visision = Math.floor(visision / 10);
              }
              await Cache(`${this.userId}storageVersion`, visision + 1);
              this.setTableVision();
            }
          } catch (error) {
            console.log(err);
          }
        });
    } catch (error) {
      cb && cb();
    }
    Cache(`${this.userId}` + "localStorageName", tables);
  }
  // 新增版本
  addVision(tableName, cb) {
    this.localStorageName[tableName] = this.tableString;
    this.setTableVision(cb);
  }
  // 获取本地版本数据库列表
  getLocalStorageName(userId) {
    return new Promise((reject) => {
      Cache(`${userId}` + "localStorageName").then((data) => {
        reject(data);
      });
    });
  }
  //
  getVersion() {
    return new Promise((reject) => {
      Cache(`${this.userId}storageVersion`)
        .then((version) => {
          reject(version);
        })
        .catch((err) => {
          reject(1);
        });
    });
  }
  exportDatabase() {
    const exportedData = {};

    // 获取所有表的数据（遍历所有表名）
    return Promise.all(
      this.db.tables.map((table) => {
        return table.toArray().then((data) => {
          // 将每个表的数据存储到 exportedData 对象中
          if (data && data.length > 0) {
            exportedData[table.name] = data;
          }
        });
      })
    ).then(() => {
      // 返回导出的数据（JSON 字符串）
      return {
        history: JSON.stringify(exportedData),
        uid: this.userId,
      };
    });
  }
}
