<template>
  <div class="homeLeft">
    <ComNav
      :navType="navType"
      :unreadCount="unreadCount"
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
        <ComSearch
          :searchText="searchText"
          :unreadObj="unreadObj"
          :archiveIdStrList="archiveIdStrList"
          :unreadCount="unreadCount"
          :archiveListShow="archiveListShow"
          :placeholder="addAction ? '搜索手机号/ID/群别名' : $t('搜索')"
          @onChange="(value) => (searchText = value)"
          @handleBack="handleBack"
          key="all-search"
        > 
          <template #right>
            <span class="add-cancel" v-if="addAction" @click="addAction = false">取消</span>
            <img class="add-btn" v-else @click="addAction = true" src="@/assets/images/headNav/add_blue.png" />
          </template>
        </ComSearch>
      </div>
      <ComSearchAddContacts 
        v-if="addAction && searchText"
        :searchText="searchText"
        :searchAddContactsIng.sync="searchAddContactsIng"
      />
      <section v-if="!searchAddContactsIng">
        <template v-if="searchText === ''">
          <ComChats
            v-if="navType === 0"
            :list="chats"
            :unreadObj="unreadObj"
            :unreadCount="unreadCount"
            :archiveListShow="archiveListShow"
            :infoActive="
              infoActive &&
              ['friend', 'group', 'notificationGroup'].includes(infoActive.type)
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
import ComChats from "./chats";
import ComNav from "./nav/index";
import ComSearchAddContacts from "../com/add-contacts/search-add-contacts";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventGroup from "@/event/group";
import eventFriend from "@/event/friend";
import eventChat from "@/event/chat";
import eventMsg from "@/event/msg";

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
    };
  },
  provide() {
    return {
      provideSearchText: this.handleSearchText,
    };
  },
  computed: {
    /**
     * 未读总数
     */
    unreadCount() {
      let count = 0;
      // console.log(this.chats, this.unreadObj, '--------------123')
      for (const item of this.chats) {
        const idStr = item.id + item.type;
        const isExist = eventCommon.fnDisturbIdStrListRU({
          idStrIsExist: idStr,
        });

        if (!isExist && this.unreadObj[idStr]) {
          count += this.unreadObj[idStr].count || 0;
        }
      }
      return count;
    },
  },
  methods: {
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
    /**
     * 获取聊天窗口列表
     */
    async handleChatsGet() {
      Promise.all([
        Cache(`${loginId}MessageGroupList`),
        Cache(`${loginId}MessageUserList`),
      ]).then((res) => {
        const groupChats = res[0] || [];
        const friendChats = res[1] || [];
        const info = eventChat.fnChatListSort([
          ...this.chats,
          ...groupChats,
          ...friendChats,
        ]);

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
        ],
        this.eventHandling
      );
    },
    /**
     * 处理事件
     */
    eventHandling(info, operator, operatorType) {
      // console.log({ info, operator, operatorType }, "homeLeft --------> 220");
      if (!info) {
        return;
      }

      switch (operator) {
        case "bfDisturbSet": {
          // 处理事件 免打扰设置
          if (info.type === "friend") {
            this.eventHandlingFriendUpdate(info);
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
          for (const item of this.chats) {
            this.eventHandlingChatDelete({ ...item, isDeleteLocal: true });
          }
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
        default:
      }
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
        const index = chats.findIndex(
          (item) => item.id === id && item.type === "friend"
        );

        if (index !== -1) {
          chats[index].name = values.name;
          // 更新会话列表的群类型会话框
          chats.forEach((item) => {
            if (item.type === "group" && item.sendUid == id) {
              item.sendUserName = values.name + "：";
            }
          });

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
      } else if (info.comType === "notificationGroup") {
        if (this.unreadObj[idStr]) {
          delete this.unreadObj[idStr];
          this.unreadObj = _.cloneDeep(this.unreadObj);
          Cache(`${loginId}-unread`, {
            unread: this.unreadObj,
          });
        }
      }
    },
    /**
     * 处理事件 聊天窗口删除
     */
    eventHandlingChatDelete(info) {
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
      if (operatorType == "groupShutupAll") {
        await this.eventHandgroupShutupAll(info);
      }

      const updateInfos = eventChat.fnChatWindowUpdate(
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
          } else {
            item.content = "";
            // 因为删除掉所有数据了，所以把chatType 设为null
            item.chatType = null;
          }
          isUpdate = true;
          break;
        }
      }
      if (isOtherPlatformOperate) {
        // 更新未读
        // 手机端等其它端操作删除信息，判断删除信息所属所属好友或者群的未读数,
        // 如果当前删除的信息发送时间大于记录未读数的时间，则未读数-1
        let curUnreadObj = this.unreadObj[id + type];
        if (curUnreadObj) {
          curUnreadObj = _.cloneDeep(curUnreadObj);
          curUnreadObj.count = unreadMsgCount;
          this.unreadObj[id + type] = curUnreadObj;
        }
      }

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
      if (info.content !== "") {
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
    groups: {
      handler(newGroups, oldGroups) {
        this.$emit("setGroups", newGroups);
      },
      immediate: false,
      deep: true,
    },
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
    Cache(`${loginId}-ChannelList`).then((res) => {
      this.channels = res || [];
      // console.log('ChannelList ------------>', res)
    });

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

  > .search {
    // padding-top: 45px;
    padding-bottom: 10px;
    padding-right: 10px;
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
