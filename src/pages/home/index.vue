<template>
  <div class="layout">
    <HomeTop />
    <ComInit v-if="visibleLoad" :hide="visibleMain" @loaded="handleLoaded" />
    <template v-if="visibleMain">
      <ComHomeLeft
        :infoActive="infoActive"
        @handDeleteCurrentChat="infoActive = null"
        @setGroups="setGroups"
      />
      <div v-if="!visibleLoad" id="messageContent" class="messageContent">
        <div>
          <template v-if="infoActive">
            <DetailsGroup
              v-if="infoActive.comType === 'detailsGroup'"
              :key="infoActive.id"
              :info="infoActive"
            />
            <DetailsFriend
              v-else-if="infoActive.comType === 'detailsFriend'"
              :key="infoActive.id"
              :info="infoActive"
            />
            <!-- <DetailsChannel
              v-else-if="infoActive.comType === 'detailsChannel'"
              :key="infoActive.id"
              :info="infoActive"
            /> -->
            <GroupNotification
              v-else-if="infoActive.comType === 'notificationGroup'"
            />
            <ChatContent
              v-else-if="
                infoActive.comType === 'chat' ||
                infoActive.comType === 'detailsChannel'
              "
              :key="infoActive.id + infoActive.type"
              :chatContent="infoActive"
            />
          </template>
          <div v-else class="defaultContent">
            <img src="@/assets/images/common/defalut-icon.png" alt="" />
          </div>
        </div>
      </div>
      <ComSettingDialog
        v-if="visibleSettingDialog"
        @close="visibleSettingDialog = false"
      />
      <UpVersion
        v-if="visibleUpVersion"
        :info="infoUpVersion"
        @close="visibleUpVersion = false"
      />
    </template>
  </div>
</template>
<script>
import { ipcRenderer } from "@/platform";
import { Cache } from "@/cache";
import { websocketCreate, setWsUrl } from "@/socket";
import dayjs from "dayjs";
import ntpClient from "ntp-client";

// 工具
import { textToEmojiText, setTimeD } from "@/utils/base";
import { copyText } from "@/utils/clipboard";

// api
import { checkVersion, getUploadToken } from "@/api/imBase";
import { getChannelDetail } from "@/api/imChannel";

// 控件
import ComHomeLeft from "./home-left";
import ComInit from "./init.vue";
import HomeTop from "./home-top";

// 事件
import { intervalRunEvent, intervalRunEventClear } from "@/event";
import eventFriend from "@/event/friend";
import eventBase from "@/event/base";
import eventFile from "@/event/file";
import eventCommon from "@/event/common";

export default {
  components: {
    ComInit,
    ComHomeLeft,
    HomeTop,
    UpVersion: () => import("@/components/up-version.vue"),
    ComSettingDialog: () => import("./com/setting-dialog/index.vue"),
    ChatContent: () => import("./chat-window/index.vue"),
    DetailsGroup: () => import("./details/group.vue"),
    DetailsFriend: () => import("./details/friend.vue"),
    DetailsChannel: () => import("./details/channel.vue"),
    GroupNotification: () => import("./group-invitation.vue"),
  },
  data() {
    return {
      num: 0,
      visibleLoad: true,
      visibleMain: false,
      visibleUpVersion: false,
      visibleSettingDialog: false, // 设置对话框 是否显示
      url: "ocs.com",
      count: 0,
      infoUpVersion: {},
      infoActive: null,
      intervalName: null,
      groupList: [],
      loginId: null,
    };
  },
  provide() {
    return {
      handleFriendList: this.handleFriendList,
    };
  },
  created() {
    this.initNtpTime();
    // 定时每天更新一次

    this.intervalName = setInterval(() => {
      this.initNtpTime();
    }, 86400000);
  },
  mounted() {
    if (document.body.clientWidth < 700 && document.body.clientHeight < 600) {
      ipcRenderer.send("changeWindow", {
        width: 900,
        minWidth: 800,
        height: 600,
      });
    }
    this.loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });
    // 添加监听 设置事件监听器以跟踪文件下载成功的状态
    eventFile.fnMonitorDownloadFileDone(true);

    // 添加监听 设置键盘事件的监听机制
    document.addEventListener("keydown", this.handleKeydown);

    // 监听dom被点击
    const domApp = document.getElementById("app");
    if (domApp) {
      document.addEventListener("click", this.handleAppDomClick);
    }

    // 以300毫秒的间隔触发事件
    intervalRunEvent();

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "home",
      [
        "activeChange",
        "forwardInfoAdd",
        "closeOperator", // 关闭操作
        "chatMsgListSearchScrollTo",
        "friendUpdate",
        "groupUpdate",
        "groupShutupAll",
        "groupNotification",
        "cheduledDeletionConfig",
        "openSettingDialog", // 打开设置对话框
        "msgNew",
        "rcheduleDeletionSet",
        "bfAddressSet", // 保存到通讯录
        "bfTopSet",
        "bfDisturbSet", // 设置免打扰
        "channelDisturbSet", // 频道接收通知设置
      ],
      this.handleEventHandling
    );

    ipcRenderer.on("eventLogout", (e, args) => {
      // console.log(args, 148888);
      // 退出程序并注销必须登出
      eventCommon.fnLoginout();
    });

    // ipcRenderer.on("eventTestClick", (e, args) => {
    //   console.log(args, '--------> 153')
    // })
  },
  beforeDestroy() {
    // 移除监听 oss更新
    if (this.InitOssTimer) {
      clearInterval(this.InitOssTimer);
    }
    if (this.intervalName) {
      clearInterval(this.intervalName);
    }
    // 移除监听 移除事件监听器以跟踪文件下载成功的状态
    eventFile.fnMonitorDownloadFileDone(false);

    // 移除监听 移除通信事件的监听机制
    document.removeEventListener("keydown", this.handleKeydown);

    // 移除监听 以300毫秒的间隔触发事件
    intervalRunEventClear();
  },
  methods: {
    /**
     * app的dom被点击
     */
    handleAppDomClick() {
      // 关闭 右键点击菜单， 聊天右菜单，表情会话框
      eventCommon.fnCloseListRU({
        removeIds: ["rightClickMenu", "chatRightMenu", "emojiDialog"],
      });
    },
    /**
     * 按键点击事件的触发
     */
    handleKeydown(event) {
      // 检查是否按下了Ctrl+C（或Cmd+C在Mac上）
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        const selection = window.getSelection();
        // 如果复制的内容有表情图片，则拦截处理
        const range = selection.getRangeAt(0); // 获取选中的范围
        const container = document.createElement("div"); // 创建一个临时的容器
        container.appendChild(range.cloneContents()); // 克隆选中的内容并加入容器中

        // 获取容器内的 HTML 内容
        const innerHTML = container.innerHTML
          .replace(/<span[^>]*>/g, "")
          .replace(/<\/span>/g, "");

        if (innerHTML.includes("<img") && innerHTML.includes("pet_emoji")) {
          copyText(textToEmojiText(innerHTML));

          // 阻止默认的复制行为
          event.preventDefault();
        }
      }

      // 如果是退出键，对应按等级关闭对话框
      if (event.key === "Escape") {
        // 关闭最后一个
        eventCommon.fnCloseListRU({
          isCloseLast: true,
        });
      }

      // 传递键盘key
      eventBase.fnCommunicationSendMsg({
        operator: "keydown",
        data: {
          key: event.key,
        },
      });
    },
    /**
     * 事件的处理
     */
    async handleEventHandling(info, operator, operatorType) {
      // console.log({info, operator, operatorType},  '248 -----------> 主程序')
      if (
        [
          "activeChange",
          "forwardInfoAdd",
          "chatMsgListSearchScrollTo",
        ].includes(operator)
      ) {
        let curGroup = null;
        if (info) {
          curGroup = this.groupList.find((item) => item.id == info.id);
        }
        this.infoActive = {
          ...info,
          memberCount: curGroup ? curGroup.memberCount : "",
        };
        let channelDetail = {};
        if (info?.type === "channel" || info?.comType === "detailsChannel") {
          const res = await getChannelDetail({ channelId: info.channelId });
          channelDetail = res.data;
        }

        this.infoActive = {
          ...info,
          memberCount: curGroup ? curGroup.memberCount : "",
          ...channelDetail,
        };
      } else if (operator === "closeOperator") {
        for (const id of info.ids) {
          switch (id) {
            case "rcheduleDeletionConfigDialog": {
              // 关闭设置阅后即焚时间
              break;
            }
          }
        }
        // 关闭 转发选中对话框
        if (info.ids.includes("forwardInfoDialog")) {
          this.infoActive = {
            ...this.infoActive,
            forwardMessageList: null,
          };
        }
      } else if (operator === "openSettingDialog") {
        this.visibleSettingDialog = true;
      } else if (operator === "openGroupNoticeDialog") {
        this.infoActive = {
          ...this.infoActive,
        };
      } else {
        // 如果不是当前窗口，直接结束
        if (
          !this.infoActive ||
          this.infoActive.id + this.infoActive.type !== info.id + info.type
        ) {
          return;
        }

        switch (operator) {
          case "channelDisturbSet": {
            this.infoActive = {
              ...this.infoActive,
              isDisturb: info.isDisturb,
            };
            break;
          }
          case "bfDisturbSet": {
            this.infoActive = {
              ...this.infoActive,
              bfDisturb: info.bfDisturb,
            };
            break;
          }
          case "friendUpdate": {
            // 好友更新
            this.infoActive = { ...this.infoActive, ...info };
            break;
          }
          case "groupUpdate": {
            // 群更新
            this.infoActive = {
              ...this.infoActive,
              ...info.values,
              id: info.id,
              type: info.type,
            };
            break;
          }
          case "msgNew": {
            if (operatorType == "groupShutupAll") {
              // 全员禁言消息
              this.infoActive = {
                ...this.infoActive,
                bfShutup: info.bfShutup,
              };
            }
            if (
              info.groupId &&
              info.sendMember &&
              info.sendUid == this.loginId
            ) {
              // 如果是群消息，用户自己在app端发的消息，因为旧数据的原因，用户被设置成管理员后，没有更新到chats里的群身份类型，
              // 因此读取一下用户的消息包里的群成员身份，相等表示不需要更新，不相等则表示需要更新
              if (info.sendMember.type != this.infoActive.memberType) {
                this.infoActive = {
                  ...this.infoActive,
                  memberType: info.sendMember.type,
                };
              }
            }
            break;
          }
          case "groupNotification": {
            if (info.memberType !== undefined) {
              // 当前窗口，如果群通知有改变自己的群成员身份，则更新
              this.infoActive = {
                ...this.infoActive,
                memberType: info.memberType,
              };
            }
            // 如果群主或者管理员只禁言了我
            if (info.mute !== undefined) {
              this.infoActive = {
                ...this.infoActive,
                mute: info.mute,
              };
            }
            // 设置管理员和移除管理员权限更新
            if (info.permissions) {
              this.infoActive = {
                ...this.infoActive,
                ...info.permissions,
              };
            }
            if (info.groupReqType == 6 && operatorType == "exit") {
              this.infoActive = null;
            }
            // 群禁用
            if (info.isDisable !== undefined) {
              this.infoActive = {
                ...this.infoActive,
                isDisable: info.isDisable,
              };
            }
            // 群成员新增或者删除更新
            if (
              ["groupRemoveMember", "groupAddMember", "memberExit"].includes(
                operatorType
              )
            ) {
              this.infoActive = {
                ...this.infoActive,
                memberCount: info.memberCount,
              };
            }
            break;
          }

          case "cheduledDeletionConfig": {
            // 阅后即焚，推送的是当前窗口，则更新当前窗口的阅后即焚状态
            this.infoActive = {
              ...this.infoActive,
              bfReadCancel: info.bfReadCancel,
              msgCancelTime: info.msgCancelTime,
            };
            break;
          }
          case "bfAddressSet": {
            // 保存到通讯录，更新当前chatContent
            this.infoActive = {
              ...this.infoActive,
              bfAddress: info.bfAddress,
            };
          }
          case "bfTopSet": {
            // 置顶更新chatContent  bfTop
            this.infoActive = {
              ...this.infoActive,
              bfTop: info.bfTop,
            };
          }
          default:
        }
      }

      // 放到公共
      eventCommon.fnCommonInfoRU({
        key: "infoActive",
        value: this.infoActive,
      });
    },
    /**
     * 版本获取
     */
    handleVersionGet() {
      checkVersion().then((res) => {
        if (res) {
          const { deviceConfig } = eventCommon.fnConfigRU();
          const today = dayjs().format("YYYY-MM-DD");

          if (
            (res.version > Number("1.6.7".replace(/\./g, "")) &&
              deviceConfig.upVersionDay !== today) ||
            res.flag === 2
          ) {
            this.infoUpVersion = res;
            this.visibleUpVersion = true;
          }
        }
      });
    },
    initOssData() {
      getUploadToken().then((rt) => {
        window.ossData = rt;
      });
    },
    /**
     * 网络初始化
     */
    handleNetworkInit() {
      const { deviceConfig } = eventCommon.fnConfigRU();

      setWsUrl(deviceConfig.urls.session);
      websocketCreate();
    },
    /**
     * 加载完成
     */
    async handleLoaded() {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      // 免打扰数据初始化
      const disturbIdStrList = await Cache(loginId + "-mute");
      eventCommon.fnDisturbIdStrListRU({ list: disturbIdStrList });

      // 同步好友列表
      const friends = await this.handleFriendList();
      if (friends) {
        const obj = {};
        friends
          .filter((item) => item.name)
          .forEach((item) => {
            obj[item.id] = item.name;
          });

        eventFriend.fnFriendRemarkNameObjRU({ obj });
      }

      this.initOssData();
      this.InitOssTimer = setInterval(this.initOssData, 1000 * 50 * 60);

      // 版本获取
      this.handleVersionGet();

      // 显示，并符合动画效果
      setTimeout(() => {
        this.visibleMain = true;
      }, 100);

      setTimeout(() => {
        this.visibleLoad = false;

        // 网络初始化
        this.handleNetworkInit();
      }, 800);
    },
    // 此方法回传递给子级组件，如果子级组件有更新好友信息，则会调用此方法更新好友信息
    // 通过 provide 传递下去,但是好友list数据不在本地做长效缓存，所以每次使用每次调用即可
    async handleFriendList(friendList) {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      // 参数有传递好友列表，则表示更新，没有则获取本地好友列表
      if (friendList) {
        await Cache(`${loginId}-ContactList`, friendList);
        return friendList;
      } else {
        const list = await Cache(`${loginId}-ContactList`);
        return list;
      }
    },
    initNtpTime() {
      // ipcRenderer.send('initNtpTime', {desc: '调用NTP-TIME', type: 0})
      // cn.pool.ntp.org   time.google.com
      // 写两个服务的目的是防止第一个服务没有拿到ntp时间，则去另外个服务获取
      let isUpdate = false;

      ntpClient.getNetworkTime(
        "cn.pool.ntp.org",
        ntpClient.defaultNtpPort,
        (err, date) => {
          if (!isUpdate) {
            if (err) {
              return;
            }

            isUpdate = true;
            const localTime = new Date().getTime();
            setTimeD(dayjs(date).valueOf() - localTime);
          }
        }
      );

      ntpClient.getNetworkTime(
        "time.google.com",
        ntpClient.defaultNtpPort,
        (err, date) => {
          if (!isUpdate) {
            if (err) {
              return;
            }

            isUpdate = true;
            const localTime = new Date().getTime();
            setTimeD(dayjs(date).valueOf() - localTime);
          }
        }
      );
    },
    setGroups(groups) {
      this.groupList = groups || [];
    },
  },
};
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
}

.messageContent {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: auto;
  position: relative;

  > div {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    flex: 1;
  }
}

.defaultContent {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  > img {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>

<style lang="scss">
.update-container {
  .vm--modal {
    overflow: visible;
  }

  .model-box {
    padding: 0 !important;
  }
}
</style>
