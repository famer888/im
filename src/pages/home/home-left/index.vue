<template>
  <div class="homeLeft">
    <ComNav
      :navType="navType"
      :unreadCount="unreadCount"
      :contactsUnreadCount="contactsUnreadCount"
      @change="
        (value) => {
          navType = value;
        }
      "
    />
    <div
      class="comList"
      :style="{ width: listWidth + 'px', maxWidth: listWidthMax + 'px' }"
    >
      <div
        class="search"
        :style="{ 'padding-top': archiveListShow ? '7px' : '45px' }"
      >
        <img
            class="icon-back"
            v-if="isSearchSpecifiedChat"
            src="@/assets/images/setting/back.png"
            @click="backClick"
        />
        <ComSearch
          :searchText="searchText"
          :unreadObj="unreadObj"
          :archiveIdStrList="archiveIdStrList"
          :unreadCount="unreadCount"
          :archiveListShow="archiveListShow"
          :placeholder="addAction && navType === 1 ? '搜索手机号/ID/群别名' : $t('搜索')"
          @onChange="(value) => (searchText = value)"
          @handleBack="handleBack"
          key="all-search"
        >
          <template #right v-if="navType === 1">
            <span class="add-cancel" v-if="addAction" @click="addAction = false">取消</span>
            <img class="add-btn" v-else @click="addAction = true" src="@/assets/images/headNav/add_blue.png" />
          </template>
        </ComSearch>
      </div>
      <!-- 搜索加好友或群 -->
      <ComSearchAddContacts
        v-if="addAction && searchText && navType === 1"
        :searchText="searchText"
        :searchAddContactsIng.sync="searchAddContactsIng"
      />
      <div class="new-friend" v-if="navType === 1 && !searchAddContactsIng" @click="goNewFriendExamine">
        <img class="icon" src="@/assets/images/headNav/add-new-icon.png" />
        <span class="title">新的好友</span>
        <span class="unread" v-if="contactsUnreadCount">{{ contactsUnreadCount }}</span>
      </div>
      <section v-if="!searchAddContactsIng">
        <ComSearchSpecifiedChat
          v-if="isSearchSpecifiedChat"
          :info="searchSpecifiedChat"
          :searchText="searchText"
        />
        <template v-else-if="searchText === ''">
          <ComChats
            v-if="navType === 0"
            :list="chats"
            :unreadObj="unreadObj"
            :unreadCount="unreadCount"
            :archiveListShow="archiveListShow"
            :infoActive="
              infoActive &&
              ['friend', 'group', 'notificationGroup', 'channel'].includes(infoActive.type)
                ? infoActive
                : null
            "
            @handleDeleteChats="handleDeleteChats"
            @handleArchiveListShow="handleArchiveListShow"
            @handleArchiveIdStrList="handleArchiveIdStrList"
          />
          <ComAddressBook
            v-else-if="navType === 1"
            :groups="groups"
            :friendList="friendList"
            :letters="letters"
            :letterIndexs="letterIndexs"
            :infoActive="
              infoActive &&
              ['detailsGroup', 'detailsFriend'].includes(infoActive.comType)
                ? infoActive
                : null
            "
          />
          <SendHelper v-else-if="navType === 2" />
        </template>
        <ComSearchs
          v-else
          :searchText="searchText"
          :groups="groups"
          :channels="channels"
          :friendList="friendList"
          :noSearchMsg="addAction"
          @clearSearch="searchText = ''"
        />
      </section>
      <i @mousedown="isEwResizeDown = true"></i>
    </div>
  </div>
</template>
<script>
import i18n from "@/assets/lang/i18n";
import { ipcRenderer } from "@/platform";
import { Cache } from "@/cache";
import { cacheDB } from "@/utils/cacheDB.js";
import iconGroupNotification from "@/assets/images/logo/group-icon.png";

// 控件
import ComSearch from "../com/search.vue";
import ComSearchSpecifiedChat from "./search-specified-chat.vue";
import ComChats from "./chats";
import ComNav from "./nav/index";
import ComSearchAddContacts from "../com/add-contacts/search-add-contacts";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventGroup from "@/event/group";
import eventFriend from "@/event/friend";
import eventChannel from "@/event/channel";
import eventChat from "@/event/chat";
import eventMsg from "@/event/msg";
import { getGroupDetail } from "@/api/imGroup";
import { getChannelDetail } from "@/api/imChannel";
import { getContactsDetail, getContactsList } from "@/api/imContacation";
import eventCheduledCeletion from "@/event/cheduled-deletion";
import { _ } from "core-js";
import { isBatchMode } from "@/utils/batchRenderer";

// 聊天窗口置顶数量
let chatTopSize = 0;

// 当前的登录id
let loginId = "";

let timerCacheDB = null;

export default {
  components: {
    ComNav,
    ComSearch,
    ComChats,
    ComSearchAddContacts,
    ComSearchSpecifiedChat,
    SendHelper: () => import("./send-helper"),
    ComSearchs: () => import("./searchs"),
    ComAddressBook: () => import("./address-book"),
  },
  props: ["infoActive"],
  data() {
    return {
      searchText: "", // 搜索文本
      channels: [], // 频道列表
      groups: [], // 群列表
      navType: 0, // 导航类型 聊天列表，通讯录，传输助手
      friendList: [], // 好友列表
      letters: [], // 好友 首字母列表
      letterIndexs: [], // 好友 首字母索引列表
      chats: [], // 聊天窗口列表
      unreadObj: {}, // 未读对象
      isEwResizeDown: false, // 拉伸大小 是否开始
      listWidth: 261, // 默认列表的宽度
      listWidthMax: 261, // 列表的最大宽度
      groupDialogInfo: null, //打开的群dialog 信息
      archiveListShow: false, // 是否显示归档
      archiveIdStrList: [],
      addAction: false,
      searchAddContactsIng: false, // 搜索添加联系人中
      contactsUnreadCount: 0,
      searchSpecifiedChat: {}, // 搜索指定的聊天
      unreadCount: 0, // 未读总数
      isSyncingDetails: false, // 是否正在同步详情中
      isRefreshingFriends: false, // 是否正在刷新好友列表
    };
  },
  provide() {
    return {
      provideSearchText: this.handleSearchText,
    };
  },
  computed: {
    isSearchSpecifiedChat() {
      return Boolean(this.searchSpecifiedChat?.id)
    }
  },
  methods: {
     /**
     * 更新未读总数
    */
    updateUnreadCount() {
      let count = 0;
      for (const item of this.chats) {
        const idStr = item.id + item.type;
        const isExist = eventCommon.fnDisturbIdStrListRU({
          idStrIsExist: idStr,
        });

        if (!isExist && this.unreadObj[idStr]) {
          count += this.unreadObj[idStr].count || 0;
        }
      }
      this.unreadCount = count;
    },
    backClick() {
      if(this.isSearchSpecifiedChat) {
        this.searchText = "";
        this.searchSpecifiedChat = {};
      }
    },
    goNewFriendExamine() {
        Cache(`${loginId}-newFriendReqTotal`, {total: 0});
        this.contactsUnreadCount = 0;

        eventBase.fnCommunicationSendMsg({
            operator: "activeChange",
            data: { comType: "newFriendExamine"},
        });
    },
    handleArchiveListShow(bool) {
      this.archiveListShow = bool;
    },
    handleSearchText(text) {
      this.searchText = text;
    },
    handleBack(data) {
      this.archiveListShow = data.bool;
      this.searchText = data.searchText;
    },
    handleArchiveIdStrList(list) {
      this.archiveIdStrList = list;
    },
    uniqueById(arr) {
        const map = new Map();
        arr.forEach(item => {
            // 使用 id + type 组合作为唯一键，并确保转为字符串处理，防止 123 和 "123" 被视为不同
            // 添加分隔符确保 id="1",type="1" 和 id="11",type="" 不会冲突
            const type = item.type || '';
            const key = item.id + '_' + type;
            if (!map.has(key)) {
                map.set(key, item);
            }
        });
        return Array.from(map.values());
    },
    /**
     * 刷新好友列表
     */
    async refreshFriendList() {
      if (this.isRefreshingFriends) return;
      this.isRefreshingFriends = true;

      if (!loginId) {
        loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
      }

      const pageSize = 200;
      let allContacts = [];

      try {
        const res = await getContactsList({ pageNum: 1, pageSize });
        if (!res?.contactsList) return;

        allContacts = eventFriend.fnApiDataFormat(res.contactsList);
        const totalPages = Math.ceil((res.count || 0) / pageSize);

        // 获取剩余页面
        if (totalPages > 1) {
          for (let p = 2; p <= totalPages; p++) {
            const pageRes = await getContactsList({ pageNum: p, pageSize });
            if (!pageRes?.contactsList) throw new Error(`第${p}页加载失败或为空`);
            allContacts = allContacts.concat(eventFriend.fnApiDataFormat(pageRes.contactsList));
          }
        }

        // 更新 Cache
        Cache(`${loginId}-ContactList`, allContacts);

        // 更新ui
        this.eventHandlingContactListReload({ friendList: allContacts });

      } catch (err) {
        console.error("联系人列表 error", err);
      } finally {
        this.isRefreshingFriends = false;
      }
    },
    /**
     * 获取聊天窗口列表
     */
    async handleChatsGet() {
      Promise.all([
        Cache(`${loginId}MessageGroupList`),
        Cache(`${loginId}MessageUserList`),
        Cache(`${loginId}MessageChannelList`),
      ]).then((res) => {
        const groupChats = res[0] || [];
        const friendChats = res[1] || [];
        const channelChats = res[2] || [];
        let chats = [
          ...this.chats,
          ...groupChats,
          ...friendChats,
          ...channelChats,
        ]
        chats = this.uniqueById(chats)
        const info = eventChat.fnChatListSort(chats);

        this.chats = info.list;
        chatTopSize = info.chatTopSize;
      });
    },
    /**
     * 事件监听
     */
    handleEventMonitor() {
      eventBase.fnCommunicationMonitoring(
        "homeLetf",
        [
          "friendUpdate", // 好友信息更新
          "activeChange", // 选中改变
          "msgNew", // 添加新消息
          "msgReadByMe", // 我已读消息
          "chatMsgListToBottom", // 置底
          "groupUpdate", // 群信息更新
          "channelUpdate", // 频道信息更新
          "groupNotification", // 群通知
          "msgDelete", // 消息删除
          "friendRemarkUpdate", // 好友备注修改 备注名，描述
          "bfTopSet", // 置顶设置
          "bfDisturbSet", // 免打扰设置
          "groupShutupAll",
          "friendAdd", // 添加新的好友
          "deleteFriend", // 删除好友
          "cheduledDeletionConfig",
          "clearAll", // 清除全部信息
          "openGroupDialog",
          "bfAddressSet", // 保存到通讯录
          "msgListPropertyUpdate", // 信息发送成功状态更新
          "updateNewFriendReqTotal", // 新朋友申请待处理总数更新
          "searchSpecifiedChat", // 搜索指定的聊天窗口记录
          "channelDetailCache", // 缓存频道的详情
          "deleteChat", // 删除聊天窗口
          "channelDisturbSet",  // 频道接收通知设置
          "contactListReload", // 好友、群、频道登录同步逻辑处理
        ],
        this.eventHandling
      );
    },
    /**
     * 处理事件
     * @param {Object|Array} info - 消息数据，批量模式下为数组
     * @param {string} operator - 事件类型
     * @param {string} operatorType - 操作子类型，批量模式下为 BATCH_MODE
     */
    eventHandling(info, operator, operatorType) {
    //   console.log({ info, operator, operatorType }, "homeLeft --------> 220");

      // 批量模式处理
      if (isBatchMode(operatorType, info)) {
        this.handleBatchEvent(info, operator);
        return;
      }

      if (!info) {
        return;
      }

      switch (operator) {
        case "bfDisturbSet": {
          // 处理事件 免打扰设置
          if (info.type === "friend") {
            this.eventHandlingFriendUpdate(info);
          } else if(info.type === 'channel') {
            // this.eventSetChannelDisable(info.id, info.isDisturb);
            const state = info.isDisturb !== undefined ? info.isDisturb : info.bfDisturb;
            this.eventSetChannelDisable(info.id, state);
          } else {
            this.eventHandlingGroupUpdate({
              ...info,
              values: info,
            });
          }
          break;
        }
        case "bfTopSet": {
          // 处理事件 置顶设置
          this.eventHandlingBfTopSet(info);
          break;
        }
        case "activeChange": {
          // 处理事件 选中改变
          this.eventHandlingActiveChange(info);
          break;
        }
        case "msgNew": {
          // 处理事件 添加新消息
          this.eventHandlingMsgNew(info, operatorType);
          break;
        }
        case "channelDetailCache": {
          // 处理事件 缓存频道的详情
          this.eventChannelDetailCache(info);
          break;
        }
        case "msgReadByMe": {
          // 处理事件 我已读消息
          this.eventHandlingMsgReadForMe(info);
          break;
        }
        case "chatMsgListToBottom": {
          // 置底直接走全部已读
          this.eventHandlingMsgReadForMe(info);
          break;
        }
        case "groupUpdate": {
          // 处理事件 群详情数据同步
          this.eventHandlingGroupUpdate(info);
          break;
        }
        case "channelUpdate": {
          // 处理事件 频道详情数据同步
          this.eventHandlingChannelUpdate(info);
          break;
        }
        case "groupNotification": {
          // 群通知
          this.eventHandlingGroupNotification(info, operatorType);
          break;
        }
        case "msgDelete": {
          // 清空聊天信息或者删除部分message信息，更新会话列表的对应会话框的content信息
          this.eventHandlingMsgDelete(info);
          break;
        }
        case "friendRemarkUpdate": {
          // 好友备注更新 备注名，描述
          this.eventHandlingFriendRemarkUpdate(info, operatorType);
          break;
        }
        case "friendUpdate": {
          // 处理事件 好友更新
          this.eventHandlingFriendUpdate(info);
          break;
        }
        case "groupShutupAll": {
          // 全员禁言
          this.eventHandgroupShutupAll(info);
          break;
        }
        case "friendAdd": {
          // 添加好友
          this.eventHandAddFriend(info);
          break;
        }
        case "deleteFriend": {
          // 删除好友
          this.eventHandDeleteFriend(info);
          break;
        }
        case "cheduledDeletionConfig": {
          this.eventUpdateReadCancel(info);
          break;
        }
        case "clearAll": {
            // 清除全部信息
            const loginId = eventCommon.fnCommonInfoRU({
              getId: "loginId",
            });
            const dbName = loginId + "-68-2.0.3"; // 替换为你的数据库名
            const request = indexedDB.deleteDatabase(dbName);
            request.onsuccess = function(event) {
                console.log(`数据库 "${dbName}" 删除成功`);
            };

            request.onerror = function(event) {
              console.error(`删除数据库失败:`, event.target.error);
            };

            request.onblocked = function(event) {
              console.warn(`数据库 "${dbName}" 删除被阻塞（可能有其他连接未关闭）`);
            };
            Cache(`${loginId}MessageGroupList`,[]);
            Cache(`${loginId}MessageUserList`, []);
            Cache(`${loginId}MessageChannelList`, []);
            this.chats = [];
            // for (const item of this.chats) {
            //   this.eventHandlingChatDelete({ ...item, isDeleteLocal: true });
            // }
          break;
        }
        case "openGroupDialog":
          {
            // 打开 群会话框时，存储这个群信息
            this.groupDialogInfo = info.values;
          }
          break;
        case "bfAddressSet":
          // 保存到通讯录，更新当前会话列表
          this.eventbfAddressSet(info);
          break;
        case "msgListPropertyUpdate":
          // /信息发送成功还是失败状态
          this.eventUpdateMsgStatus(info);
          break;
        case "updateNewFriendReqTotal":
          // 新好友申请待处理总数
          this.contactsUnreadCount = info?.total || 0;
          break;
        case "searchSpecifiedChat":
          // 搜索指定的聊天窗口记录
          this.searchSpecifiedChat = info || {};
          break;
        case "deleteChat":
          // 删除聊天窗口
                console.log('eventHandlingChatDelete-1-')
          this.eventHandlingChatDelete(info);
          break;
        case "channelDisturbSet":
          const {id, isDisturb} = info;
          if(id) {
            // 同步状态
            eventCommon.fnDisturbInfoSync({
              id,
              type: 'channel',
              bfDisturb: Boolean(isDisturb),
              isDisturb: Boolean(isDisturb)
            });
            this.eventSetChannelDisable(id, isDisturb);
          }
          break;
        case "contactListReload": {
          this.eventHandlingContactListReload(info);
          break;
        }
        default:
      }
    },
    /**
     * 批量事件处理
     * @param {Array} messages - 消息数组 [{ data, operatorType, timestamp }]
     * @param {string} operator - 事件类型
     */
    handleBatchEvent(messages, operator) {
      if (messages.length === 0) return;

      switch (operator) {
        case "msgNew":
          this.handleBatchMsgNew(messages);
          break;
        case "msgListPropertyUpdate":
          this.handleBatchMsgPropertyUpdate(messages);
          break;
        default:
          // 未知的批量事件，逐条处理
          messages.forEach((msg) => {
            this.eventHandling(msg.data, operator, msg.operatorType);
          });
      }
    },
    /**
     * 批量处理新消息 - 更新会话列表
     * @param {Array} messages - 消息数组
     */
    async handleBatchMsgNew(messages) {
      if (messages.length === 0) return;

      // 过滤掉需要跳过的消息
      const validMessages = messages.filter((msg) => {
        const info = msg.data;
        // 跳过禁言状态的通知消息
        if (info.messageProtocolId) return false;
        return true;
      });

      if (validMessages.length === 0) return;

      // 处理全员禁言消息
      for (const msg of validMessages) {
        if (msg.operatorType === "groupShutupAll") {
          await this.eventHandgroupShutupAll(msg.data);
        }
      }

      // 收集所有需要更新的信息，然后批量更新
      let chats = this.chats;
      let channels = this.channels;
      let groups = this.groups;
      let unreadObj = this.unreadObj;
      let needNotify = null; // 最后一条需要通知的消息

      for (const msg of validMessages) {
        const info = msg.data;
        const updateInfos = await eventChat.fnChatWindowUpdate(
          {
            updateInfo: info,
            chats,
            channels,
            groups,
            friendList: this.friendList,
            unreadObj,
          },
          msg.operatorType
        );

        if (updateInfos.chatList) {
          chats = updateInfos.chatList;
          chatTopSize = updateInfos.chatTopSize;
          needNotify = info;
        }

        if (updateInfos.unreadObj) {
          unreadObj = updateInfos.unreadObj;
        }
      }

      // 一次性更新状态
      if (chats !== this.chats) {
        this.chats = _.cloneDeep(chats);
      }

      if (unreadObj !== this.unreadObj) {
        this.unreadObj = unreadObj;
      }

      // 只对最后一条消息发通知
      if (needNotify) {
        eventMsg.fnAlertNotification(needNotify, this.chats);
      }

      // 如果当前会话在批量消息中，更新当前会话的未读
      if (this.infoActive) {
        const activeKey = this.infoActive.id + this.infoActive.type;
        const hasActiveUpdate = validMessages.some(
          (msg) => msg.data.id + msg.data.type === activeKey
        );
        if (hasActiveUpdate && this.unreadObj[activeKey]) {
          eventBase.fnCommunicationSendMsg({
            operator: "activeChange",
            data: {
              ...this.infoActive,
              unreadObj: this.unreadObj[activeKey],
            },
          });
        }
      }
    },
    /**
     * 批量处理消息状态更新
     * @param {Array} messages - 消息数组
     */
    handleBatchMsgPropertyUpdate(messages) {
      if (messages.length === 0) return;

      const chats = _.cloneDeep(this.chats);
      let hasUpdate = false;

      for (const msg of messages) {
        const info = msg.data;
        for (let i = 0; i < chats.length; i++) {
          if (chats[i].id == info.id) {
            chats[i].readStatus = info.readStatus;
            hasUpdate = true;
            break;
          }
        }
      }

      if (hasUpdate) {
        this.chats = chats;
        Cache(
          `${loginId}MessageGroupList`,
          chats.filter((item) => item.type === "group")
        );
      }
    },
    // 设置消息列表的频道静音状态
    eventSetChannelDisable(channelId, state) {
        let chats = _.cloneDeep(this.chats);
       // 使用 == 进行弱类型比较，防止 channelId 类型不一致（String vs Number）导致匹配失败
       const index = chats.findIndex(item => item.channelId == channelId);
       if(index >= 0) {
          chats[index].isDisturb = state;
          // 必须同时更新 bfDisturb，因为 UI 使用 (bfDisturb || isDisturb) 判断。
          // 如果只更新 isDisturb 为 false，而 bfDisturb 仍为 true，UI 仍会显示免打扰。
          chats[index].bfDisturb = state;
          this.chats = chats;
          Cache(
            `${loginId}MessageChannelList`,
            chats.filter((item) => item.type === "channel")
          );
       };
    },
    eventUpdateMsgStatus(info) {
      // 信息发送成功还是失败更新会话列表里的readStatus
      const chats = _.cloneDeep(this.chats);
      for (let i = 0; i < chats.length; i++) {
        let item = chats[i];
        if (item.id == info.id) {
          item.readStatus = info.readStatus;
          break;
        }
      }
      this.chats = chats;
      Cache(
        `${loginId}MessageGroupList`,
        chats.filter((item) => item.type === "group")
      );
    },
    eventUpdateReadCancel(info) {
      // 开启阅后即焚或者关闭，更新当前窗口的信息
      const index = this.chats.findIndex(
        (item) => item.id === info.id && item.type === "group"
      );

      if (index !== -1) {
        this.chats[index].bfReadCancel = info.bfReadCancel;
        this.chats[index].msgCancelTime = info.msgCancelTime;

        // 即时渲染
        if (this.navType === 0) {
          this.chats = _.cloneDeep(this.chats);
        }

        Cache(
          `${loginId}MessageGroupList`,
          this.chats.filter((item) => item.type === "group")
        );
      }

      // 更新通讯录里的群
      const groupsIndex = this.groups.findIndex((item) => item.id === info.id);

      if (groupsIndex !== -1) {
        this.groups[groupsIndex].bfGroupReadCancel = info.bfReadCancel;
        this.groups[groupsIndex].groupMsgCancelTime = info.msgCancelTime;

        Cache(`${loginId}-GroupList`, this.groups);
      }
    },
    /**
     * 处理事件 置顶设置
     */
    eventHandlingBfTopSet(info) {
      const values = eventChat.fnChatsUpdateBfTop(this.chats, info);

      if (values) {
        this.chatTopSize = values.chatTopSize;
        this.chats = values.list;

        // 保存到本地
        Cache(
          `${loginId}MessageGroupList`,
          this.chats.filter((item) => item.type === "group")
        );

        Cache(
          `${loginId}MessageUserList`,
          this.chats.filter((item) => item.type === "friend")
        );
      }
    },
    eventbfAddressSet(info) {
      // console.log('home-left, 291 ---------->', info, this.groups)
      // 保存到通讯录，更新当前会话列表
      this.eventUpdateChats(info);
      this.eventUpdateGroups(info);
    },
    eventUpdateChats(info) {
      // 更新会话列表
      const chats = _.cloneDeep(this.chats);
      for (let i = 0; i < chats.length; i++) {
        const item = chats[i];
        if (item.id == info.id && item.type == info.type) {
          item.bfAddress = info.bfAddress;
          break;
        }
      }
      this.chats = chats;
      // 更新本地会话列表文件
      Cache(
        `${loginId}MessageGroupList`,
        chats.filter((item) => item.type === "group")
      );
    },
    eventUpdateGroups(info) {
      // 更新群列表
      const groups = _.cloneDeep(this.groups);
      for (let i = 0; i < groups.length; i++) {
        const item = groups[i];
        if (item.id == info.id) {
          item.bfAddress = info.bfAddress;
          break;
        }
      }
      this.groups = groups;
      // 更新本地群列表文件
      Cache(`${loginId}-GroupList`, groups);
    },
    /**
     * 处理事件 全员禁言
     */
    async eventHandgroupShutupAll(info) {
      // 全员禁言
      let chats = _.cloneDeep(this.chats);
      let groups = _.cloneDeep(this.groups);
      const index = chats.findIndex(
        (item) => item.id === info.id && item.type === "group"
      );

      if (index !== -1) {
        chats[index].bfShutup = info.bfShutup;
        // 即时渲染
        this.chats = chats;
        Cache(
          `${loginId}MessageGroupList`,
          chats.filter((item) => item.type === "group")
        );
      }

      // 更新群列表群的禁言状态信息
      const curGroup = groups.find((item) => item.id == info.id);
      if (curGroup) {
        curGroup.bfShutup = info.bfShutup;
        this.groups = groups;
        Cache(`${loginId}-GroupList`, groups);
      }
    },
    /**
     * 处理事件 好友备注更新 只更新备注名
     */
    eventHandlingFriendRemarkUpdate(info, operatorType) {
      const { id, values } = info;
      // 聊天窗口列表，只更新备注名
      if (operatorType === "name") {
        let chats = _.cloneDeep(this.chats);
        // 1. 更新好友会话名称
        const index = chats.findIndex(
          (item) => item.id === id && item.type === "friend"
        );
        if (index !== -1) {
          chats[index].name = values.name;
        }

        // 2. 更新群聊预览中的发送者名称
        // 获取好友原始昵称（用于回退）
        const friend = this.friendList.find(f => f.id === id);
        const nickName = friend ? friend.nickName : "";
        const displayName = values.name || nickName; // 有备注用备注，没备注用昵称

        let hasUpdate = false;
        if (displayName) {
          chats.forEach((item) => {
            if (item.type === "group" && item.sendUid == id) {
              const newSendUserName = displayName + "：";
              if (item.sendUserName !== newSendUserName) {
                item.sendUserName = newSendUserName;
                hasUpdate = true;
              }
            }
          });
        }

        if (index !== -1 || hasUpdate) {
          // 即时渲染
          this.chats = chats;
        }
      }
      // 更新好友列表
      const friendIndex = this.friendList.findIndex((item) => item.id === id);
      if (friendIndex != -1) {
        if (operatorType === "name") {
          this.friendList[friendIndex].name = values.name;
          // 只有名称才需要及时渲染
          this.friendList = _.cloneDeep(this.friendList);
        } else {
          this.friendList[friendIndex].depict = values.depict;
        }
      }
    },
    eventHandAddFriend(info) {
      let chats = _.cloneDeep(this.chats);
      let friends = _.cloneDeep(this.friendList);
      let friendIndex = chats.findIndex((item) => item.id == info.id);
      // 如果是删除得好友，重新加回来，会话列表里还有好友得聊天窗，则直接覆盖原来得好友信息就好
      if (friendIndex !== -1) {
        chats[friendIndex] = { ...info };
      } else {
        chats.unshift(info);

        friends.push(info);

        const { letters, letterIndexs, friendList } =
          eventFriend.fnFriendListFormat(friends);

        this.letters = letters;
        this.letterIndexs = letterIndexs;
        this.friendList = friendList;
        // 把新好友存储进本地文件
        Cache(
          `${loginId}MessageUserList`,
          chats.filter((item) => item.type === "friend")
        );
      }
      this.chats = chats;
    },
    // 删除好友处理
    eventHandDeleteFriend(info) {
      let chats = _.cloneDeep(this.chats);
      let friends = _.cloneDeep(this.friendList);
      friends = friends.filter((item) => item.id !== info.id);
      chats = chats.filter((item) => item.id !== info.id);
      // 删除本地数据
      Cache(`${loginId}-ContactList`, friends);
      Cache(
        `${loginId}MessageUserList`,
        chats.filter((item) => item.type === "friend")
      );
      this.friendList = friends;
      this.chats = chats;
      // 删除所有好友聊天信息
      eventBase.fnCommunicationSendMsg({
        operator: "msgDelete",
        data: {
          id: info.id,
          type: "friend",
          idsDelete: [],
          isRemoteDeletion: false,
          isDeleteChatWindow: false,
        },
      });

      // 删除未读消息
      const unreadKey = info.id + "friend";
      if (this.unreadObj[unreadKey]) {
        delete this.unreadObj[unreadKey];
        this.unreadObj = _.cloneDeep(this.unreadObj);
        Cache(`${loginId}-unread`, {
          unread: this.unreadObj,
        });
        this.updateUnreadCount();
      }
    },
    /**
     * 处理事件 群详情数据同步
     */
    eventHandlingGroupUpdate(info) {
      const dataNew = eventGroup.fuGroupUpdate({
        info: { ...info.values, id: info.id, type: info.type },
        groups: this.groups,
        chats: this.chats,
      });
      this.groups = _.cloneDeep(dataNew.groups);
      // 聊天列表更新
      if (dataNew.chats) {
        this.chats = _.cloneDeep(dataNew.chats);
      }
    },
    /**
     * 处理事件 频道更新
     */
    eventHandlingChannelUpdate(info) {
      const dataNew = eventChannel.fnChannelUpdate({
        info: { ...info.values, channelId: info.channelId },
        channels: this.channels,
        chats: this.chats,
      });
      this.channels = _.cloneDeep(dataNew.channels);
      // 聊天列表更新
      if (dataNew.chats) {
        this.chats = _.cloneDeep(dataNew.chats);
      }
    },
    /**
     * 处理事件 通讯录全量更新 (好友、群组、频道)
     * 接收全量数据列表，进行本地数据的更新、缓存以及聊天列表的同步
     * @param {Object} data - 包含 friendList, groupList, channelList 的对象
     */
    eventHandlingContactListReload(data) {
      if (!data || typeof data !== 'object') return;

      const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

      // 1. 更新好友列表数据
      // 格式化好友数据以适应通讯录组件
      if (Array.isArray(data.friendList)) {
        const { letters, letterIndexs, friendList: formatedList } =
          eventFriend.fnFriendListFormat(data.friendList);
        this.letters = _.cloneDeep(letters);
        this.letterIndexs = _.cloneDeep(letterIndexs);
        this.friendList = _.cloneDeep(formatedList);
      }

      // 2. 更新群组列表数据
      if (Array.isArray(data.groupList)) {
        this.groups = _.cloneDeep(data.groupList);
        Cache(`${loginId}-GroupList`, this.groups);
      }

      // 3. 更新频道列表数据
      if (Array.isArray(data.channelList)) {
        this.channels = _.cloneDeep(data.channelList);
        // ChannelList 已经在 init.vue 中缓存了，这里更新内存即可
      }

      // 准备 Map 用于快速查找，提高后续遍历聊天列表时的匹配效率
      const friendMap = new Map(this.friendList.map((f) => [String(f.id), f]));
      const groupMap = new Map(this.groups.map((g) => [String(g.id), g]));
      const channelMap = new Map(this.channels.map((c) => [String(c.channelId || c.id), c]));

      const chats = this.chats;
      const newChats = [];
      const deletedIds = []; // 存储已删除或退出的会话 {id, type}
      let hasUpdate = false;

      // 遍历当前聊天列表，同步最新信息并标记无效会话
      for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        const chatIdStr = String(chat.id);
        let isDeleted = false;
        let isUpdated = false;

        if (chat.type === "friend") {
          const friend = friendMap.get(chatIdStr);
          if (friend) {
            // 好友存在，同步关键信息 (头像、昵称、备注、免打扰等)
            if (chat.pic !== (friend.pic || '')) { chat.pic = friend.pic || ''; isUpdated = true; }
            if (chat.identify !== friend.identify) { chat.identify = friend.identify; isUpdated = true; }
            if (chat.depict !== (friend.depict || '')) { chat.depict = friend.depict || ''; isUpdated = true; }
            if (chat.nickName !== friend.nickName) { chat.nickName = friend.nickName; isUpdated = true; }

            if (chat.bfTop !== Boolean(friend.bfTop)) { chat.bfTop = Boolean(friend.bfTop); isUpdated = true; }
            if (friend.bfDisturb !== undefined && chat.bfDisturb !== Boolean(friend.bfDisturb)) {
                chat.bfDisturb = Boolean(friend.bfDisturb);
                isUpdated = true;
                // 同步全局免打扰状态
                eventCommon.fnDisturbInfoSync({ id: chat.id, type: "friend", bfDisturb: chat.bfDisturb });
            }
            if (friend.bfReadCancel !== undefined && chat.bfReadCancel !== Boolean(friend.bfReadCancel)) { chat.bfReadCancel = Boolean(friend.bfReadCancel); isUpdated = true; }

            if (friend.msgCancelTime !== undefined && chat.msgCancelTime !== friend.msgCancelTime) { chat.msgCancelTime = friend.msgCancelTime; isUpdated = true; }
            if (friend.bfTopTime && chat.bfTopTime !== friend.bfTopTime) { chat.bfTopTime = friend.bfTopTime; isUpdated = true; }

            const newName = friend.name || friend.nickName;
            if (chat.name !== newName) { chat.name = newName; isUpdated = true; }

            if (isUpdated) hasUpdate = true;
          } else {
            // 好友已不在最新的好友列表中，标记为删除
            isDeleted = true;
          }
        } else if (chat.type === "group") {
          const group = groupMap.get(chatIdStr);
          if (group) {
             // 群组存在，同步信息
             // 尝试更新发送者昵称 (如果能找到对应的群成员/好友信息)
             if (chat.sendUid) {
                const senderFriend = friendMap.get(String(chat.sendUid));
                if (senderFriend) {
                    const displayName = senderFriend.name || senderFriend.nickName;
                    if (displayName) {
                        const newSendUserName = displayName + "：";
                        if (chat.sendUserName !== newSendUserName) {
                            chat.sendUserName = newSendUserName;
                            hasUpdate = true;
                        }
                    }
                }
             }

             // 同步群组基础信息 (名称、头像、免打扰)
             const newGroupName = group.name || group.groupName;
             if (newGroupName && chat.name !== newGroupName) {
                chat.name = newGroupName;
                hasUpdate = true;
             }
             const newGroupPic = group.pic || group.icon || group.headerImage;
             if (newGroupPic && chat.pic !== newGroupPic) {
                chat.pic = newGroupPic;
                hasUpdate = true;
             }
             if (group.bfDisturb !== undefined && chat.bfDisturb !== Boolean(group.bfDisturb)) {
                chat.bfDisturb = Boolean(group.bfDisturb);
                hasUpdate = true;
                eventCommon.fnDisturbInfoSync({ id: chat.id, type: "group", bfDisturb: chat.bfDisturb });
             }
          } else {
            // 已退出群组
            isDeleted = true;
          }
        } else if (chat.type === "channel") {
          const channel = channelMap.get(chatIdStr);
          if (channel) {
             // 频道存在，同步信息 (名称、头像、免打扰)
             const newChannelName = channel.channelName || channel.name;
             if (newChannelName && chat.name !== newChannelName) {
                chat.name = newChannelName;
                hasUpdate = true;
             }
             const newChannelPic = channel.icon || channel.pic || channel.headerImage;
             if (newChannelPic && chat.pic !== newChannelPic) {
                chat.pic = newChannelPic;
                hasUpdate = true;
             }
             // 同步双向免打扰字段
             if (channel.bfDisturb !== undefined && chat.bfDisturb !== Boolean(channel.bfDisturb)) {
                chat.bfDisturb = Boolean(channel.bfDisturb);
                hasUpdate = true;
                eventCommon.fnDisturbInfoSync({ id: chat.id, type: "channel", bfDisturb: chat.bfDisturb });
             }
             if (channel.isDisturb !== undefined && chat.isDisturb !== Boolean(channel.isDisturb)) {
                chat.isDisturb = Boolean(channel.isDisturb);
                hasUpdate = true;
                eventCommon.fnDisturbInfoSync({ id: chat.id, type: "channel", isDisturb: chat.isDisturb });
             }
          } else {
             // 已退出频道
             isDeleted = true;
          }
        }

        if (isDeleted) {
          deletedIds.push({ id: chat.id, type: chat.type });
          hasUpdate = true;
        } else {
          newChats.push(chat);
        }
      }

      // 处理被删除的会话 (好友被删、退群、退频道)
      if (deletedIds.length > 0) {
        let hasUnreadUpdate = false;
        deletedIds.forEach(item => {
           const { id, type } = item;

           // 发送 msgDelete 事件通知其他组件清理
           eventBase.fnCommunicationSendMsg({
            operator: "msgDelete",
            data: {
              id: id,
              type: type,
              idsDelete: [],
              isRemoteDeletion: false,
              isDeleteChatWindow: false,
            },
          });

          // 清理未读消息缓存
          const unreadKey = id + type;
          if (this.unreadObj[unreadKey]) {
            delete this.unreadObj[unreadKey];
            hasUnreadUpdate = true;
          }

          // 如果是当前正在打开的窗口，需要触发关闭或提示
           if (
              this.infoActive &&
              this.infoActive.id === id &&
              this.infoActive.type === type
            ) {
              this.$emit("handDeleteCurrentChat", { id, type });
            }
        });

        // 如果有未读数变化，更新全局未读缓存
        if (hasUnreadUpdate) {
            this.unreadObj = _.cloneDeep(this.unreadObj);
            Cache(`${loginId}-unread`, {
                unread: this.unreadObj,
            });
            this.updateUnreadCount();
        }
      }

      if (hasUpdate) {
         // 对新的聊天列表进行排序
         const info = eventChat.fnChatListSort(newChats);
         this.chats = info.list;
         chatTopSize = info.chatTopSize;

         // 更新各类型本地缓存，确保下次加载时数据准确
         const friendChats = [];
         const groupChats = [];
         const channelChats = [];

         this.chats.forEach(item => {
            if (item.type === "friend") friendChats.push(item);
            else if (item.type === "group") groupChats.push(item);
            else if (item.type === "channel") channelChats.push(item);
         });

         Cache(`${loginId}MessageUserList`, friendChats);
         Cache(`${loginId}MessageGroupList`, groupChats);
         Cache(`${loginId}MessageChannelList`, channelChats);

         // 刷新界面未读数
         this.updateUnreadCount();
       }

       // 4. 异步同步群组和频道的详细状态（如免打扰），因为列表接口可能不返回这些字段
       // 这步操作只针对存在的会话进行，且分批执行，避免阻塞 UI
       this.syncChatDetails();
     },
    /**
     * 异步同步聊天列表中群组和频道的详情（主要是免打扰状态）
     * 采用分批处理 + 延时策略，避免瞬间高并发导致页面卡顿或接口阻塞
     */
    async syncChatDetails() {
       // 防止重入：如果正在同步中，则跳过
       if (this.isSyncingDetails) return;
       this.isSyncingDetails = true;

       try {
           // 1. 筛选出需要更新的会话 (仅针对当前聊天列表中的会话，不涉及整个通讯录)
           const chatFriends = this.chats.filter(c => c.type === 'friend');
           const chatGroups = this.chats.filter(c => c.type === 'group');
           const chatChannels = this.chats.filter(c => c.type === 'channel');

           if (chatFriends.length === 0 && chatGroups.length === 0 && chatChannels.length === 0) return;

           let hasUpdate = false;

           // 更新单个会话的辅助函数：对比数据并在变化时更新
           const updateChat = (id, type, data) => {
             const index = this.chats.findIndex(c => String(c.id) === String(id) && c.type === type);
             if (index > -1) {
                 let isChanged = false;
                 const chat = this.chats[index];

                 Object.keys(data).forEach(key => {
                      // bfDisturb: 免打扰
                      // bfReadCancel/bfGroupReadCancel: 阅后即焚
                      // bfJoinCheck: 进群审核
                      // bfJoinFriend: 群内加好友
                      // bfShutup: 禁言
                      // bfAddress: 保存到通讯录
                      // bfStar: 星标
                      // bfTop: 置顶
                      // bfPushNotice: 推送通知
                      // isDisable: 禁用状态
                      if (['bfDisturb', 'isDisturb', 'bfReadCancel', 'bfGroupReadCancel', 'bfJoinCheck', 'bfJoinFriend', 'bfShutup', 'bfAddress', 'bfStar', 'bfTop', 'bfPushNotice', 'isDisable'].includes(key)) {
                           if (data[key] !== undefined && chat[key] !== Boolean(data[key])) {
                               chat[key] = Boolean(data[key]);
                               isChanged = true;

                               // 特殊处理免打扰同步，确保通知其他组件（如系统托盘、通知栏）
                               if (key === 'bfDisturb') eventCommon.fnDisturbInfoSync({ id: chat.id, type, bfDisturb: chat.bfDisturb });
                               if (key === 'isDisturb' && type === 'channel') eventCommon.fnDisturbInfoSync({ id: chat.id, type, isDisturb: chat.isDisturb });
                           }
                      } else if (data[key] !== undefined && chat[key] !== data[key]) {
                           // 增加 undefined 检查，防止意外覆盖
                           chat[key] = data[key];
                           isChanged = true;
                      }
                 });

                 if (isChanged) {
                     // 使用 splice 替换对象来触发响应式更新，确保 UI 即时反映
                     this.chats.splice(index, 1, chat);
                     return true;
                 }
             }
             return false;
           };

           // 分批处理函数：控制并发数量并插入延时
           const processBatch = async (items, type, fn) => {
              const batchSize = 5; // 每次并发 5 个请求
              for (let i = 0; i < items.length; i += batchSize) {
                  const batch = items.slice(i, i + batchSize);
                  // 并行处理当前批次
                  await Promise.all(batch.map(item => fn(item)));

                  // 主动延时 100ms，让出主线程，防止密集请求占用过多 CPU 或网络资源
                  await new Promise(r => setTimeout(r, 100));
              }
           };

           // 2. 分别处理三种类型的会话详情同步
           // 并行执行三种类型的同步，提高效率
           await Promise.all([
               // 同步好友 (私聊) 详情
               processBatch(chatFriends, 'friend', async (chat) => {
                  try {
                      // 构造参数，注意这里只传 targetUid
                      const res = await getContactsDetail({ targetUid: chat.id });
                      const info = res?.contactsDetailBase;
                      if (info) {
                          // 构造更新数据，参考 eventFriend.fnFriendDetailsGet 的逻辑
                          const updateData = {
                             bfDisturb: info.bfDisturb,
                             bfReadCancel: info.bfReadCancel,
                             msgCancelTime: info.msgCancelTime,
                             bfMyBlack: info.bfMyBlack,
                             addToken: info.addToken,
                          };

                          // 同步头像和昵称
                          if (info.userInfo) {
                              if (info.userInfo.icon) {
                                  updateData.pic = info.userInfo.icon;
                              }
                              if (info.userInfo.nickName) {
                                  updateData.nickName = info.userInfo.nickName;
                              }
                              // 优先使用备注名，没有备注名采用用户的昵称
                              const name = _.get(info.userInfo, "friendRelation.remarkName") || info.userInfo.nickName;
                              if (name) {
                                  updateData.name = name;
                              }
                          }

                          if (updateChat(chat.id, 'friend', updateData)) {
                              hasUpdate = true;
                          }

                          // 同步好友阅后即焚配置
                          if (info.bfReadCancel) {
                               eventCheduledCeletion.fnFriendMsgConfigRUD({
                                   key: chat.id,
                                   value: info.msgCancelTime,
                               });
                           }
                      }
                  } catch (e) {
                      console.warn(`同步好友详情失败 ${chat.id}`, e);
                  }
               }),

               // 同步群组详情
              processBatch(chatGroups, 'group', async (chat) => {
                try {
                    const res = await getGroupDetail({ groupId: chat.id });
                    const {  errCode } = res?.commonResult || {};
                    if (res == 1021 || res == 12009 || errCode == 1021 || errCode == 12009) {
                        // 群被禁用
                         if (updateChat(chat.id, 'group', { isDisable: true })) {
                            hasUpdate = true;
                        }
                        return;
                    }
                    if (res && res.group) {
                        // 使用标准格式化函数
                        const groups = eventGroup.fnGroupDataFormat([
                           {
                               ...res.group,
                               bfAddress: true, // 保持与 fnGroupDetailGet 一致
                               qrExpire: res.qrExpire,
                               qrUrl: res.qrUrl,
                               shortLink: res.shortLink,
                               memberType: res.memberType,
                               bfJoinCheck: Boolean(res.group.bfJoinCheck),
                               groupNotice: res.groupNotice || "",
                               bfResetQrcode: res.bfResetQrcode,
                               bfDisturb: res.bfDisturb,
                                ...res.right,
                           }
                        ]);

                        if(groups && groups.length > 0) {
                            const info = groups[0];

                            // 同步群阅后即焚配置 (event/group.js 中的处理逻辑)
                            eventCheduledCeletion.fnGroupMsgConfigRUD(
                                info.bfGroupReadCancel
                                    ? {
                                          key: chat.id,
                                          value: info.groupMsgCancelTime,
                                      }
                                    : { deleteId: chat.id }
                            );

                            // 移除 undefined 字段，防止 updateChat 误判
                            const updateData = {};
                            Object.keys(info).forEach(key => {
                                // 过滤掉不需要同步的字段：
                                if (['bfAddress'].includes(key)) {
                                    return;
                                }

                                if (info[key] !== undefined) {
                                    updateData[key] = info[key];
                                }
                            });

                            // 详情成功时显式回写禁用状态，清理之前异常残留的 isDisable=true
                            updateData.isDisable = Boolean(info.isDisable);

                            if (updateChat(chat.id, 'group', updateData)) {
                                hasUpdate = true;
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`同步群详情失败 ${chat.id}`, e);
                }
              }),

              // 同步频道详情
              processBatch(chatChannels, 'channel', async (chat) => {
                  try {
                      const res = await getChannelDetail({ channelId: chat.id });
                      const info = res.data || res;
                      if (info) {
                          // 确保 channelId 存在
                          if (!info.channelId) info.channelId = chat.id;

                          // 使用标准格式化函数，确保数据格式统一
                          const channelData = eventChannel.fnChannelFormat(info);

                          // 如果名称或头像变化，更新显示的 name/pic 字段
                          if(channelData.channelName) channelData.name = channelData.channelName;
                          if(channelData.icon) channelData.pic = channelData.icon;

                          // 移除 undefined 字段，防止 updateChat 误判
                          const updateData = {};
                          Object.keys(channelData).forEach(key => {
                              if (channelData[key] !== undefined) {
                                  updateData[key] = channelData[key];
                              }
                          });

                          // 免打扰状态同步
                          if (info.isDisturb !== undefined) {
                              const state = Boolean(info.isDisturb);
                              updateData.isDisturb = state;
                              updateData.bfDisturb = state;
                          }

                          // 详情成功时显式回写禁用状态，避免历史 isDisable=true 残留
                          updateData.isDisable = Boolean(channelData.isDisable);

                          if (updateChat(chat.id, 'channel', updateData)) {
                              hasUpdate = true;
                          }
                      }
                  } catch (e) {
                      console.warn(`同步频道详情失败 ${chat.id}`, e);
                  }
              })
          ]);

          // 3. 如果有任何状态更新，同步到本地缓存并刷新未读数
      if (hasUpdate) {
          const friendChats = [];
          const groupChats = [];
          const channelChats = [];

          this.chats.forEach(item => {
             if (item.type === "friend") friendChats.push(item);
             else if (item.type === "group") groupChats.push(item);
             else if (item.type === "channel") channelChats.push(item);
          });

          Cache(`${loginId}MessageUserList`, friendChats);
          Cache(`${loginId}MessageGroupList`, groupChats);
          Cache(`${loginId}MessageChannelList`, channelChats);

          // 同步 isDisable 到 ChannelList 缓存（发消息查找依赖此缓存）
          let channelListDirty = false;
          channelChats.forEach(chat => {
              const idx = this.channels.findIndex(c => Number(c.channelId) === Number(chat.id));
              if (idx !== -1 && this.channels[idx].isDisable !== chat.isDisable) {
                  this.channels[idx].isDisable = chat.isDisable;
                  channelListDirty = true;
              }
          });
          if (channelListDirty) {
              Cache(`${loginId}-ChannelList`, this.channels);
          }

          // 同步 isDisable 到 GroupList 缓存（发消息查找依赖此缓存）
          let groupListDirty = false;
          groupChats.forEach(chat => {
              const idx = this.groups.findIndex(g => Number(g.id) === Number(chat.id));
              if (idx !== -1 && this.groups[idx].isDisable !== chat.isDisable) {
                  this.groups[idx].isDisable = chat.isDisable;
                  groupListDirty = true;
              }
          });
          if (groupListDirty) {
              Cache(`${loginId}-GroupList`, this.groups);
          }

          // 刷新未读数
          this.updateUnreadCount();
      }
    } finally {
        // 释放锁
        this.isSyncingDetails = false;
    }
  },
    /**
     * 处理事件 好友更新
     */
    eventHandlingFriendUpdate(info) {
      const dataNew = eventFriend.fnFriendUpdate({
        info,
        friends: this.friendList,
        chats: this.chats,
      });

      // 好友更新
      if (dataNew.friendData) {
        this.letters = _.cloneDeep(dataNew.friendData.letters);
        this.letterIndexs = _.cloneDeep(dataNew.friendData.letterIndexs);
        this.friendList = _.cloneDeep(dataNew.friendData.friendList);
      }

      // 聊天列表更新
      if (dataNew.chats) {
        this.chats = _.cloneDeep(dataNew.chats);
      }
    },
    /**
     * 处理事件 选中改变
     */
    eventHandlingActiveChange(info) {
      const idStr = info.id + info.type;
      if (info.comType === "chat") {
        if (this.navType !== 0) {
          this.navType = 0;
        }
      } else if (["channelNotice", "notificationGroup"].includes(info.comType)) {
        if (this.unreadObj[idStr]) {
          delete this.unreadObj[idStr];
          this.unreadObj = _.cloneDeep(this.unreadObj);
          Cache(`${loginId}-unread`, {
            unread: this.unreadObj,
          });
        }
      }
      this.updateUnreadCount();
    },
    /**
     * 处理事件 聊天窗口删除
     */
    eventHandlingChatDelete(info) {
      console.log('eventHandlingChatDelete-3-', info)
      const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
      const { id, type } = info;
      let chats = this.chats.filter(
        (item) => item.id !== id || item.type !== type
      );
      this.chats = chats;
      if (info.isDeleteLocal) {
        // 清除会话列表
        Cache(
          `${loginId}MessageGroupList`,
          chats.filter((item) => item.type === "group")
        );

        Cache(
          `${loginId}MessageUserList`,
          chats.filter((item) => item.type === "friend")
        );

        Cache(
          `${loginId}MessageChannelList`,
          chats.filter((item) => item.type === "channel")
        );

        // 清除通讯录列表
        if (type === "group") {
          this.groups = this.groups.filter((item) => item.id != id);
          Cache(`${loginId}-GroupList`, this.groups);
        } else if (type === "friend") {
          const friendList = this.friendList.filter((item) => item.id != id);
          if (friendList.length !== this.friendList.length) {
            const { letters, letterIndexs, friendList: newFriendList } =
              eventFriend.fnFriendListFormat(friendList);
            this.letters = letters;
            this.letterIndexs = letterIndexs;
            this.friendList = newFriendList;
            Cache(`${loginId}-ContactList`, this.friendList);
          }
        } else if (type === "channel") {
          this.channels = this.channels.filter(
            (item) => (item.channelId || item.id) != id
          );
          Cache(`${loginId}-ChannelList`).then((list) => {
            if (list && list.length) {
              const newList = list.filter(
                (item) => (item.channelId || item.id) != id
              );
              Cache(`${loginId}-ChannelList`, newList);
            }
          });
        }

        // 清除当前聊天框消息列表的数据
        eventMsg.fnMsgDelete({ info: { id, type, idsDelete: [] } });
        // 如果是当前窗口
        if (
          this.infoActive &&
          this.infoActive.id === id &&
          this.infoActive.type === type
        ) {
          this.$emit("handDeleteCurrentChat", info);
          // this.$router.push("/home");
        }
      }
    },
    /**
     * 处理事件 添加新消息
     */
    async eventHandlingMsgNew(info, operatorType) {
      // 如果用户是禁言状态，信息是通知解禁的提示消息则不需要更新左侧会话框
      if (info.messageProtocolId) {
        return;
      }

      // 如果是隐藏消息且在当前会话窗口，跳过会话列表更新
      if (info.skipChatListUpdate) {
        return;
      }

      if (operatorType == "groupShutupAll") {
        await this.eventHandgroupShutupAll(info);
      }

      const updateInfos = await eventChat.fnChatWindowUpdate(
        {
          updateInfo: info,
          chats: this.chats,
          channels: this.channels,
          groups: this.groups,
          friendList: this.friendList,
          unreadObj: this.unreadObj,
        },
        operatorType
      );

      // 聊天列表有变更，则更新聊天列表
      if (updateInfos.chatList) {
        this.chats = _.cloneDeep(updateInfos.chatList);
        chatTopSize = updateInfos.chatTopSize;
        eventMsg.fnAlertNotification(info, this.chats);
      }

      // 未读有变更，则更新未读
      if (updateInfos.unreadObj) {
        this.unreadObj = updateInfos.unreadObj;

        // 如果为当前，则需要更新当前的未读
        if (
          this.infoActive &&
          this.infoActive.id === info.id &&
          this.infoActive.type === info.type
        ) {
          // 通讯
          eventBase.fnCommunicationSendMsg({
            operator: "activeChange",
            data: {
              ...this.infoActive,
              unreadObj:
                this.unreadObj[this.infoActive.id + this.infoActive.type],
            },
          });
        }
      }
    },
    /**
     * 缓存频道的详情
     */
    async eventChannelDetailCache(info) {
      if(!info?.channelId) return;
      const cloneInfo = _.cloneDeep(info);
      if (cloneInfo.isDisturb !== undefined) {
        cloneInfo.bfDisturb = Boolean(cloneInfo.isDisturb);
      }
      const index = this.chats.findIndex(item => item.channelId === info.channelId)
      if(index >= 0) {
        Object.assign(this.chats[index], cloneInfo);
        if (cloneInfo.isDisturb !== undefined) {
          eventCommon.fnDisturbInfoSync({
            id: this.chats[index].id,
            type: 'channel',
            bfDisturb: Boolean(cloneInfo.isDisturb),
            isDisturb: Boolean(cloneInfo.isDisturb),
          });
        }
      }
      let cacheList = await Cache(`${loginId}MessageChannelList`) || [];
      const cacheIndex = cacheList.findIndex(item => item.channelId === info.channelId)
      if(cacheIndex >= 0) {
        Object.assign(cacheList[cacheIndex], cloneInfo);
        Cache(`${loginId}MessageChannelList`, cacheList);
      }
    },
    /**
     * 处理事件 我已读消息
     */
    eventHandlingMsgReadForMe(info) {
      const { id, type, unreadInfo } = info;
      // 如果有新的未读对象
      if (unreadInfo) {
        this.unreadObj = {
          ...this.unreadObj,
          [id + type]: unreadInfo,
        };
      } else {
        // 如果没有新的未读对象，则为全部已读
        delete this.unreadObj[id + type];
        this.unreadObj = _.cloneDeep(this.unreadObj);
      }

      // 数据同步到本地
      Cache(`${loginId}-unread`, {
        unread: this.unreadObj,
      });
    },
    /**
     * 处理事件 消息删除
     */
    eventHandlingMsgDelete(info) {
      // // 更新会话列表对应会话框的content
      const { id, type, lastInfo, isOtherPlatformOperate, unreadMsgCount } =
        info;

      let chats = _.cloneDeep(this.chats);
      let isUpdate = false;
      // 更新消息列表
      for (let i = 0; i < chats.length; i++) {
        let item = chats[i];
        if (item.type == type && id == item.id) {
          // 如果有content,表示回传了msg的上一条信息
          if (lastInfo) {
            item.chatType = lastInfo.chatType;
            item.content = this.fnFormatmsgLast(lastInfo);

            // 解决删除消息后，会话框显示的发送名字、时间问题
            // 更新时间和ID
            if (lastInfo.sendTime) {
              item.time = lastInfo.sendTime;
              item.sendTime = lastInfo.sendTime;
            }
            if (lastInfo.MsgID) {
              item.MsgID = Number(lastInfo.MsgID);
            }
            // 更新发送者名字
            if (item.type === 'group') {
                let sendUserName = lastInfo.sendUserName || "";
                if (!sendUserName && !lastInfo.isSelf && lastInfo.user) {
                   const name = lastInfo.user.name || lastInfo.user.nickName;
                   if (name) {
                      sendUserName = name + "：";
                   }
                }
                item.sendUserName = sendUserName;
            }
          } else {
            item.content = "";
            // 因为删除掉所有数据了，所以把chatType 设为null
            item.chatType = null;
          }
          isUpdate = true;
          break;
        }
      }
      // if (isOtherPlatformOperate) {
        // 更新未读
        // 手机端等其它端操作删除信息，判断删除信息所属所属好友或者群的未读数,
        // 如果当前删除的信息发送时间大于记录未读数的时间，则未读数-1
        let curUnreadObj = this.unreadObj[id + type];
        if (curUnreadObj) {
          curUnreadObj = _.cloneDeep(curUnreadObj);
          curUnreadObj.count = unreadMsgCount;
          this.unreadObj[id + type] = curUnreadObj;
        }
      // }

      if (isUpdate) {
        // 更新会话列表和会话列表本地文件
        this.chats = chats;

        Cache(
          `${loginId}${
            type === "group" ? "MessageGroupList" : "MessageUserList"
          }`,
          chats.filter((item) => item.type === type)
        );
      }
    },
    /**
     * 群通知
     */
    eventHandlingGroupNotification(info, operatorType) {
      let isChangeInfoActive = false;
      // 新群
      if (
        [
          "createGroupSelf",
          "createGroupFriend",
          "joinGroupQRCode",
          "joinGroupName",
        ].includes(operatorType)
      ) {
        // 通讯录 添加新群
        const group = {
          id: info.groupId,
          hostId: loginId,
          name: info.groupName,
          pic: info.pic,
          memberCount: info.memberCount,
          groupMsgCancelTime: 30,
          bfJoinCheck: false,
          bfJoinFriend: true,
        };
        if (
          this.groupDialogInfo &&
          this.groupDialogInfo.id == info.groupId &&
          operatorType == "joinGroupName"
        ) {
          group.groupAliasName = this.groupDialogInfo.groupAliasName;
          group.bfJoinFriend = this.groupDialogInfo.bfJoinFriend;
          group.hostId = this.groupDialogInfo.hostId;
          isChangeInfoActive = true;
        }
        if (!group.groupAliasName) {
          const groupInfoOld =
            this.groups.find((item) => item.id === info.groupId) || {};
          group.groupAliasName = groupInfoOld.groupAliasName || "";
        }
        this.groups = [
          ...this.groups.filter((item) => item.id !== group.id),
          group,
        ];
        Cache(`${loginId}-GroupList`, this.groups);
      }

      // 聊天窗口列表
      let chats = _.cloneDeep(this.chats);

      // 群通知 添加信息
      if (info.notification !== "") {
        if (
          this.chats.some((item) => item.id + item.type === "invitationgroup")
        ) {
          // 如果群通知窗口存在，则设置窗口信息
          for (const item of chats) {
            if (item.id === "invitation") {
              const invitationInfo = {
                ...item,
                content: info.notification,
                sendTime: info.time,
              };

              // 移除
              chats = chats.filter((n) => n.id !== "invitation");

              // 添加
              if (item.bfTop) {
                // 如果置顶
                chats = [invitationInfo, ...chats];
              } else {
                chats.splice(chatTopSize, 0, invitationInfo);
              }
            }
          }
        } else {
          // 如果群通知窗口不存在，则添加窗口
          chats.splice(chatTopSize, 0, {
            sendTime: info.time,
            name: "群通知",
            bfTop: false,
            pic: iconGroupNotification,
            id: "invitation",
            type: "group",
            count: 0,
            content: info.notification,
            chatType: 50,
            msgType: 50,
            result: null,
            sendUserName: "",
          });
        }

        // 如果当前不在群通知，设置未读
        if (
          !this.infoActive ||
          this.infoActive.id + this.infoActive.type !== "invitationgroup"
        ) {
          const unreadObj = _.cloneDeep(this.unreadObj);
          const idStr = "invitationgroup";

          unreadObj[idStr] = {
            time: info.time,
            count: unreadObj[idStr] ? unreadObj[idStr].count + 1 : 1,
            unreadMsgID: "",
          };

          this.unreadObj = unreadObj;

          Cache(`${loginId}-unread`, {
            unread: unreadObj,
          });
        }
      }
      let chatInfo = null;
      // 聊天窗口 添加信息
      // isHide 为 true 时，不更新会话列表最后一条消息
      if (info.content !== "" && !info.isHide) {
        chatInfo = chats.find(
          (item) => item.type === "group" && item.id === info.groupId
        );

        // 如果窗口存在,则修改窗口信息
        if (chatInfo) {
          // 移除聊天窗信息
          chats = chats.filter((item) => {
            return !(item.type === "group" && item.id === info.groupId);
          });
        } else {
          // 如果窗口不存在则创建新窗口
          chatInfo = {
            bfTop: false,
            count: 0,
          };
        }

        chatInfo = {
          ...chatInfo,
          sendTime: info.sendTime,
          id: info.groupId,
          name: info.groupName || chatInfo.name,
          pic: info.pic,
          type: "group",
          content: info.content,
          chatType: 50,
          msgType: 50,
          result: null,
          sendUserName: "",
        };

        // 如果群成员身份有变更
        if (info.memberType !== undefined) {
          chatInfo.memberType = info.memberType;
        }
        if (info.mute !== undefined) {
          chatInfo.mute = info.mute;
        }
        if (info.isDisable !== undefined) {
          chatInfo.isDisable = info.isDisable;
        }
        // 添加到列表
        if (chatInfo.bfTop) {
          // 如果置顶，则放到最顶部
          chats = [chatInfo, ...chats];
        } else {
          chats.splice(chatTopSize, 0, chatInfo);
        }
      }
      if (
        ["groupRemoveMember", "groupAddMember", "memberExit"].includes(
          operatorType
        )
      ) {
        // 新增或删除群成员，更新群成员数量
        for (let i = 0; i < chats.length; i++) {
          let curChat = chats[i];
          if (curChat.type === "group" && curChat.id === info.groupId) {
            curChat.memberCount = info.memberCount;
            break;
          }
        }
      }

      // 列表更新
      this.chats = chats;
      Cache(
        `${loginId}MessageGroupList`,
        chats.filter((item) => item.type === "group")
      );

      if (isChangeInfoActive) {
        // 点击群名片，直接进群后，切换到新群窗口
        setTimeout(() => {
          eventBase.fnCommunicationSendMsg({
            operator: "activeChange",
            data: {
              ...this.groupDialogInfo,
              type: "group",
              comType: "chat",
            },
          });
        }, 50);
      }

      // 退出群，解散群聊
      if (operatorType === "exit") {
        window.$db.deletTable({
          id: info.groupId,
          type: "group",
        });

        // 删除聊天
        this.eventHandlingChatDelete({
          ...info,
          type: "group",
          id: info.groupId,
          isDeleteLocal: true,
        });

        // 删除组
        this.groups = this.groups.filter((item) => item.id !== info.groupId);
        Cache(`${loginId}-GroupList`, this.groups);

        // 如果是当前窗口
        if (
          this.infoActive &&
          this.infoActive.id === info.groupId &&
          this.infoActive.type === "group"
        ) {
          // console.log("当前窗口退出 ------------> 931");
          eventBase.fnCommunicationSendMsg({
            operator: "activeChange",
            data: null,
          });
          // this.$router.push("/home");
        }
      }
    },
    /**
     * 设置拉伸的最大宽度
     */
    handleSetMaxWidth() {
      let width = document.body.clientWidth - 848;
      width = width < 0 ? 0 : width;
      this.listWidthMax = width + 261;
    },
    /**
     * 鼠标移动 拉伸的时候触发宽度改变
     */
    hanldeMousemove(e) {
      if (this.isEwResizeDown) {
        this.listWidth = e.clientX - 72;
        localStorage.setItem("listWidth", this.listWidth);
      }
    },
    /**
     * 鼠标up 拉伸的时候 结束拉伸
     */
    hanldeMouseup() {
      if (this.isEwResizeDown) {
        this.isEwResizeDown = false;
      }
    },
    /**
     * 右键删除当前窗口，清除本地文件数据
     */
    handleDeleteChats(info) {
      this.eventHandlingChatDelete({ ...info, isDeleteLocal: true });
    },
    // 格式化拿到的数据的content如果是 1||5 这样格式的数据
    fnFormatmsgLast(msgLast) {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      const isSelf = msgLast.sendUid === loginId;

      let friendInfo = null;

      if (!isSelf) {
        friendInfo = this.friendList.find(
          (item) => item.id === msgLast.sendUid
        );
      }

      if (msgLast.chatType === 51 && msgLast.content.includes("||")) {
        let arr = msgLast.content.split("||");
        let str = i18n.t("设置了消息已读XX后销毁");

        let timeStr = "";
        const second = arr[1];
        if (second < 60) {
          timeStr = second + i18n.t("秒");
        } else if (second < 60 * 60) {
          timeStr = second / 60 + i18n.t("分钟");
        } else if (second < 60 * 60 * 24) {
          timeStr = second / (60 * 60) + i18n.t("小时");
        } else {
          timeStr = second / (60 * 60 * 24) + i18n.t("天");
        }
        str = str.replace("XX", timeStr);
        return isSelf
          ? "你" + str
          : (friendInfo.name || friendInfo.nickName) + " " + str;
      }
      return msgLast.content;
    },
  },
  watch: {
    unreadObj: {
       handler(newV, oldV) {
        this.updateUnreadCount()
      },
      immediate: true,
      deep: true,
    },
    chats() {
      this.updateUnreadCount()
    },
    groups: {
      handler(newGroups, oldGroups) {
        this.$emit("setGroups", newGroups);
      },
      immediate: false,
      deep: true,
    },
    navType(value) {
      if(value === 0) {
        this.addAction = false;
        this.searchText = "";
      } else if (value === 1) {
        this.refreshFriendList();
      }
    }
  },
  created() {
    // 监听点击通知
    ipcRenderer.on("notification-clicked", (e, data) => {
      const chatInfo = this.chats.find((item) => item.id === data.id);
      // 通讯
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: { ...chatInfo, comType: "chat" },
      });
    });
  },
  mounted() {
    // 事件 处理监听
    this.handleEventMonitor();

    // 获取登录id
    loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });

    // 初始化好友备注名
    eventFriend.initFriendRemarkName(loginId);

    // 同步未读
    Cache(`${loginId}-unread`).then((res) => {
      if (res && res.unread) {
        this.unreadObj = res.unread;
      }
    });

    // 获取好友列表
    Cache(`${loginId}-ContactList`).then((res) => {
      if (res && res.length > 0) {
        const { letters, letterIndexs, friendList } =
          eventFriend.fnFriendListFormat(res);

        this.letters = letters;
        this.letterIndexs = letterIndexs;
        this.friendList = friendList;
      }
    });

    // 群列表同步
    Cache(`${loginId}-GroupList`).then((res) => {
      this.groups = res || [];
      // console.log('groups ------------>', res)
    });

    // 频道列表同步
    // 俩列表不同步，这里做兼容处理
    Promise.all([
      Cache(`${loginId}MessageChannelList`),
      Cache(`${loginId}-ChannelList`),
    ]).then((res) => {
      const messageChannelList = res[0] || [];
      const channelList = res[1] || [];
      let channels = [
        ...messageChannelList,
        ...channelList,
      ];
      // 以channelId去重，messageChannelList优先
      const channelMap = new Map();
      channels.forEach(item => {
        const channelId = item.channelId || item.id;
        if (!channelMap.has(channelId)) {
          channelMap.set(channelId, item);
        }
      });
      this.channels = Array.from(channelMap.values());
    //   console.log('ChannelList ------------>', this.channels)
    });

    // 好友备注同步
    Cache(`${loginId}-FriendRemarks`).then((res) => {
      eventCommon.fnFriendRemarksSet(res)
    })

    Cache(`${loginId}-newFriendReqTotal`).then(res => {
      this.contactsUnreadCount = res?.total || 0;
    })

    // 获取聊天窗口列表
    this.handleChatsGet();

    if (timerCacheDB) {
      clearInterval(timerCacheDB);
    }

    // 定时缓存数据库，后面干掉
    timerCacheDB = setInterval(() => {
      cacheDB(loginId);
    }, 30000);

    // 鼠标监听 拉伸功能
    document.addEventListener("mousemove", this.hanldeMousemove);
    document.addEventListener("mouseup", this.hanldeMouseup);

    // 设置拉伸的最大宽度
    this.handleSetMaxWidth();

    // 当前框口发送变化的时候，重新计算拉伸的最大宽度
    window.addEventListener("resize", this.handleSetMaxWidth);

    // 获取上次的拉伸宽度
    this.listWidth = localStorage.getItem("listWidth");
  },
  beforeDestroy() {
    // 移除通信事件的监听机制
    eventBase.fnCommunicationMonitoring("homeLeft", null);

    // 移除定时导出数据库
    if (timerCacheDB) {
      clearInterval(timerCacheDB);
    }

    // 移除监听 框口大小变化
    window.removeEventListener("resize", this.handleSetMaxWidth);

    // 移除鼠标监听
    document.removeEventListener("mousemove", this.hanldeMousemove);
    document.removeEventListener("mouseup", this.hanldeMouseup);
  },
};
</script>
<style lang="scss">
.homeLeft {
  display: flex;
}

.add-btn {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.new-friend {
  display: flex;
  align-items: center;
  padding: 10px 20px !important;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;

  .title {
    margin-left: 10px;
    font-size: 14px;
    color: #000;
  }

  .unread {
      position: absolute;
      left: 36px;
      top: 2px;
      margin-top: 4px;
      padding: 1px 7px;
      display: inline-block;
      font-size: 12px;
      background: #f44e5a;
      font-weight: 400;
      border-radius: 10px;
      transform: scale(0.86);
      color: #fff;
      text-align: center;
      white-space: nowrap;
      z-index: 2;
  }
}

.add-cancel {
  font-size: 12px;
  color: #000;
  margin-left: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.comList {
  min-width: 261px;
  border-right: 1px solid #eee;
  background-color: rgb(252, 252, 252);
  display: flex;
  flex-direction: column;
  position: relative;

  .icon-back {
    height: 16px;
    margin-right: 10px;
    cursor: pointer;
  }

  > .search {
    // padding-top: 45px;
    padding-bottom: 10px;
    padding-right: 10px;
    display: flex;
    align-items: center;
  }

  > i {
    position: absolute;
    right: -5px;
    top: 0;
    bottom: 0;
    width: 6px;
    z-index: 10;
    cursor: ew-resize;
  }

  > div {
    padding: 0 16px;
  }

  > section {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .no-data {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: absolute;
    text-align: center;
    width: 100%;
  }

  .contact-menu-box {
    padding: 5px 0;
    min-width: 70px;
    text-align: left;

    li {
      padding: 0;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      height: auto;
      text-align: center;
      line-height: 30px;
      width: 120px;

      &:hover {
        background: #f5f5f5;
      }
    }
  }
}
</style>
