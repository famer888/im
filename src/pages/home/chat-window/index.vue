<template>
  <div class="chatContent" @dragenter="dropAreaVisible = true">
    <template v-if="chatContent">
      <ComGroupTopNoticeDialog
        v-if="groupTopNoticeContent !== '' && chatContent.type === 'group'"
        :groupId="chatContent.id"
        :content="groupTopNoticeContent"
        :memberInfos="memberInfos"
        :chatContent="chatContent"
        @close="groupTopNoticeContent = ''"
      />
      <ComTop
        v-if="chatContent.id !== ''"
        :chatContent="chatContent"
        :memberCount="memberCount"
        :selectedList="selectedList"
        :rightMenuVisible="rightMenuVisible"
        @topEvent="handleTopEvent"
        @forwardDialogShow="handleForwardDialogShow(true)"
      />
      <ComRightMenu
        v-if="rightMenuVisible && chatContent"
        :key="keyComRightMenu"
        :isGroupUpdate="isGroupUpdate"
        :chatContent="chatContent"
        :isGroup="chatContent.type === 'group'"
      />
      <ComNetworkTips />
      <ComChatMsgList
        :chatContent="chatContent"
        :selectedList="selectedList"
        :selectedIdList="selectedIdList"
        :memberInfos="memberInfos"
        :groupOwner="groupOwner"
        @msgSelectedChange="handleMsgSelectedChange"
        @rightClickMenuDisplay="handleRightClickMenuDisplay"
        @openGroupTopNoticeDialog="
          (content, uid) => {
            groupTopNoticeContent = `^#${uid}#$-${content}`;
          }
        "
      />
      <ComSend :chatContent="chatContent" :quoteInfo="quoteInfo" :editInfo="editInfo" />
      <ComDropArea v-if="dropAreaVisible" @close="dropAreaVisible = false" />
      <ComMemberDialog
        v-if="memberDialogInfo"
        :memberInfo="memberDialogInfo"
        :channelId="chatContent.type === 'channel' ? chatContent.id : ''"
        :groupId="chatContent.type === 'group' ? chatContent.id : ''"
        @close="memberDialogInfo = null"
      />
      <ComGroupDialog
        v-if="groupDialogInfo"
        :chatContent="chatContent"
        :groupInfo="groupDialogInfo"
      />
      <ComChannelDialog
        v-if="channelDialogInfo"
        :chatContent="chatContent"
        :info="channelDialogInfo"
      />
      <ComFileDialog
        v-if="uploadFiles.length > 0"
        :chatContent="chatContent"
        :files="uploadFiles"
        :quoteInfo="quoteInfo"
      />
      <ComForwardSelectDialog
        v-if="forwardSelectDialogVisible"
        :chatContent="chatContent"
        @close="handleCancelForwardSelectDialog"
        @submit="handleForwardSelectDialog"
      />
      <ComGroupNoticeDialog
        v-if="groupNoticeDialogVisible"
        :chatContent="chatContent"
        :historyNotice="historyNotice"
      />
      <ComChannelNoticeDialog
        v-if="channelNoticeDialogVisible"
        :chatContent="chatContent"
      />
      <!--    :historyNotice="historyNotice" -->
    </template>
    <vue-context class="contact-menu-box" ref="rightClickMenu" :lazy="true">
      <div class="menu-content" v-if="rightClickSelectedInfo">
        <li v-if="isRightClickMenuAt" @click.prevent="handleEditorAddAt(rightClickSelectedInfo)">
          <a>
            @{{ rightClickSelectedInfo.user.nickName }}
          </a>
        </li>
        <template v-else-if="imgErrorText">
          <li @click.prevent="handleCopyError(rightClickSelectedInfo)">
            <a>
              {{ $t("复制错误信息") }}
            </a>
          </li>
          <li
            v-if="
              ![50, 51, 52].includes(rightClickSelectedInfo?.chatType) &&
              isDeleteAll
            "
            @click.prevent="
              handleMesssgeDelete(
                [
                  {
                    msgId: rightClickSelectedInfo.MsgID,
                    customMsgId: rightClickSelectedInfo.customMsgId,
                  },
                ],
                true
              )
            "
          >
            <a>
              {{
                chatContent.type === "friend"
                  ? `从本地和 ${
                      setMaxLengthStr(
                        this.chatContent.name || this.chatContent.nickName,
                        18
                      ) || $t("移动端")
                    } 删除`
                  : $t("为所有人删除")
              }}
            </a>
            <img class="icon" src="@/assets/images/menu/delete.png" alt=""/>
          </li>
        </template>
        <template v-else>
          <li
            v-if="
              rightClickSelectedInfo &&
              [0, 1, 50, 51, 52, 16].includes(rightClickSelectedInfo?.chatType) &&
              selectedIdList.length === 0
            "
            @click.prevent="handleCopy(rightClickSelectedInfo)"
          >
            <a>{{
              $t("复制")
            }}</a>
            <img class="icon" src="@/assets/images/menu/copy.png" alt=""/>
          </li>
          <li
            v-if="
              rightClickSelectedInfo &&
              [1, 3, 7].includes(rightClickSelectedInfo?.chatType) &&
              selectedIdList.length === 0
            "
            @click.prevent="
              handleOperatorFile({
                id: chatContent.id,
                type: chatContent.type,
                info: rightClickSelectedInfo,
                openDialog: true,
              }, true)
            "
          >
            <a>
              {{ $t("另存为") }}
            </a>
            <img class="icon" src="@/assets/images/menu/save.png" alt=""/>
          </li>
          <li
            v-if="
              rightClickSelectedInfo &&
              [1, 3, 7].includes(rightClickSelectedInfo?.chatType) &&
              selectedIdList.length === 0
            "
            @click.prevent="
              handleOperatorFile({
                id: chatContent.id,
                type: chatContent.type,
                info: rightClickSelectedInfo,
                openDialog: false,
                isDir: true,
              })
            "
          >
            <a>
              {{ $t("打开目录") }}
            </a>
             <img class="icon" src="@/assets/images/menu/open_dir.png" alt=""/>
          </li>
          <li
            v-if="
              ![50, 51, 52].includes(rightClickSelectedInfo?.chatType) &&
              isDeleteAll && isChannelWithDeleteMessageAuthority
            "
            @click.prevent="
              handleMesssgeDelete(
                [
                  {
                    msgId: rightClickSelectedInfo.MsgID,
                    customMsgId: rightClickSelectedInfo.customMsgId,
                  },
                ],
                true
              )
            "
          >
            <a>
              {{
                chatContent.type === "friend"
                  ? `${$t('从本地和')} ${
                      setMaxLengthStr(
                        this.chatContent.name || this.chatContent.nickName,
                        18
                      ) || $t("移动端")
                    } ${$t('删除')}`
                  : $t("为所有人删除")
              }}
            </a>
             <img class="icon" src="@/assets/images/menu/delete.png" alt=""/>
          </li>
          <li
            @click="
              handleMesssgeDelete(
                [
                  {
                    msgId: rightClickSelectedInfo.MsgID,
                    customMsgId: rightClickSelectedInfo.customMsgId,
                  },
                ],
                false
              )
            "
          >
            <a>
              {{ $t("从本地删除") }}
            </a>
            <img class="icon" src="@/assets/images/menu/delete.png" alt=""/>
          </li>
          <li v-if="rightClickSelectedInfo"
            @click="
              handleMsgSelectedChange({
                id: rightClickSelectedInfo.customMsgId,
                isSelf: rightClickSelectedInfo.isSelf,
                chatType: rightClickSelectedInfo.chatType,
                msgId: rightClickSelectedInfo.MsgID,
                ...rightClickSelectedInfo
              })
            "
          >
            <a>
              {{ $t("选中") }}
            </a>
            <img class="icon" src="@/assets/images/menu/select.png" alt=""/>
          </li>
          <li
            v-if="
              rightClickSelectedInfo &&
              ![50, 51, 52].includes(rightClickSelectedInfo.chatType) &&
              selectedIdList.length === 0 &&
              !isChannelOrdinaryMember
            "
            @click="handleQuoteSet"
          >
            <a>
              {{ $t("回复") }}
            </a>
            <img class="icon" src="@/assets/images/menu/forward.png" alt=""/>
          </li>
          <!-- <li
            v-if="
              rightClickSelectedInfo &&
              [0].includes(rightClickSelectedInfo.chatType) &&
              selectedIdList.length === 0
            "
          >
            <a @click="handleEditMsg">
              编辑
            </a>
          </li> -->
          <li
            v-if="
              ![5, 8, 50, 51, 52].includes(rightClickSelectedInfo?.chatType) &&
              rightClickSelectedInfo &&
              (selectedIdList.length === 0 ||
                selectedIdList.includes(rightClickSelectedInfo.id))
            "
            @click="handleForwardDialogShow()"
          >
            <a>{{ $t("转发") }}</a>
            <img class="icon" src="@/assets/images/menu/share.png" alt=""/>
          </li>
          <li
            v-if="
            rightClickSelectedInfo &&
            ['test', 'uat'].includes(getEnvType())
            "
            @click="copyMsgInfo(rightClickSelectedInfo)"
          >
            <a>复制消息信息</a>
            <img class="icon" src="@/assets/images/menu/copy.png" alt=""/>
          </li>
          <li
            v-if="
              rightClickSelectedInfo
              && readUserTotal
            "
          >
            <a v-if="readUserTotal">{{ readUserTotal }} 个已读</a>
            <a v-else>{{ rightClickSelectedInfo.readUsers?.length  }} 个送达</a>
            <img class="icon" src="@/assets/images/menu/more.png" alt=""/>

            <div class="menu-two-box">
              <div v-if="!readUsersInfo.length && readUserTotal">群成员加载中</div>
              <div class="read-user-item" v-for="(item, index) in readUsersInfo" :key="index">
                 <ComImage class="user-icon" :src="item.icon" type="friend" />
                 <div class="info">
                    <span class="user-name">{{ item.name || item.nickName }}</span>
                    <span class="time">
                      <img v-if="item.readState === 1" src="@/assets/images/message/has-read.png"/>
                      <img v-else src="@/assets/images/message/has-resive.png"/>
                      {{ formatTimeStamp(item.readTime) }}
                    </span>
                 </div>
              </div>
            </div>
          </li>
        </template>
      </div>
    </vue-context>
  </div>
</template>
<script>
import { Cache } from "@/cache";
import { getChannelUsers, getChannelManages } from "@/api/imChannel";

// 工具
import { setMaxLengthStr, textToEmojiText, formatTimeStamp, copyToClipboard, freeTime, channelMemberSort, enumMsgType } from "@/utils/base";
import { copyText, copyImg } from "@/utils/clipboard";
import { getEnvType } from "@/utils";
import { formatChannelManages } from "@/utils/formats";

// 控件
import ComTop from "./top";
import ComSend from "./send";
import ComChatMsgList from "./chat-msg-list";
import ComNetworkTips from "./network-tips.vue";

// 事件
import eventBase from "@/event/base";
import eventGroup from "@/event/group";
import eventFriend from "@/event/friend";
import eventCommon from "@/event/common";
import eventFile from "@/event/file";
import { benchmark } from "@/debuggers";

// 群成员列表
let memberInfoList = [];

// 好友列表
let friendList = [];

// 频道成员列表
let channelUserList = [];

export default {
  components: {
    ComTop,
    ComSend,
    ComChatMsgList,
    ComNetworkTips,
    ComGroupNoticeDialog: () => import("./right-menu/group-notice/dialog.vue"),
    ComChannelNoticeDialog: () => import("./right-menu/channel-notice/dialog.vue"),
    ComDropArea: () => import("./drop-area.vue"),
    ComMemberDialog: () => import("@/pages/home/com/member-dialog.vue"),
    ComGroupDialog: () => import("@/pages/home/com/group-dialog.vue"),
    ComChannelDialog: () => import("@/pages/home/com/channel-dialog.vue"),
    ComGroupTopNoticeDialog: () => import("./group-top-notice-dialog.vue"),
    ComRightMenu: () => import("./right-menu"),
    ComFileDialog: () => import("./file-dialog.vue"),
    ComForwardSelectDialog: () => import("./forward-select-dialog.vue"),
  },
  props: ["chatContent"],
  provide() {
    return {
      /**
       * 该方法注入群成员，子组件有用到则可以调用获取群成员，而不需要额外在去通过Cache获取
       */
      provideMemberList: () => {
        return memberInfoList;
      },
      provideFriendList: () => {
        return friendList;
      },
      provideChannelUserList: () => {
        return channelUserList;
      },
      provideGroupNotice: this.handeGroupNoticeDialog,
      provideSetTopNotice: this.handleSetTopNotice,
      provideUpdateGroupMember: this.handleUpdateGroupMember,
    };
  },
  data() {
    return {
      selectedList: [], // 消息选中列表
      forwardSelectDialogVisible: false, // 选择转发的对话框是否显示
      rightMenuVisible: false, // 右菜单是否显示
      rightClickSelectedInfo: null, // 右键点击选中的信息
      isRightClickMenuAt: false, // 右键点击头像 显示右键菜单at
      groupOwner: null, // 群主信息
      dropAreaVisible: false, // 拖拽区域 显示
      uploadFiles: [], // 上传文件列表
      quoteInfo: null, // 回复信息
      editInfo: null, // 编辑信息
      imgErrorText: null, // 图片错误文本
      memberInfos: {}, // 所有的群成员对象
      keyComRightMenu: 0, // key 更新右菜单用
      memberDialogInfo: null, // 成员会话框的信息
      groupDialogInfo: null, // 群会话框的信息
      channelDialogInfo: null, // 频道会话框的信息
      groupNoticeDialogVisible: false, // 群公告会话框是否显示
      channelNoticeDialogVisible: false, // 频道简介会话框是否显示
      groupTopNoticeContent: "", // 群顶部公告内容
      memberCount: 0, // 成员总数
      historyNotice: {
        notice: "",
        showHistoryNotice: false,
      },
      isGroupUpdate: false, // 是否群更新
      runTime: 0, // 运行时间
      isRun: null, // 定时器
      readUsersInfo: [], // 消息的已读用户信息
      readUserTotal: 0,
    };
  },
  computed: {
    selectedIdList() {
      return this.selectedList.map((item) => {
        return { id: item.id, msgId: item.msgId, customMsgId: item.customMsgId };
      });
    },
    /**
     * 判断是否是频道且有删除消息权限
     * adminPrivacy & 4 (bit 2) 表示删除消息权限
     */
    isChannelWithDeleteMessageAuthority() {
      if (this.chatContent?.type !== 'channel') return true;
      const adminPrivacy = this.chatContent?.adminPrivacy;
      if (!adminPrivacy) return false;
      return (adminPrivacy & 4) !== 0;
    },
    isDeleteAll() {
      const { type, memberType } = this.chatContent;
      if(this.isChannelOrdinaryMember) return false;
      return (
        this.rightClickSelectedInfo &&
        this.rightClickSelectedInfo.readStatus !== -1 &&
        (
          type === "friend" ||
          this.rightClickSelectedInfo.isSelf ||
          memberType !== 2
        )
      );
    },
    isChannelOrdinaryMember() {
        const { type, memberType } = this.chatContent;
        return type === 'channel' && memberType === 3;
    }
  },
  mounted() {
    const { id, type, adminPrivacy } = this.chatContent;
    memberInfoList = [];
    channelUserList = [];
    this.memberInfos = {};

    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });

    // 获取好友列表
    this.handleFriendList();
    if (type === "group") {
      // 获取群成员列表
      this.handleMemberListGet();
      // 获取群公告信
      Cache(`${loginId}-groupNotice`).then((res) => {
        if (res) {
          this.groupTopNoticeContent = res[id] || "";
        }
      });
      // 三分钟执行
      this.isRun = setInterval(() => {
          this.runTime += 1000;
          if (this.runTime >= 180000) {
            eventGroup.fnIntoGroup(id)
            clearInterval(this.isRun)
          }
        }, 1000)

    } else if(type === "channel") {
    //   this.handleChannelMemberGet();
    } else {
      // 获取好友详情
      eventFriend.fnFriendDetailsGet(id);
    }

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "chatWindow",
      [
        "memberDialogShow", // 显示成员会话框
        "groupNotification", // 群通知
        "msgDelete", // 消息删除
        "groupUpdate", // 群更新
        "channelUpdate", // 频道更新
        "groupQrCodeImageForward", // 群二维码图片转发
        "closeOperator", // 关闭操作
        "uploadFilesSet", // 上传文件设置
        "openGroupNoticeDialog", // 打开 群公告对话框
        "openChannelNoticeDialog", // 打开 频道简介对话框
        "openGroupDialog", // 打开 群会话框
        "friendRemarkUpdate", // 更新好友备注名
        "openChannelDialog", // 打开 频道对话框
        "friendUpdate", // 好友数据更新
      ],
      this.eventHandling
    );
  },
  beforeDestroy() {
    eventBase.fnCommunicationMonitoring("chatWindow", null);
    if (this.runTime < 180000) {
      // 如果小于三分钟离开群了，则不执行三分钟补偿机制
      // console.log('小于三分钟')
      clearInterval(this.isRun)
    }
  },
  methods: {
    getEnvType,
    formatTimeStamp,
    setMaxLengthStr,
     /**
     * 复制消息信息，只有测试环境和uat环境可用
     */
    copyMsgInfo(msgInfo) {
      const env = getEnvType();
      if(env !== 'test' && env !== 'uat') return;
      msgInfo.sendTimeStr = freeTime(msgInfo.sendTime, 'y-m-d h:i:s');
      const msgInfoStr = JSON.stringify({ ...msgInfo, sendLog: benchmark.getSendLogForRightMenu(msgInfo.MsgID, msgInfo.customMsgId) });
      copyToClipboard(msgInfoStr);
      window.$toast(this.$t("复制成功"));
    },
    getMsgReadUsersInfo(readUsers, msgInfo) {
      if(!readUsers?.length) return;
      let usersInfo = [];
      readUsers.forEach(item => {
        const userInfo = memberInfoList.find(i => i.id === item.userId);
        const sendTime = msgInfo?.sendTime || 0;
        const joinTime = userInfo?.joinTime || 0;
        if(userInfo && (!joinTime || sendTime > joinTime)) {
         usersInfo.push({...userInfo, ...item});
        }
      })
      usersInfo = usersInfo.sort((a, b) => b.readTime - a.readTime);
      this.readUsersInfo = usersInfo;
      this.readUserTotal = usersInfo.filter(item => item.readState === 1)?.length || 0;
    },
    /**
     * 文件操作
     */
    handleOperatorFile(data, keepOriginName) {
      if (data.info.local && data.info.local.indexOf("http") === 0) {
        data.info = {
          ...data.info,
          local: null,
        };
      }

      eventFile.fnOperatorFile(data, keepOriginName && data.info.chatType === enumMsgType.file);
    },
    /**
     * 转发选择对话框显示
     */
    handleForwardDialogShow(isSelect) {
      if (isSelect) {
        this.rightClickSelectedInfo = null;
      }
      // 打开 转发对话框
      eventCommon.fnCloseListRU({
        addId: "forwardSelectDialog",
      });

      // 转发选择对话框显示
      this.forwardSelectDialogVisible = true;
    },
    /**
     * 处理事件
     */
    eventHandling(info, operator, operatorType) {
      // console.log({info, operator, operatorType}, '>>>>>>>>>> chatWindow 440')
      switch (operator) {
        case "closeOperator": {
          // 关闭右键点击菜单
          this.$refs.rightClickMenu && this.$refs.rightClickMenu.close();

          for (const id of info.ids) {
            switch (id) {
              case "quoteInfoDialog": {
                // 关闭 引用信息对话框
                this.quoteInfo = null;
                break;
              }
              case "fileDialog": {
                // 关闭 文件对话框
                this.uploadFiles = [];
                break;
              }
              case "msgSelection": {
                // 关闭 选中对话框
                this.selectedList = [];
                break;
              }
              case "chatRightMenu": {
                // 关闭 聊天右菜单
                this.rightMenuVisible = false;
                break;
              }
              case "forwardSelectDialog": {
                // 关闭 转发选择对话框
                this.forwardSelectDialogVisible = false;
                break;
              }
              case "groupNoticeDialog": {
                // 关闭 群公告会话框
                this.groupNoticeDialogVisible = false;
                this.historyNotice = {
                  notice: "",
                  showHistoryNotice: false,
                };
                break;
              }
              case "channelNoticeDialog": {
                // 关闭 频道简介会话框
                this.channelNoticeDialogVisible = false;
                // this.historyNotice = {
                //   notice: "",
                //   showHistoryNotice: false,
                // };
                break;
              }
              case "memberDialog": {
                // 关闭 好友对话框
                this.memberDialogInfo = null;
                break;
              }
              case "groupDialog": {
                // 关闭 群对话框
                this.groupDialogInfo = null;
                break;
              }
              case "channelDialog": {
                // 关闭 群对话框
                this.channelDialogInfo = null;
                break;
              }
              default:
            }
          }
          return;
        }
        case "uploadFilesSet": {
          // 上传文件设置
          this.uploadFiles = info.uploadFiles;
          return;
        }
        case "groupQrCodeImageForward": {
          // 群二维码图片 转发

          // 设置信息
          this.rightClickSelectedInfo = info;

          // 显示转发弹窗
          this.forwardSelectDialogVisible = true;
          return;
        }
        case "openGroupNoticeDialog": {
          // 打开 群公告对话框
          this.groupNoticeDialogVisible = true;
          return;
        }
        case "openChannelNoticeDialog": {
          // 打开 频道简介对话框
          this.channelNoticeDialogVisible = true;
          return;
        }
        case "memberDialogShow": {
          // 显示成员会话框
          if (info.values) {
            this.memberDialogInfo = info.values;
          } else if (info.atName && this.chatContent.type === "friend") {
            // 如果是at名，则找到该成员
            this.memberDialogInfo = friendList.find(
              (item) => item.nickName === info.atName || item.name === info.atName
            );
            if(!this.memberDialogInfo) {
               window.$toast("抱歉，该用户/群/频道不存在");
            }
          } else if (info.atName && this.chatContent.type === 'channel') {
             // 频道成员查找
             const user = channelUserList.find(
                 (item) => item.userInfoDTO.nickName === info.atName || item.userInfoDTO.name === info.atName
             );

             let friend = null;
             if (user) {
                 friend = friendList.find(f => f.id === user.userInfoDTO.uid);
             } else {
                 // 如果频道成员列表中没找到，尝试在好友列表中查找
                 friend = friendList.find(f => f.nickName === info.atName || f.name === info.atName);
             }

             if (user || friend) {
                 const uid = user ? user.userInfoDTO.uid : friend.id;
                 const icon = user ? user.userInfoDTO.icon : friend.pic;
                 const name = user ? user.userInfoDTO.name : friend.name;
                 const nickName = user ? user.userInfoDTO.nickName : friend.nickName;
                 const targetMemberType = user ? user.memberType : 0;

                 // 计算是否不显示添加按钮
                 const currentMemberType = this.chatContent.memberType;
                 const notShowAddButton = (currentMemberType === 2 && (targetMemberType === 1 || targetMemberType === 2)) ||
                    (currentMemberType === 1 && targetMemberType === 2);

                 this.memberDialogInfo = {
                     id: uid,
                     icon: icon,
                     name: name,
                     nickName: nickName,
                     bfFriend: !!friend,
                     channelId: this.chatContent.id,
                     notShowAddButton,
                 };
             } else {
                 window.$toast("抱歉，该用户/群/频道不存在");
             }
          } else {
             // 如果是at名，则找到该成员
            this.memberDialogInfo = memberInfoList.find(
              (item) => item.nickName === info.atName || item.name === info.atName
            );
            if(!this.memberDialogInfo) {
               window.$toast("抱歉，该用户/群/频道不存在");
            }
          }
          break;
        }
        case "openGroupDialog": {
          // 打开 群会话框
          this.groupDialogInfo = info.values;
          break;
        }
        case "openChannelDialog": {
          // 打开 频道会话框
          this.channelDialogInfo = info.values;
          break;
        }

        case "friendRemarkUpdate": {
          // 更新好友备注名，同步更新chatlist里好友的备注名
          const memberInfos = _.cloneDeep(this.memberInfos)
          if(memberInfos[info.id] && info.values.name) {
            memberInfos[info.id].name = info.values.name
            this.memberInfos = memberInfos;
          }
          break;
        }

        case "friendUpdate": {
          // 好友信息更新
          if(info.id) {
             const loginId = eventCommon.fnCommonInfoRU({
              getId: "loginId",
            });
            const index = friendList.findIndex(item => item.id === info.id)
            if(index >= 0) {
              friendList[index] = {...friendList[index], ...info}
              Cache(`${loginId}-ContactList`, friendList)
            }
          }
          break;
        }

        default:
      }

      // 需要指定当前窗口才执行的
      if (info.id + info.type !== this.chatContent.id + this.chatContent.type) {
        return;
      }

      switch (operator) {
        case "groupNotification": {
          // 群通知，群成员变化
          this.eventHandlinGroupNotification(info, operatorType);
          break;
        }
        case "msgDelete": {
          // 删除完，直接清除选中的数据
          this.selectedList = [];
          break;
        }
        case "groupUpdate": {
          // 群更新
          this.isGroupUpdate = true;
          this.keyComRightMenu++;
          // console.log('groupUpdate >>>>>>>>>> 585', info)
          if (info.values){
            if (info.values.memberCount && info.values.memberCount !== this.memberCount) {
              // 群成员数量发生变化，则重新获取群成员列表
              this.handleMemberListGet();
            }
          }
          break;
        }

        default:
      }
    },
    eventHandlinGroupNotification(info, operatorType) {
      // console.log(info, 'chat-window ----群主更换---->575', operatorType)
      if (["groupRemoveMember", "groupAddMember", "memberExit"].includes(operatorType)) {
        this.memberCount = info.memberCount;
        setTimeout(() => {
          this.handleMemberListGet();
        }, 100);
      }
      if (operatorType == 'hostChange') {
        let count = 0;
        for (let i = 0; i < memberInfoList.length; i++) {
          let item = memberInfoList[i]
          if (item.id == info.newGroupOwner) {
            item.type = 0;
            count++;
          }
          if (item.id == info.oldGroupOwner) {
            item.type = 1;
            count++;
          }
          if(count == 2) {
            break;
          }
        }
      }
    },
    /**
     * 引用信息设置
     */
    handleQuoteSet() {
      // 添加 引用对话框
      eventCommon.fnCloseListRU({
        addId: "quoteInfoDialog",
      });

      // 设置引用信息
      this.quoteInfo = this.rightClickSelectedInfo;

      // 通讯 焦点到发送编辑栏
      eventBase.fnCommunicationSendMsg({
        operator: "sendEditorFoucs",
      });
    },
    /**
     * 编辑消息设置
     */
    handleEditMsg() {
      // 添加 引用对话框
      eventCommon.fnCloseListRU({
        addId: "quoteInfoDialog",
      });

      // 设置引用信息
      this.quoteInfo = this.rightClickSelectedInfo;
      this.editInfo = this.rightClickSelectedInfo;
      // console.log("editInfo-1-", this.editInfo)

      // 通讯 焦点到发送编辑栏
      eventBase.fnCommunicationSendMsg({
        operator: "sendEditorFoucs",
      });
    },
    handleCancelForwardSelectDialog() {
      this.forwardSelectDialogVisible = false;
    },
    /**
     * 转发 选中
     */
    handleForwardSelectDialog(info) {
      // 如果有选中
      if (info) {
        // 添加转发信息
        const forwardMessageList = [];

        // 如果是否分享二维码图片
        if (this.rightClickSelectedInfo && this.rightClickSelectedInfo.file) {
          setTimeout(() => {
            eventBase.fnCommunicationSendMsg({
              operator: "uploadFilesSet",
              data: {
                uploadFiles: [this.rightClickSelectedInfo.file],
              },
            });
          }, 200);
        } else {
          // 获取登录信息
          const loginInfo = eventCommon.fnCommonInfoRU({
            getId: "loginInfo",
          });

          const user = {
            uid: loginInfo.id,
            nickName: loginInfo.name,
            icon: loginInfo.icon,
          };

          // 右键菜单转发一个
          if (this.rightClickSelectedInfo) {
            forwardMessageList.push(
              this.rightClickSelectedInfo.isSelf
                ? {
                    ...this.rightClickSelectedInfo,
                    user,
                  }
                : this.rightClickSelectedInfo
            );
          } else if (this.selectedList.length > 0) {
            // 多选顶部菜单 转发多个
            for (const item of this.selectedList) {
              forwardMessageList.push(
                item.isSelf
                  ? {
                      ...item,
                      user,
                    }
                  : item
              );
            }
          }
        }

        // 清除选中
        this.selectedList = [];
        const forwardData = { ...info, comType: "chat", forwardMessageList };

        // 通讯 转发信息添加
        eventBase.fnCommunicationSendMsg({
          operator: "forwardInfoAdd",
          data: forwardData,
        });

        // 通讯 焦点到发送编辑栏
        eventBase.fnCommunicationSendMsg({
          operator: "sendEditorFoucs",
        });
      }
    },
    /**
     * 编辑器内容设置
     */
    handleEditorAddAt(info) {
      eventBase.fnCommunicationSendMsg({
        operator: "editorAddText",
        data: {
          id: this.chatContent.id,
          type: this.chatContent.type,
          text: " @" + info.user.nickName + " ",
        },
      });
    },
    async getImageInfo(imageUrl) {
        try {
            // 获取图片名称
            const url = new URL(imageUrl);

            const fileName = url.pathname.split('/').pop(); // 提取最后的文件名

            // 获取图片大小
            const response = await fetch(imageUrl, { method: 'HEAD' });

            const blob = await response.blob()

            if (!response.ok) throw new Error('无法获取图片信息');

            const size = response.headers.get('Content-Length'); // 从响应头获取大小
            if (!size) throw new Error('图片大小不可用');

            return {
                name: fileName,
                size: parseInt(size, 10), // 将文件大小转换为数字
                type: blob.type
            };
        } catch (error) {
            console.error('获取图片信息失败:', error.message);
            return null;
        }
    },
    /**
     * 右键点击显示菜单
     */
    async handleRightClickMenuDisplay(values) {
      const { e, info, isAvatar, imgErrorText } = values;
      // console.log(info, '715 ------------->', values)
      // 添加 右键点击菜单
      eventCommon.fnCloseListRU({
        addId: "rightClickMenu",
        removeIds: ["rightClickMenu", "chatRightMenu"],
      });

      // 图片错误文本
      this.imgErrorText = imgErrorText;

      // 如果右键点击头像 菜单只显示 at
      this.isRightClickMenuAt = Boolean(isAvatar);
      let data = {...info}
      if ([1, 3].includes(info.chatType) && info.content && info.content.startsWith('http')) {
        data = await this.handleImgAttr(data)
      }
      console.log(data, 'chat-window -------->738', this.chatContent)
      // 选中信息
      this.rightClickSelectedInfo = data;
      this.getMsgReadUsersInfo(data?.readUsers, info)

      // 打开右键菜单
      this.$refs.rightClickMenu && this.$refs.rightClickMenu.open(e);
    },
    /**
     * 消息选中改变
     */
    async handleMsgSelectedChange(values) {
      const { id, customMsgId } = values;

      if (this.selectedIdList.some((item) => item.customMsgId == customMsgId)) {
        // 移除
        this.selectedList = this.selectedList.filter((item) => customMsgId !== item.customMsgId);

        // 如果全部被移除
        if (this.selectedList.length === 0) {
          eventCommon.fnCloseListRU({
            removeIds: ["msgSelection"],
          });
        }
      } else {
        let data = {...values}
        if ([1, 3].includes(data.chatType) && data.content && data.content.startsWith('http')) {
          data = await this.handleImgAttr(data)
        }
        // 添加
        this.selectedList = [
          ...this.selectedList,
          {
            ...data
          },
        ];

        // 如果是添加的第一个
        if (this.selectedList.length === 1) {
          eventCommon.fnCloseListRU({
            addId: "msgSelection",
          });
        }
      }
    },
    async handleImgAttr(data) {
        let imgUrl = ''
        if (data.msgType == 1) {
          imgUrl = data.content.split('||')[0]
        } else {
          if (data.content.includes('*P')) {
            let videoUrl = data.content.split('*P')
            imgUrl = videoUrl[0]
            data.thumbUrl = videoUrl[1]
          } else {
            imgUrl = data.content.split('||')[0]
          }
          data.width = data.width || 300
          data.height = data.height || 80
        }

        let imgInfo = await this.getImageInfo(imgUrl)
        if (imgInfo) {
          data.text = imgUrl;
          data.url = imgUrl;
          data.fileName = imgInfo.name;
          data.fileSize = imgInfo.size;
          data.fileType = imgInfo.type;
          data.isHandle = true
          return data
        } else {
          return data
        }
    },
    /**
     * 消息删除
     */
    handleMesssgeDelete(idsDelete, isRemoteDeletion, isDeleteChatWindow) {
      eventBase.fnCommunicationSendMsg({
        operator: "msgDelete",
        data: {
          id: this.chatContent.id,
          type: this.chatContent.type,
          idsDelete,
          isRemoteDeletion,
          isDeleteChatWindow,
        },
      });
    },
    /**
     * 顶部事件触发
     */
    handleTopEvent(type) {
      switch (type) {
        case "mgsDeleteLocal": {
          // 选中消息 本地删除
          this.handleMesssgeDelete(this.selectedIdList, false, false);
          break;
        }
        case "mgsDeleteAllEquipment": {
          // 选中消息 所有设备删除
          this.handleMesssgeDelete(this.selectedIdList, true, false);
          break;
        }
        case "rightMenuVisibleShow": {
          // 聊天右键菜单改变 显示/隐藏
          this.isGroupUpdate = false;
          const { id, type } = this.chatContent;
          if(type === "friend") {
            eventFriend.fnFriendDetailsGet(id);
          }

          // 这里暂时加个延迟，临时解决rightMenu的mounted生命周期会执行两次
          setTimeout(() => {
             this.rightMenuVisible = true;
          }, 200)
          this.$refs.rightClickMenu && this.$refs.rightClickMenu.close();
          if (this.chatContent.isDisable) {
            window.$toast("该群已禁用");
          }
          break;
        }
        default:
      }
    },
    /**
     * 复制
     */
    handleCopy(info) {
      let { chatType, content, atUsers } = info;

      if ([0, 50, 51, 52, 16].includes(chatType)) {
        // 将at的真实昵称替换为备注
        if(atUsers?.length && content.includes("@")) {
          atUsers.forEach(item => {
            content = content.replace(item.nickName, item.name)
          })
        }
        copyText(textToEmojiText(content));
      } else if (chatType === 1) {
        copyImg(info.local);
      }
    },
    /**
     * 复制错误信息
     */
    handleCopyError(info) {
      const { id, type } = this.chatContent;
      const { content, MsgID, fileKey, customMsgId } = info;

      copyText(
        JSON.stringify({
          id,
          type,
          content,
          customMsgId,
          MsgID,
          fileKey,
          imgErrorText: this.imgErrorText,
        })
      );
    },

    handleUpdateNotice(data) {
      this.chatContent.notice = data.notice;

      if (!data.clearNotice) {
        this.handleSendNotice(data);
      }
    },
    handleSendNotice(data) {
      // 更新公告到msgList
      const { id, type } = this.chatContent;
      eventBase.fnCommunicationSendMsg({
        operator: "msgSend",
        data: {
          id,
          type,
          list: [
            { type: "text", values: { chatType: 8, content: data.notice } },
          ],
        },
      });
    },

    updateMemberInfos() {
      this.memberCount = memberInfoList.length;
      // console.log(this.chatContent, 'updateMemberInfos --------> 906', memberInfoList)
      const memberInfos = {};
      memberInfoList.forEach((item) => {
        memberInfos[item.id] = {
          name: item.name,
          icon: item.icon,
          nickName: item.nickName,
        };
      });
      this.memberInfos = memberInfos;
    },
    // 同步群成员和好友列表的信息
    syncFriendAndGroupMemberInfo() {
      let groupCountMin = memberInfoList.length < friendList.length
      let groupMember = memberInfoList
      if(groupCountMin) {
        groupMember.forEach( gInfo => {
          const fInfo = friendList.find(i => i.id === gInfo.id)
          if(fInfo) {
            gInfo.nickName=fInfo.nickName || gInfo.nickName
            gInfo.name=fInfo.name || gInfo.name
            gInfo.icon = fInfo.pic || gInfo.icon
          }
        })
      } else {
        friendList.forEach((fInfo) => {
          let ginfo = groupMember.find(i => i.id === fInfo.id)
          if(ginfo) {
            ginfo.name = fInfo.name || ginfo.name
            ginfo.nickName = fInfo.nickName || ginfo.nickName
            ginfo.icon = fInfo.pic || ginfo.icon
          }
        })
      }
      memberInfoList = groupMember;
    },
    handleChannelMemberGet() {
      const { channelId, adminPrivacy } = this.chatContent;
      if( !channelId ) return
      const prams = {
        pageNum: 1,
        pageSize: 20,
        channelId
      }
      if(adminPrivacy) {
        getChannelUsers(prams).then(res => {
            channelUserList = channelMemberSort(res.data?.rowList || []);
            this.keyComRightMenu++;
        })
      } else {
        getChannelManages(prams).then(res => {
            channelUserList = formatChannelManages(channelMemberSort(res.data?.rowList || []))
            this.keyComRightMenu++;
        })
      }
    },
    /**
     * 获取群成员
     */
    handleMemberListGet() {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      const cacheName = `${loginId}_${this.chatContent.id}_groupMemberList`;
      Cache(cacheName).then((res) => {
        if (res && res.length > 0) {
          if (res[0].id) {
            memberInfoList = _.orderBy(res, ["type"], ["asc"]);
            // 获取群成员后，找到当前群的群主信息，
            this.groupOwner = memberInfoList.find((item) => item.type === 0);
          } else {
            memberInfoList = _.orderBy(eventGroup.fnGroupMemberDataFormat(res));
            this.groupOwner = memberInfoList.find((item) => item.type === 0);
            Cache(cacheName, memberInfoList);
          }
          this.syncFriendAndGroupMemberInfo()
          this.updateMemberInfos();
        }
      });
    },
    /**
     * 获取好友列表
     */
    handleFriendList() {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      Cache(`${loginId}-ContactList`).then((res) => {
        if (res && res.length > 0) {
          friendList = res;
        }
      });
    },
    handeGroupNoticeDialog(data) {
      this.historyNotice = {
        ...data,
        showHistoryNotice: true,
      };
    },
    handleSetTopNotice({ notice, editorId }) {
      this.groupTopNoticeContent = `^#${editorId}#$-${notice}`;
    },
    handleUpdateGroupMember(member) {
      for (let i = 0; i < memberInfoList.length; i++) {
        let item = memberInfoList[i];
        if (item.id == member.id) {
          item.bfFriend = member.bfFriend;
          break;
        }
      }
    },
  },
  watch: {
    'chatContent.channelDetailDone': {
      handler(doneFetching) {
        // 为了确保adminPrivacy的值是最新的，所以需要在这里获取，而不是在mounted中获取
        const { id, type } = this.chatContent;
        if(type === "channel" && doneFetching) {
            this.handleChannelMemberGet();
        }
      },
      immediate: true,
    }
  }
};
</script>
<style lang="scss">
.chatContent {
  padding-top: 32px;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;

  > p {
    font-size: 12px;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    position: absolute;
    left: 0;
    right: 0;
    top: 83px;
    z-index: 9;
    background: #f6f6f6;

    > img {
      display: block;
      width: 12px;
      height: 12px;
      margin-right: 3px;
    }

    &.error {
      background: #fddcde;
      color: #f44e5a;

      > img {
        width: 16px;
        height: 16px;
        margin-right: 12px;
      }
    }
  }

  .contact-menu-box {
    border-radius: 8px;
    min-width: 320px;
    background: none;
    box-shadow: none;
    border: none;

    .menu-content {
      width: 180px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
    }

    .menu-two-box {
      position: absolute;
      left: 178px;
      bottom: 0;
      min-width: 130px;
      display: none;
      background: #ffffff;
      padding: 10px;
      border-radius: 8px;
      box-sizing: border-box;
      border: 1px solid #f0f0f0;
      overflow-y: auto;
      max-height: 300px;

      .read-user-item {
        width: 100%;
        display: flex;
        align-items: center;
        margin-top: 10px;

        &:first-child {
          margin-top: 0;
        }

        .user-icon {
         width: 28px;
         height: 28px;
         border-radius: 99px;
         overflow: hidden;
         flex-shrink: 0;
        }

        .info {
          display: flex;
          flex-direction: column;
          margin-left: 10px;
        }

        .user-name {
          font-size: 12px;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 80px;
        }
        .time {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
          display: flex;
          align-items: center;

          img {
            height: 12px;
          }
        }
      }
    }

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
      padding: 0 10px;
      box-sizing: border-box;

      &:hover {
        .menu-two-box {
          display: block;
        }
      }


      &:last-child {
        border: none;
      }

      .icon {
        max-height: 16px;
      }

      a {
        width: 100%;
        padding: 10px 0;
        color: #000;

        &:hover {
          background: none;
        }
      }
    }
  }
}
</style>
