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
import BDBase from "@/database";
import { initUserCachePath, Cache } from "@/cache";

// 工具
import { UpdateKeyPair, GetKeyPair, QueryArchiveReq } from "@/api/imBase";
import { importDB } from "@/utils/cacheDB.js";
import { getContactsList } from "@/api/imContacation";
import { chatGroupDataFormat, chatFriendDataFormat } from "@/utils/base";
import { setGenerateKeyPair } from "@/api/base/index";
import { fnKeyObjsInit } from "@/utils/encryption-decryption";

// api
import { getUserInfo } from "@/api/imBase";

// 事件
import eventCheduledCeletion from "@/event/cheduled-deletion";
import eventGroup from "@/event/group";
import eventFriend from "@/event/friend";
import eventCommon from "@/event/common";
import eventChannel from "@/event/channel";

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
      unreadObj: {},
      left: 0,
      tipsVisibleImport: false,
    };
  },
  props: ["hide"],
  async mounted() {
    // 登录id
    loginId = Number(location.href.slice(location.href.lastIndexOf("=") + 1));

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
      eventCommon.fnLoginSessionIdRU(loginInfo.sessionId);
    } else {
      // 登出
      eventCommon.fnLoginout();
      return;
    }

    // 通过主进程获取用户的文件存储地址
    await initUserCachePath(loginId);

    // 初始化 账户配置
    await eventCommon.fnConfigInit(true);

    // 初始化群事件
    eventGroup.fnGroupEventExecIdObjGet();

    // 初始化定时删除的信息记录
    eventCheduledCeletion.fnMsgListGet();

    // 全部密钥的对象初始化
    fnKeyObjsInit();

    if (navigator.onLine) {
      this.text = this.$t("加密检测");

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
      eventCommon.fnSensitiveWordsInit();

      this.handleKeyPair();

      // 15秒后加密还没有更新好，显示重置按钮
      setTimeout(() => {
        this.reloadButtonVisible = true;
      }, 15000);
    } else {
      this.text = "";

      // 没有网络则不断检测网络，有网后重置
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
            Cache(`${loginId}-ContactList`, this.friendList);
            this.friendNum = 100;
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
          Cache(
            "login-account-list",
            res.map((item) =>
              item.id === loginId ? { ...item, init: true } : item
            )
          );
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
      Cache(`${loginId}-ContactList`).then((res) => {
        if (res && res.length > 0) {
          if (res[0].userInfo) {
            this.handleUpdateFirendsForApi(1);
          } else {
            this.handleDataFinish("friend");
          }
        } else {
          this.handleUpdateFirendsForApi(1);
        }
      });
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
      } else {
        // 更新数据
        this.isLoad = true;
        this.text = this.$t("数据更新");

        setTimeout(() => {
          // 清空旧的群列表
          Cache(`${loginId}-GroupList`, []);
          this.handleFriends();
          this.handleChatsGet();
        }, 10);
      }
      this.handleChannels();
    },
    /**
     * 获取密钥
     */
    handleKeyPair() {
      GetKeyPair({
        targetId: Number(loginId),
      }).then((res) => {
        const { webKeyPair = {}, appKeyPair } = res;

        // 获取账户配置信息
        const { accountConfig } = eventCommon.fnConfigRU();

        // 如果 本地与获取的一致则不需要重设置
        if (
          accountConfig.privateKey &&
          accountConfig.publicKey === webKeyPair.publicKey &&
          accountConfig.keyVersion === webKeyPair.keyVersion
        ) {
          this.handleKeyFinish();
        } else {
          // 设置新的密钥
          const keyInfo = setGenerateKeyPair();

          // 私key
          const privateKey = Buffer.from(keyInfo.private)
            .toString("hex")
            .toUpperCase();

          // 公key
          const publicKey = Buffer.from(keyInfo.public)
            .toString("hex")
            .toUpperCase();

          // 更新密钥
          UpdateKeyPair({ publicKey }).then((res) => {
            if (res && res.keyVersion && res.commonResult.errCode === 200) {
              const keyInfos = {
                publicKey,
                privateKey,
                keyVersion: res.keyVersion,
                appKeyPair,
              };

              // 同步信息
              eventCommon.fnCommonInfoRU({
                infoMerge: keyInfos,
              });

              // 保存到本地配置
              eventCommon.fnConfigRU({
                isAccount: true,
                infoMerge: keyInfos,
              });

              this.handleKeyFinish();
            } else {
              // 重新登录
              this.$toast(this.$t("密钥异常，重新登录"));

              setTimeout(() => {
                // 登出
                eventCommon.fnLoginout();
              }, 2000);
            }
          });
        }
      });
    },
    /**
     * api获取好友列表
     */
    handleUpdateFirendsForApi(pageNum) {
      const pageSize = 200;

      getContactsList(
        {
          pageNum,
          pageSize,
        },
        () => {
          this.handleUpdateFirendsForApi(pageNum);
        }
      ).then(async (res) => {
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
            if (friendListPageCount === 1) {
              this.handleDataFinish("friend");
              return;
            } else {
              friendListPageReqCompleteList.push(1);

              // 最多并行4个请求
              const pageNumList = friendListPageReqList.slice(0, 4);
              friendListPageReqList = friendListPageReqList.slice(4);
              for (const item of pageNumList) {
                this.handleUpdateFirendsForApi(item);
              }
            }
          } else {
            // 添加请求的完成页数
            friendListPageReqCompleteList.push(pageNum);

            // 如果完成
            if (friendListPageReqCompleteList.length === friendListPageCount) {
              this.handleDataFinish("friend");
              return;
            } else if (friendListPageReqList.length > 0) {
              // 如果还有未请求的，继续请求
              const pageNumNew = friendListPageReqList[0];
              friendListPageReqList = friendListPageReqList.slice(1);
              this.handleUpdateFirendsForApi(pageNumNew);
            }
          }

          this.handleDataFinish("friend", this.firendPercentage);
        } else {
          setTimeout(() => {
            this.handleUpdateFirendsForApi(pageNum);
          }, 2000);
        }
      });
    },
    /**
     * 获取聊天窗口列表
     */
    async handleChatsGet() {
      Cache(`${loginId}MessageGroupList`).then((res) => {
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
      });

      Cache(`${loginId}MessageUserList`).then((res) => {
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
