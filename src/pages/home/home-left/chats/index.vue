<template>
  <div class="comChats">
    <div ref="list" class="list">
      <div v-if="list.length > 0">
        <ul
          class="chats-list"
          :style="{
            paddingTop: this.showIndex * 59 + 'px',
          }"
        >
          <li
            v-if="archiveIdStrList.length > 0 && !archiveListShow"
            class="archive"
            @click="handleArchiveListShow"
          >
            <img src="@/assets/images/message/archive-icon.png" />
            {{ $t("归档会话") }}
            <div>{{ archiveText }}</div>
            <i v-if="archiveUnreadCount > 0">
              {{ archiveUnreadCount > 99 ? "99+" : archiveUnreadCount }}
            </i>
          </li>
          <li
            v-for="(item, index) in listNew"
            :key="item.id + item.type + index"
            :class="{
              active:
                infoActive &&
                infoActive.id === item.id &&
                infoActive.type === item.type,
              disturb: item.bfDisturb || item.isDisturb,
              topBackground: item.bfTop,
            }"
            @mousedown="(e) => handleClick(item, e)"
            @contextmenu.prevent="
              (e) => handleRightClickShowMenu(e, item, index)
            "
          >
            <ComTextAvatar
              v-if="item.type === 'channel' && !item.pic && !item.icon"
              class="textAvatar"
              :color="item.logoColor"
              :value="item.channelName"
              :id="item.channelId"
            />
            <ComImage
              v-else
              :src="item.id === 'invitation' ? defaultImgSrc() : (item.pic || item.icon)"
              :type="item.type"
              class="icon"
            />
            <div class="name-time-wrapper">
              <h3>
                <img class="channel-feature" v-if="item.type === 'channel'" src="@/assets/images/channel/feature.png" />
                {{
                  item.id === "invitation"
                    ? $t("群通知")
                    : item.name || item.nickName || item.channelName
                }}
              </h3>
              <span v-if="item.chatType !== -1" class="sendTime">
                {{ chatTime(item.sendTime, $t("昨天")) }}
              </span>
            </div>
            <div
              class="chats-82"
              v-if="
                draftInfos[item.id + item.type] &&
                infoActive &&
                infoActive.id + infoActive.type !== item.id + item.type
              "
            >
              <span style="color: #ff0000; font-size: 12px">
                [{{ $t("草稿") }}]
              </span>
              <ComChatsText :text="draftInfos[item.id + item.type]" />
            </div>
            <div class="msg-rich-text"  v-else-if="item.chatType === 16" v-html="handleRichTextToText(item.content)">
            </div>
            <div v-else-if="item.chatType === 8 || item.msgType === 8">
              <span
                v-if="
                  unreadObj[item.id + item.type] &&
                  unreadObj[item.id + item.type].count > 0
                "
                style="color: #ff0000; font-size: 12px"
              >
                [{{ $t("有新群简介") }}]
              </span>
              <span style="color: #999999; font-size: 12px">
                {{ item.sendUserName }}[{{ $t("群简介") }}]
              </span>
              {{ item.content }}
            </div>
            <div
              class="tip-msg"
              v-else-if="
                [1, 2, 3, 5, 7, 9, 12, 18].includes(item.chatType) ||
                item.chatType === 12 ||
                item.msgType === 13
              "
            >
              <h4
                v-if="
                  item.sendUserName &&
                  item.sendUserName !== 'undefined: ' &&
                  item.type === 'group'
                "
              >
                {{ item.sendUserName }}
              </h4>
              {{
                handleMsgTypeToText({
                  chatType: item.chatType,
                  msgType: item.msgType,
                  content: item.content,
                })
              }}
            </div>
            <div class="tip-msg" v-else-if="isUnsupportedMsgType(item)">
              {{ $t("暂不支持该消息类型") }}
            </div>
            <div
              class="chats-82"
              v-else-if="item.content && item.content !== ''"
            >
              <i class="at-me" v-if="handleAtMe(item.atUsers, item)">
                [{{ $t("有人@我") }}]
              </i>
              <i class="mute"
                v-if="item.mute && item.readStatus === 0"
                style="color: red; font-weight: bold; padding-right: 3px">!</i>
              <span
                class="sendUserName"
                v-if="
                  item.sendUserName &&
                  item.sendUserName !== 'undefined: ' &&
                  item.type === 'group'
                "
              >
                {{ item.sendUserName }}
              </span>
              <ComChatsText :text="handleContent(item.content)" :id="item.id" :atUsers="item.atUsers" :currentChatId="item.id" />
            </div>
            <div v-else></div>
            <i
              v-if="
                unreadObj[item.id + item.type] &&
                unreadObj[item.id + item.type].count > 0
              "
            >
              {{
                unreadObj[item.id + item.type || "friend"].count > 99
                  ? "99+"
                  : unreadObj[item.id + item.type || "friend"].count
              }}
            </i>
            <picture>
              <img src="@/assets/images/message/mdr-icon.png" alt="" />
            </picture>
          </li>
        </ul>
      </div>
      <div v-else class="no-data">
        {{ $t("暂时没有新的聊天会话") }}
      </div>
    </div>
    <vue-context class="contact-menu-box" ref="rightClickMenu" :lazy="true">
      <li @click="handleDeleteConfirm">{{ $t("删除聊天") }}</li>
      <li v-if="chatInfoRightClick" @click="handelBfTopChange">
        {{ chatInfoRightClick.bfTop ? $t("取消置顶") : $t("消息置顶") }}
      </li>
      <li v-if="chatInfoRightClick" @click="handleBfDisturbChange">
        {{
          (chatInfoRightClick.bfDisturb || chatInfoRightClick.isDisturb) ? $t("取消消息免打扰") : $t("消息免打扰")
        }}
      </li>
      <li
        v-if="
          chatInfoRightClick &&
          unreadObj[chatInfoRightClick.id + chatInfoRightClick.type] &&
          unreadObj[chatInfoRightClick.id + chatInfoRightClick.type].count > 0
        "
        @click="handleAllReadRightClickChat"
      >
        {{ $t("标记已读") }}
      </li>
      <li @click="handleArchiveChange()">
        {{ archiveListShow ? $t("取消归档") : $t("归档") }}
      </li>
    </vue-context>
  </div>
</template>
<script>
import { Cache } from "@/cache";

// 工具
import { chatTime } from "@/utils/base";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

// 事件
import eventBase from "@/event/base";
import eventMsg from "@/event/msg";
import eventCommon from "@/event/common";

// 组件
import ComChatsText from "./text.vue";
import ComTextAvatar from '@/components/text-avatar'

let loginId = "";

export default {
  components: {
    ComChatsText,
    ComTextAvatar,
  },
  props: ["list", "unreadObj", "unreadCount", "infoActive", "disturbIdStrList", "archiveListShow"],
  computed: {
    chats() {
      const list = this.list.filter((item) => {
        const name = item.name || item.nickName || item.channelName;
        if( !name ) return false
        // 归档
        if (this.archiveListShow) {
          // 归档之后，可以进行单独的搜索
          if (
            this.searchText !== "" &&
            !(item.name || item.nickName || "").includes(this.searchText)
          ) {
            return false;
          }

          if (this.archiveIdStrList.includes(item.id + item.type)) {
            return true;
          }
        } else if (!this.archiveIdStrList.includes(item.id + item.type)) {
          // 非归档
          return true;
        }
        return false;
      });
      return list;
    },
    listNew() {
      return this.chats.slice(this.showIndex, this.showIndex + 80).map((item) => {
        return {
          ...item,
          name: item.name?.replaceAll("🪵", "?"),
        };
      });
    },
    /**
     * 归档未读总数
     */
    archiveUnreadCount() {
      return this.archiveIdStrList.reduce((accumulator, archiveIdStr) => {
        return accumulator + this.unreadObj[archiveIdStr]
          ? this.unreadObj[archiveIdStr].count
          : 0;
      }, 0);
    },
  },
  data() {
    return {
      chatInfoRightClick: null, // 右键点击的 聊天窗口信息
      draftInfos: {}, // 草稿信息
      archiveIdStrList: [], // 归档的 id + type 组合列表
      // archiveListShow: false, // 归档是否显示
      archiveText: "", // 归档外面显示的 文本，所有人的名字
      searchText: "", // 归档使用的搜索文本
      showIndex: 0, // 用来懒渲染
    };
  },
  created() {

  },
  mounted() {
    // 草稿信息
    this.draftInfos = eventCommon.fnDraftInfosRU();

    // 虚拟滚动
    this.$refs["list"].addEventListener("scroll", this.handleListScrollChange);

    // 同步归档
    loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });

    // 归档更新
    this.handleArchiveUpdate();

    // 事件监听
    this.handleEventMonitor();
  },
  beforeDestroy() {
    this.$refs["list"].removeEventListener(
      "scroll",
      this.handleListScrollChange
    );

    eventBase.fnCommunicationMonitoring("chats", null);
  },
  methods: {
    chatTime,
    /**
     * 免打扰设置
     */
    handleBack() {
      this.archiveListShow = false;
      this.searchText = '';
      // this.$emit('handleShowArchive', false)
    },
    // 归档显示
    handleArchiveListShow() {
      this.$emit('handleArchiveListShow', true)
    },
    handleBfDisturbChange() {
      const { id, type, bfDisturb, name, nickName, pic, isDisturb } = this.chatInfoRightClick;
      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfDisturbSet",
        data: {
          id,
          type,
          bfDisturb: !bfDisturb,
          name: type == "group" ? name : name || nickName,
          icon: pic,
          ...(type === 'channel' ? { isDisturb: !(isDisturb || bfDisturb) } : {}),
        },
      });

      eventBase.fnCommunicationSendMsg({
        operator: "friendUpdate",
        data: {
          id,
          type,
          bfDisturb: !bfDisturb,
        },
      });
    },
    /**
     * 置顶改变
     */
    handelBfTopChange() {
      const { id, type, bfTop } = this.chatInfoRightClick;
      const data = {
        id,
        type,
        bfTop: !bfTop,
      };
      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfTopSet",
        data,
      });
      eventBase.fnCommunicationSendMsg({
        operator: "friendUpdate",
        data,
      });
    },
    /**
     * 事件监听
     */
    handleEventMonitor() {
      eventBase.fnCommunicationMonitoring(
        "chats",
        ["archiveUpdate", "closeOperator"],
        this.eventHandling
      );
    },
    /**
     * 处理事件
     */
    eventHandling(info, operator) {
      switch (operator) {
        case "closeOperator": {
          // 关闭右键点击菜单
          this.$refs.rightClickMenu && this.$refs.rightClickMenu.close();

          // 关闭 消息清除对话框
          if (info.ids.includes("msgClearDialog")) {
            this.clearMsgTypeList = [];
          }

          this.chatInfoRightClick = null;
          break;
        }
        case "archiveUpdate": {
          // 归档更新
          this.handleArchiveUpdate();
          break;
        }
        default:
      }
    },
    /**
     * 归档更新
     */
    handleArchiveUpdate() {
      Cache(`${loginId}-archive`).then((res) => {
        if (res) {
          if (res.length > 0) {
            const idStrList = res.map((item) => item.id + item.type);

            const list = this.list.filter((item) =>
              idStrList.includes(item.id + item.type)
            );
            this.archiveIdStrList = list.map((item) => item.id + item.type);
            this.$emit('handleArchiveIdStrList', this.archiveIdStrList)
            this.archiveText = list
              .map((item) => item.name || item.nickName || "")
              .join(",");
          } else {
            this.archiveIdStrList = [];
            this.$emit('setArchiveIdStrList', [])
          }

          // 如果没有归档数据，归档显示关闭
          if (this.archiveIdStrList.length === 0) {
            // this.archiveListShow = false;
            this.$emit('handleArchiveListShow', false)
            this.searchText = "";
          }
        }
      });
    },
    /**
     * 确认删除
     */
    handleDeleteConfirm() {
      const chatInfo = this.chatInfoRightClick;
      if (!chatInfo) return;
      window
        .$confirm({
          remark: this.$t(
            "删除聊天后，将同时删除记录。包括聊天中的文件、图片、视频等内容"
          ),
        })
        .then((res) => {
          if (res) {
            eventBase.fnCommunicationSendMsg({
              operator: "msgDelete",
              data: {
                id: chatInfo.id,
                type: chatInfo.type,
                idsDelete: [],
                isRemoteDeletion: false,
                isDeleteChatWindow: true,
              },
            });

            this.$emit("handleDeleteChats", chatInfo);
          }
        });
    },
    /**
     * 改变归档
     */
    handleArchiveChange() {
      eventBase.fnCommunicationSendMsg({
        operator: "archiveChange",
        operatorType: this.archiveListShow ? "remove" : "add",
        data: {
          id: this.chatInfoRightClick.id,
          type: this.chatInfoRightClick.type,
        },
      });
    },
    /**
     * 右键点击的聊天窗口 未读消息 全部已读
     */
    handleAllReadRightClickChat() {
      const data = {
        id: this.chatInfoRightClick.id,
        type: this.chatInfoRightClick.type,
        values: {},
      };

      const ureadInfo =
        this.unreadObj[
          this.chatInfoRightClick.id + this.chatInfoRightClick.type
        ];

      if (ureadInfo) {
        data.values = { timeUnread: ureadInfo.time };
      }

      eventBase.fnCommunicationSendMsg({
        operator: "msgReadByMe",
        data,
      });
    },
    /**
     * 消息的类型转文本
     */
    handleMsgTypeToText(value) {
      let text = eventMsg.fnMsgTypeToText(value);
      return text ? "[" + text + "]" : "";
    },
    /**
     * 是否为聊天窗口内“暂不支持该消息类型”的同一类消息（与 chat-msg-list 的 v-else 分支一致）
     * 无最后一条消息(chatType 为 undefined/-1) 不判为不支持；chatType/msgType 统一转数字避免接口返回字符串误判。
     */
    isUnsupportedMsgType(item) {
      const chatType = item.chatType;
      if (chatType === undefined || chatType === null || chatType === -1) return false;
      const ct = Number(chatType);
      const mt = Number(item.msgType);
      if (Number.isNaN(ct)) return false;
      if ([50, 51, 52].includes(ct)) return false;
      if (item.type === "channel" && ct === 6) return false;
      if (ct === 0 || [1, 2, 3, 5, 7, 8, 9, 12, 18].includes(ct)) return false;
      if (mt === 16) return false;
      return true;
    },
    /**
     * 转换富文本消息为文本
     */
    handleRichTextToText(htmlString) {
        const safe = sanitizeHtml(htmlString || "");
        return safe
          .replace(/<img\b[^>]*>/gi, "[图片]")
          .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, "[视频]");
    },
    /**
     * 点击选中聊天窗
     */
    handleClick(item, e) {
      // 右键不选中
      if (e && e.buttons === 2) {
        return;
      }
      // 置底
      if (
        this.infoActive &&
        this.infoActive.id + this.infoActive.type === item.id + item.type
      ) {
        eventBase.fnCommunicationSendMsg({
          operator: "chatMsgListToBottom",
          data: {
            id: item.id,
            type: item.type,
          },
        });
        return;
      }
      // console.log(item, 'chats ---------> 506')


      const comType = item.id === "invitation" ? "notificationGroup" : item.id === "channelNotice" ? "channelNotice" : "chat";

      // 通讯
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: {
          ...item,
          comType,
          unreadObj: this.unreadObj[item.id + item.type],
        },
      });
    },
    /**
     * 右键点击显示菜单
     */
    handleRightClickShowMenu(e, value) {
      if (this.infoActive) {
        // 移除 右键点击菜单
        eventCommon.fnCloseListRU({
          removeIds: ["rightClickMenu"],
        });
      }

      eventBase.fnCommunicationSendMsg({
        operator: "closeOperator",
        data: { ids: [] },
      });

      // 打开右键点击菜单
      this.$refs.rightClickMenu && this.$refs.rightClickMenu.open(e);

      // 设置右键选中的框口信息
      this.chatInfoRightClick = value;
    },
    handleAtMe(atUsers, info) {
      if (
        (this.infoActive && this.infoActive.id == info.id) ||
        (this.unreadObj && !this.unreadObj[info.id + "group"])
      ) {
        return false;
      }
      //  处理at自己高亮
      let isAtMe = false;
      if (atUsers) {
        isAtMe = atUsers.find((item) => item.uid == loginId);
      }
      if (info.content.includes("@全体成员")) {
        isAtMe = true;
      }
      return isAtMe;
    },
    handleContent(content) {
      let rex = /!@#([\S\s]*)!@#/;
      // 群通知这边不需要做高亮处理，所以需要处理掉用于高亮得特殊字符串!@#
      if (rex.test(content)) {
        let name = content.match(rex)[1];
        let newContent = content.replace(rex, name);
        return newContent;
      } else {
        return content;
      }
    },
    /**
     * 懒渲染滚动
     */
    handleListScrollChange() {
        let scrollTop = this.$refs["list"].scrollTop;
        if (this.chats.length > 0) {
          // scrollTop -= 26;
          scrollTop = scrollTop < 0 ? 0 : scrollTop;
        }
        // 滚动条位置上方渲染的个数
        let beforeNum = Math.floor(scrollTop / 59);

        // Chats
        if (this.chats.length > 80) {
          let index = beforeNum - 40;
          index = index < 0 ? 0 : index;
          index = index > this.chats.length ? this.chats.length : index;
          if (index !== this.showIndex) {
            this.showIndex = index;
          }
        }
    },
    defaultImgSrc() {
      return require("@/assets/images/logo/group-icon.png");
    },
  },
  watch: {
    list: {
      handler() {
        // 归档更新
        this.handleArchiveUpdate();
      },
    },
  },
};
</script>
<style lang="scss" scoped>
.comChats {
  > .list {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #999 transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #999;
      border-radius: 3px;
    }

    > div {
      position: relative;
      overflow: hidden;

      > ul {
        padding: 0;
        margin: 0;
        box-sizing: border-box;

        > li {
          position: relative;
          padding: 0 16px 0 63px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-family: PingFangSC-Regular, PingFang SC;
          width: 100%;
          background-color: #fcfcfc;
          height: 59px;
          box-sizing: border-box;
          cursor: pointer;
          transition: background-color 0.2s ease;

          &:hover {
            background: #f9f9f9;
          }

          &.topBackground {
            background: #ede7e7;
          }

          &.active {
            background: #efefef;
          }

          &.archive {
            > i {
              top: 10px;
              background: #666;
            }
          }

          &.online {
            &::before {
              content: "";
              position: absolute;
              height: 8px;
              width: 8px;
              border-radius: 50%;
              left: 43px;
              bottom: 15px;
              background: #10d561;
              z-index: 1;
            }
          }

          &.disturb {
            > i {
              background: #ccc;
            }
            > picture {
              display: block;
              margin-right: 8px;
            }
          }

          .name-time-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-right: -6px;

            > h3 {
              flex: 1;
              margin: 0;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              font-size: 14px;
              color: #333;
              font-weight: normal;
              line-height: 18px;
              min-width: 0;
            }

            > .sendTime {
              font-size: 11px;
              color: #999;
              margin-left: 10px;
              white-space: nowrap;
              flex-shrink: 0;
            }
          }

          > p {
            margin-top: 4px;
            font-size: 14px;
            font-weight: 400;
            color: #999;
            line-height: 18px;
            font-family: PingFangSC-Regular, PingFang SC;
          }

          > img {
            position: absolute;
            left: 16px;
            top: 50%;
            width: 35px;
            height: 35px;
            transform: translateY(-50%);
            border-radius: 50%;
            object-fit: cover;
          }

          > div:not(.name-time-wrapper) {
            font-size: 12px;
            color: #999;
            line-height: 20px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            display: inline-block;
            position: relative;
            top: 1px;
            padding-right: 20px;

            > img {
              width: 18px;
              vertical-align: middle;
            }

            > h4 {
              display: inline;
              color: #999;
              font-size: 12px;
              padding: 0;
              margin: 0;
              font-weight: normal;
            }
          }



          > i {
            position: absolute;
            top: 32px;
            right: 10px;
            padding: 0 7px;
            min-width: 20px;
            box-sizing: border-box;
            height: 20px;
            line-height: 20px;
            display: inline-block;
            font-size: 12px;
            background: #f44e5a;
            font-weight: 400;
            border-radius: 20px;
            transform: scale(0.86);
            color: #fff;
            text-align: center;
            white-space: nowrap;
            font-style: normal;
            display: block;
            transition: background-color 0.2s ease;

            > span {
              position: absolute;
              color: #fff;
              font-size: 12px;
              left: -24px;
              top: 0;
              height: 100%;
              display: block;
              background: #f44e5a;
              width: 20px;
              border-radius: 50%;
            }
          }

          > picture {
            position: absolute;
            top: 34px;
            right: 30px;
            display: none;
            transition: opacity 0.2s ease;
          }
        }
      }

      > p {
        line-height: 40px;
        font-size: 14px;
        color: #333;
        padding-left: 20px;
        position: absolute;
        left: 0;
        right: 0;
        border-top: 1px solid #eee;
        box-sizing: border-box;

        &:first-child {
          border-top: 0;
        }
      }

      > .contactCount {
        line-height: 38px;
        text-align: center;
        font-size: 14px;
        color: #333;
        border-top: 1px solid #eee;
        margin-bottom: 50px;
      }
    }
  }

  .chats-list {
    .chats-tip {
      display: inline-block;
      width: 100%;
      height: 20px;
      line-height: 20px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      align-content: center;
      color: #adadad !important;
      font-size: 12px;
      vertical-align: middle;
    }

    .has-emoj {
      display: flex;
      align-items: center;
    }

    .at-me {
      color: #ff0000;
      font-size: 12px;
    }

    .chats-82 {
      box-sizing: border-box;
      height: 20px;
      width: 100%;
      padding-right: 30px;
    }

    .chats-82 .sendUserName {
      color: #aaaaaa;
      font-size: 12px;
    }

    .has-at {
      width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    li {
      &::after {
        content: "";
        display: block;
        position: absolute;
        left: 63px;
        right: 0;
        height: 1px;
        background: #f1f0f0;
        bottom: 0;
      }
    }
  }
  .textAvatar {
    position: absolute;
    left: 16px !important;
    top: 50% !important;
    transform: translateY(-50%);
  }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .comChats {
    .chats-list {
      li {
        padding: 0 12px 0 50px;

        &::after {
          left: 50px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.msg-rich-text {

   height: 20px;
   overflow: hidden;
   span, div {
    font-size: 12px !important;
    line-height: 20px;
   }
}
</style>
