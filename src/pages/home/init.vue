<template>
  <div :class="{ comInit: true, hide: hide }" :style="{ left: left + 'px' }">
    <span @click="handleReset">退出，重置数据</span>
    <div>
      <img src="@/assets/images/common/defalut-icon.png" />
      <div>
        <div v-if="isLoad" class="load">
          <h3>{{ $t("首次数据初始化") }}</h3>
          <ul>
            <li>
              <span>{{ $t("好友") }} {{ friendNum.toFixed(1) }}%</span>
              <p :style="{ width: `${friendNum.toFixed(1)}%` }"></p>
            </li>
            <li>
              <span>{{ $t("聊天窗口") }} {{ chatNum.toFixed(0) }}%</span>
              <p :style="{ width: `${chatNum}%` }"></p>
            </li>
          </ul>
        </div>
        <template v-else>
          <div class="loadingDot">
            <div class="dot-loader"></div>
            <div class="dot-loader dot-loader--2"></div>
            <div class="dot-loader dot-loader--3"></div>
          </div>
          <p v-if="text === ''" style="color: #ff0000">
            {{ $t("当前网络异常，请检查网络设置") }}
          </p>
          <p v-else>
            {{ text }}
          </p>
          <p
            v-if="tipsVisibleImport"
            :class="{ tipsImport: true, active: reloadButtonVisible }"
          >
            旧数据载入异常？
            <span @click="handleNoImport"
              >放弃载入【有聊天记录丢失的风险】</span
            >
          </p>
          <button
            v-if="reloadButtonVisible"
            class="primaryBtn"
            @click="handleNetwork"
          >
            {{ $t("重新加载") }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
import BDBase from "@/database/queue";
import { initUserCachePath, Cache } from "@/cache";

// 工具
import { QueryArchiveReq } from "@/api/imBase";
import { importDB } from "@/utils/cacheDB.js";
import { getContactsList } from "@/api/imContacation";
import { getGroupContactList } from "@/api/imGroup";
import { chatGroupDataFormat, chatFriendDataFormat } from "@/utils/base";
import { fnKeyObjsInit, fnUpdateOwnKey } from "@/utils/encryption-decryption";

// api
import { getUserInfo } from "@/api/imBase";

// 事件
import eventCheduledCeletion from "@/event/cheduled-deletion";
import eventGroup from "@/event/group";
import eventFriend from "@/event/friend";
import eventCommon from "@/event/common";
import eventChannel from "@/event/channel";
import eventBase from "@/event/base";

let friendIdsTop = null;
let timerNetwork = null;
let friendListPageCount = 0;
let friendListPageReqList = [];
const friendListPageReqCompleteList = [];
let loginId = "";

export default {
  data() {
    return {
      reloadButtonVisible: false, // 重新加载按钮 是否显示
      isLoad: false,
      text: this.$t("加载中"),
      firendPercentage: 100,
      friendNum: 0,
      chatNum: 0,
      isFrindsGetting: false,
      letters: [],
      letterIndexs: [],
      friendList: [],
      groupList: [],
      groupListPageCount: 0,
      groupListPageReqList: [],
      groupListPageReqCompleteList: [],
      groupFetchId: 0,
      unreadObj: {},
      left: 0,
      tipsVisibleImport: false,
    };
  },
  props: ["hide"],
  async mounted() {
    console.$collect('初始化开始')
    // 登录id
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    loginId = Number(urlParams.get('loginId'));
    if (!loginId || isNaN(loginId)) {
        // Fallback for older format if necessary, or just rely on URLSearchParams
        loginId = Number(location.href.slice(location.href.lastIndexOf("=") + 1));
    }

    // 登录id 设置到公共
    eventCommon.fnCommonInfoRU({
      key: "loginId",
      value: loginId,
    });

    // 登录账户列表
    let loginAccountList = await Cache("login-account-list");

    // 登录信息
    const loginInfo = loginAccountList
      ? loginAccountList.find((item) => item.id === loginId)
      : null;

    if (loginInfo) {
      // 如果存在则同步sessionId
       console.$collect('初始化-同步sessionId')
      eventCommon.fnLoginSessionIdRU(loginInfo.sessionId);
    } else {
      // 登出
      eventCommon.fnLoginout();
      console.$collect('初始化-未查询到登录信息，执行退出')
      return;
    }

    // 通过主进程获取用户的文件存储地址
    // console.$collect('初始化-文件存储地址')
    // 先注释了：这个应用间数据共享的方案非常不安全，不但容易数据混乱，Cache函数自身没有抛错直接静默失败了
    // 非常难以定位问题，多用户多app登录容易混淆数据和文件锁死
    // 需要重新设计
    // await initUserCachePath(loginId);

    // 初始化 账户配置
    console.$collect('初始化-账户配置')
    await eventCommon.fnConfigInit(true);

    // 初始化 全局配置(群/频道)
    console.$collect('初始化-全局配置')
    await eventCommon.fnGlobalConfigInit();

    // 初始化群事件
    console.$collect('初始化-群事件')
    eventGroup.fnGroupEventExecIdObjGet();

    // 初始化定时删除的信息记录
    console.$collect('初始化-定时删除消息')
    eventCheduledCeletion.fnMsgListGet();

    // 全部密钥的对象初始化
    console.$collect('初始化-密钥')
    fnKeyObjsInit();

    if (navigator.onLine) {
      this.text = this.$t("加密检测");

      console.$collect('初始化-加密检测')
      const resLogin = await getUserInfo();
      if (resLogin && resLogin.userInfo) {
        const { nickName, icon } = resLogin.userInfo;

        // 如果名称，头像有更新，则进行同步
        if (loginInfo.name !== nickName || loginInfo.icon !== icon) {
          // 更新到账户列表
          loginAccountList = loginAccountList.map((item) => {
            return item.id === loginInfo.id
              ? {
                  ...item,
                  name: nickName,
                  icon,
                }
              : item;
          });

          Cache("login-account-list", loginAccountList);
        }

        // 同步登录信息
        eventCommon.fnCommonInfoRU({
          infoMerge: {
            loginId: loginInfo.id,
            loginInfo,
          },
        });
      } else {
        // 没有获取到登录信息，直接清除对应的登录sessionId，并直接到登录

        // 更新到账户列表
        loginAccountList = loginAccountList.map((item) => {
          return item.id === loginInfo.id
            ? {
                ...item,
                sourceId: "",
                sessionId: "",
              }
            : item;
        });

        Cache("login-account-list", loginAccountList).then(() => {
          // 登出
          eventCommon.fnLoginout();
        });
      }

      // 敏感词初始化
      console.$collect('初始化-敏感词初始化')
      eventCommon.fnSensitiveWordsInit();

      console.$collect('初始化-获取密钥')
      this.handleKeyPair();

      // 15秒后加密还没有更新好，显示重置按钮
      setTimeout(() => {
        this.reloadButtonVisible = true;
      }, 15000);
    } else {
      this.text = "";

      // 没有网络则不断检测网络，有网后重置
      console.$collect('初始化-无网络')
      this.handleNetwork();
    }
  },
  beforeDestroy() {
    if (timerNetwork) {
      clearTimeout(timerNetwork);
    }
  },
  watch: {
    hide() {
      setTimeout(() => {
        // 计算动画到结束的位置重合
        const doms = document.getElementsByClassName("comList");
        if (doms && doms[0]) {
          this.left = 333 + doms[0].clientWidth - 261;
        }
      }, 100);
    },
  },
  methods: {
    /**
     * 不载入
     */
    handleNoImport() {
      window
        .$confirm({
          title: this.$t("旧数据载入异常？"),
          remark: this.$t("放弃载入【有聊天记录丢失的风险】"),
        })
        .then((res) => {
          if (res) {
            this.handleKeyFinish(true);
          }
        });
    },
    /**
     * 重置
     */
    handleReset() {
      window
        .$confirm({
          remark: this.$t("确认退出，并重置数据？"),
        })
        .then(async (res) => {
          if (res) {
            localStorage.clear();

            // 清除 好友列表和聊天窗口列表
            await Cache(`${loginId}-ContactList`, []);
            await Cache(`${loginId}-FriendRemarks`, []);

            await Cache(`${loginId}MessageGroupList`, []);
            await Cache(`${loginId}MessageUserList`, []);

            // key清理
            await Cache(`${loginId}-friend-key-objs`, {});
            await Cache(`${loginId}-group-key-objs`, {});

            // 群事件
            await Cache(`${loginId}-groupEventExecIdObj`, {});

            const res = await Cache("login-account-list");

            await Cache(
              "login-account-list",
              res.filter((item) => item.id !== loginId)
            );

            window.location.reload();
          }
        });
    },
    /**
     * 网络检测
     */
    handleNetwork() {
      if (timerNetwork) {
        clearTimeout(timerNetwork);
      }

      // 网络不通或者加密检测卡主了，有网后重新加载
      if (navigator.onLine) {
        location.href = location.href.slice(0, location.href.lastIndexOf("#/"));
      } else {
        this.text = "";
        timerNetwork = setTimeout(this.handleNetwork, 2000);
      }
    },
    /**
     * 同步数据完成
     * @param {*} type
     * @param {*} percentage
     */
    async handleDataFinish(type, percentage) {
      switch (type) {
        case "friend": {
          if (percentage) {
            this.friendNum += percentage;
          } else {
            await Cache(`${loginId}-ContactList`, this.friendList);
            this.friendNum = 100;
            await this.handleFriendRemarks()
          }
          break;
        }
        case "chat": {
          this.chatNum += 50;
          break;
        }
        default:
      }

      if (this.friendNum === 100 && this.chatNum === 100) {
        // 记录该账户更新完成
        Cache("login-account-list").then((res) => {
          if (res && Array.isArray(res)) {
            Cache(
              "login-account-list",
              res.map((item) =>
                item.id === loginId ? { ...item, init: true } : item
              )
            );
          }
        });

        // 归档初始化
        await this.handleArchiveInit();

        this.$emit("loaded");
      }
    },
    /**
     * 同步好友列表
     */
    handleFriends() {
      // Cache(`${loginId}-ContactList`).then((res) => {
      //   if (res && res.length > 0) {
      //     if (res[0].userInfo) {
      //       this.handleUpdateFirendsForApi(1);
      //     } else {
      //       this.handleDataFinish("friend");
      //     }
      //   } else {
      //     this.handleUpdateFirendsForApi(1);
      //   }
      // });
      // 强制更新好友列表
      return new Promise(resolve => {
        this.handleUpdateFirendsForApi(1, resolve);
      });
    },
    /**
     * 同步群列表
     */
    handleGroups(pageNum = 1, fetchId = 0, resolve) {
      if (pageNum === 1 && !resolve) {
          return new Promise(r => this.handleGroups(1, 0, r));
      }

      const pageSize = 200;

      if (pageNum === 1) {
        this.groupList = [];
        this.groupListPageReqCompleteList = [];
        this.groupListPageReqList = [];
        this.groupListPageCount = 0;

        // 生成新的请求ID，用于防止并发请求冲突
        const newFetchId = Date.now();
        this.groupFetchId = newFetchId;
        fetchId = newFetchId;
      } else {
        // 非第一页时，必须匹配当前的fetchId，否则视为过期请求
        if (fetchId !== this.groupFetchId) {
          if(resolve) resolve(); // 过期请求，直接resolve
          return;
        }
      }

      getGroupContactList(
        {
          pageNum,
          pageSize,
        },
        () => {
          setTimeout(() => {
            // 重试前检查ID是否有效
            if (fetchId === this.groupFetchId) {
              this.handleGroups(pageNum, fetchId, resolve);
            }
          }, 2000);
        }
      ).catch((err) => {
        console.error('handleGroups 获取群列表失败:', err);
      }).then((res) => {
        // 响应回来后检查ID是否有效
        if (fetchId !== this.groupFetchId) {
          if(resolve) resolve();
          return;
        }
        let groups = [];
        if (res && res.groups) {
          groups = eventGroup.fnGroupDataFormat(res.groups);
        }

        if (groups.length > 0) {
          // 数据去重
          const existingIds = new Set(this.groupList.map((item) => item.id));
          const newGroups = groups.filter((item) => !existingIds.has(item.id));
          if (newGroups.length > 0) {
            this.groupList.push(...newGroups);
          }
        }

        const processNext = () => {
          if (
            this.groupListPageReqCompleteList.length >= this.groupListPageCount
          ) {
            Cache(`${loginId}-GroupList`, this.groupList);
            if (resolve) resolve();
          } else if (this.groupListPageReqList.length > 0) {
            const pageNumNew = this.groupListPageReqList[0];
            this.groupListPageReqList = this.groupListPageReqList.slice(1);
            this.handleGroups(pageNumNew, fetchId, resolve);
          }
        };

        if (pageNum === 1) {
          // 记录总数
          const count = res && res.groupCount ? res.groupCount : 0;
          this.groupListPageCount = Math.ceil(count / pageSize);

          if (groups.length >= count && count > 0) {
            this.groupListPageCount = 1;
          }

          if (this.groupListPageCount <= 1) {
            Cache(`${loginId}-GroupList`, this.groupList);
            if (resolve) resolve();
            return;
          } else {
            this.groupListPageReqList = Array.from(
              { length: this.groupListPageCount - 1 },
              (_$, index) => index + 2
            );
            this.groupListPageReqCompleteList.push(1);

            // 并发控制：每次取1个
            processNext();
          }
        } else {
          this.groupListPageReqCompleteList.push(pageNum);
          processNext();
        }
      });
    },
    /**
     * 初始化好友备注数据
     */
    async handleFriendRemarks() {
      let remarks = [];
      const ContactList = await Cache(`${loginId}-ContactList`);
      if(!ContactList?.length) return;
      ContactList.forEach(item => {
        const {id, name} = item
        if(id && name) {
          remarks.push({id, name})
        }
      });
      await Cache(`${loginId}-FriendRemarks`, remarks);
    },
    /**
     * 获取所有频道列表
     */
    async handleChannels() {
      const allList = await eventChannel.fnGetAllChannel();
      Cache(`${loginId}-ChannelList`, allList);
    },
    /**
     * 密钥完成，进行下一步更新本地数据
     */
    handleKeyFinish(noImport) {
      window.$db = new BDBase(loginId);

      // 初始化 定时删除消息的配置
      eventCheduledCeletion.fnCheduledDeletionConfigInit();

      // 数据库导入
      this.text = this.$t("数据载入");
      this.tipsVisibleImport = true;

      importDB(loginId, noImport)
      this.tipsVisibleImport = false;

      this.text = this.$t("数据已载入");
      const loginInfo = eventCommon.fnCommonInfoRU({
        getId: "loginInfo",
      });

      if (loginInfo.init) {
        // 已经初始化过，直接完成初始化
        this.text = this.$t("完成");
        this.$emit("loaded");
        // 后台更新数据
        setTimeout(() => {
          this.handleSyncAll();
        }, 1000);
      } else {
        // 更新数据
        this.isLoad = true;
        this.text = this.$t("数据更新");

        setTimeout(() => {
          // 清空旧的群列表
          Cache(`${loginId}-GroupList`, []);
          this.handleSyncAll();
        }, 10);
      }
      // this.handleChannels();
      Cache(`${loginId}-FriendRemarks`).then(res => {
        if(!res || !res?.length) {
           this.handleFriendRemarks()
        }
      })
    },
    /**
     * 统一同步所有数据 (好友、群组、频道、聊天列表)
     */
    async handleSyncAll() {
      try {
        await Promise.all([
          this.handleFriends(),
          this.handleGroups(),
          this.handleChannels()
        ]);

        await this.handleChatsGet();

        // 统一发送更新事件
        eventBase.fnCommunicationSendMsg({
            operator: "contactListReload",
            data: {
              friendList: this.friendList,
              groupList: this.groupList,
              channelList: await Cache(`${loginId}-ChannelList`) || []
            }
        });
      } catch (e) {
        console.error("handleSyncAll err:", e);
      }
    },
    /**
     * 获取密钥
     */
    handleKeyPair() {
      fnUpdateOwnKey().then(res => {
        const { code } = res || {};
         console.log('handleKeyPair--',res)
        if(code === 200) {
          this.handleKeyFinish();
        } else {
          // 重新登录
            this.$toast(this.$t("密钥异常，重新登录"));

            setTimeout(() => {
              // 登出
              eventCommon.fnLoginout();
            }, 2000);
        }
      })
    },
    /**
     * api获取好友列表
     */
    handleUpdateFirendsForApi(pageNum, resolve) {
      const pageSize = 200;

      if (pageNum === 1) {
        this.friendList = [];
        // 重置变量，防止状态污染
        friendListPageReqList = [];
        friendListPageReqCompleteList.length = 0;
        friendListPageCount = 0;
      }

      getContactsList(
        {
          pageNum,
          pageSize,
        },
        () => {
          setTimeout(() => {
              this.handleUpdateFirendsForApi(pageNum, resolve);
          }, 2000)
        }
      ).catch((err) => {
        console.error('handleUpdateFirendsForApi 获取好友列表失败:', err);
      }).then(async (res) => {
        if (res) {
          // 列表格式化
          const list = eventFriend.fnApiDataFormat(res.contactsList);
          this.friendList = [...this.friendList, ...list];

          // 如果是第一页
          if (pageNum === 1) {
            // 记录总数
            friendListPageCount = Math.ceil(res.count / pageSize);

            // 设置百分比
            this.firendPercentage = friendListPageCount
              ? 100 / friendListPageCount
              : 0;

            if (friendListPageCount > 1) {
              friendListPageReqList = Array.from(
                { length: friendListPageCount - 1 },
                (_$, index) => index + 2
              );
            }

            // 如果只有一页
            if (friendListPageCount <= 1) {
              await this.handleDataFinish("friend");
              if (resolve) resolve();
              return;
            } else {
              friendListPageReqCompleteList.push(1);

              // 最多并行4个请求(并行请求拉爆了服务器，改为了1)
              const pageNumList = friendListPageReqList.slice(0, 1);
              friendListPageReqList = friendListPageReqList.slice(1);
              for (const item of pageNumList) {
                this.handleUpdateFirendsForApi(item, resolve);
              }
            }
          } else {
            // 添加请求的完成页数
            friendListPageReqCompleteList.push(pageNum);

            // 如果完成
            if (friendListPageReqCompleteList.length === friendListPageCount) {
              await this.handleDataFinish("friend");
              if (resolve) resolve();
              return;
            } else if (friendListPageReqList.length > 0) {
              // 如果还有未请求的，继续请求
              const pageNumNew = friendListPageReqList[0];
              friendListPageReqList = friendListPageReqList.slice(1);
              this.handleUpdateFirendsForApi(pageNumNew, resolve);
            }
          }

          this.handleDataFinish("friend", this.firendPercentage);
        } else {
          setTimeout(() => {
            this.handleUpdateFirendsForApi(pageNum, resolve);
          }, 2000);
        }
      });
    },
    /**
     * 获取聊天窗口列表
     */
    async handleChatsGet() {
      // 10秒超时 Promise
      const timeout = (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      );

      // MessageGroupList 带 10s 超时
      Promise.race([
        Cache(`${loginId}MessageGroupList`),
        timeout(10000)
      ]).then((res) => {
        if (res && res.length > 0) {
          if (res[0].id) {
            this.handleDataFinish("chat");
          } else {
            const { unreadObj, list } = chatGroupDataFormat(res, loginId);

            this.handleUnreadSet(unreadObj);
            Cache(`${loginId}MessageGroupList`, list).then(() => {
              this.handleDataFinish("chat");
            });
          }
        } else {
          this.handleDataFinish("chat");
        }
      }).catch(() => {
        // 超时或错误，直接完成进度
        this.handleDataFinish("chat");
      });

      // MessageUserList 带 10s 超时
      Promise.race([
        Cache(`${loginId}MessageUserList`),
        timeout(10000)
      ]).then((res) => {
        if (res && res.length > 0) {
          if (res[0].id) {
            this.handleDataFinish("chat");
          } else {
            const { unreadObj, list } = chatFriendDataFormat(
              res,
              loginId,
              friendIdsTop || []
            );
            this.handleUnreadSet(unreadObj);
            Cache(`${loginId}MessageUserList`, list).then(() => {
              this.handleDataFinish("chat");
            });
          }
        } else {
          this.handleDataFinish("chat");
        }
      }).catch(() => {
        // 超时或错误，直接完成进度
        this.handleDataFinish("chat");
      });
    },
    /**
     * 未读信息设置
     */
    handleUnreadSet(info) {
      if (!_.isEmpty(info)) {
        this.unreadObj = {
          ...this.unreadObj,
          ...info,
        };

        Cache(`${loginId}-unread`, this.unreadObj);
      }
    },
    /**
     * 归档初始化
     */
    async handleArchiveInit() {
      const res = await QueryArchiveReq();
      if (res && res.ArchiveInfo) {
        const list = res.ArchiveInfo.map((item) => {
          return {
            id: Number(item.target),
            type: Number(item.type) === 1 ? "friend" : "group",
          };
        });

        await Cache(`${loginId}-archive`, list);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.comInit {
  transition-duration: 0.3s;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
  z-index: 1000;

  > span {
    position: absolute;
    right: 10px;
    top: 30px;
    color: #666;
    font-weight: 400;
    font-size: 12px;
    cursor: pointer;
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  }

  &.hide {
    left: 333px;

    > div {
      padding-top: 160px;
      transition-duration: 0.5s;
      transition-delay: 0.3s;

      > img {
        transition-duration: 0.5s;
        transition-delay: 0.3s;
        width: 120px;
        filter: blur(1px);
      }

      > div {
        opacity: 0;
      }
    }
  }

  > div {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;

    > img {
      display: block;
      width: 80px;
      margin-bottom: 10px;
    }

    > div {
      height: 150px;
      transition-duration: 0.5s;

      > .loadingDot {
        display: flex;
        justify-content: center;
        display: flex;
        margin-bottom: 10px;

        .dot-loader {
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background-color: #3369fe;
          position: relative;
          -webkit-animation: 1.2s grow ease-in-out infinite;
          animation: 1.2s grow ease-in-out infinite;
        }

        .dot-loader--2 {
          -webkit-animation: 1.2s grow ease-in-out infinite 0.15555s;
          animation: 1.2s grow ease-in-out infinite 0.15555s;
          margin: 0 10px;
        }
        .dot-loader--3 {
          -webkit-animation: 1.2s grow ease-in-out infinite 0.3s;
          animation: 1.2s grow ease-in-out infinite 0.3s;
        }

        @-webkit-keyframes grow {
          0%,
          40%,
          100% {
            -webkit-transform: scale(0);
            transform: scale(0);
          }
          40% {
            -webkit-transform: scale(1);
            transform: scale(1);
          }
        }
        @keyframes grow {
          0%,
          40%,
          100% {
            -webkit-transform: scale(0);
            transform: scale(0);
          }
          40% {
            -webkit-transform: scale(1);
            transform: scale(1);
          }
        }
      }

      > p {
        font-size: 12px;
        color: #666;
        text-align: center;

        &.tipsImport {
          margin-top: 10px;
          color: #999;
          line-height: 20px;

          > span {
            font-size: 12px;
            display: block;
            cursor: pointer;
            color: #999;
          }

          &.active,
          &:hover {
            > span {
              color: #ff0000;
            }
          }
        }
      }

      > button {
        display: block;
        margin: 10px auto;
      }

      > .load {
        > h3 {
          margin: 0;
          font-size: 14px;
          text-align: center;
          margin-bottom: 5px;
          color: #000;
        }

        > ul {
          padding: 0;
          margin: 0;

          > li {
            height: 25px;
            line-height: 25px;
            width: 200px;
            background: #666;
            display: flex;
            position: relative;
            margin-bottom: 5px;
            border-radius: 25px;
            overflow: hidden;

            > span {
              position: absolute;
              color: #fff;
              left: 50%;
              transform: translateX(-50%);
              font-size: 12px;
              font-weight: normal;
              z-index: 2;
            }

            > p {
              position: absolute;
              background: rgb(82, 196, 26);
              left: 0;
              top: 0;
              bottom: 0;
              width: 0%;
              transition-duration: 0.5s;
              border-radius: 25px;
            }
          }
        }
      }
    }
  }
}
</style>
