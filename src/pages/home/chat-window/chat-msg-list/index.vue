<template>
  <div
    id="chatMsgList"
    :class="{ friend: chatContent.type === 'friend' }"
    @click="handleInputEditorFoucs"
  >
    <section>
      <p class="showtimeDay" :class="{ 'day-show': floatDateVisible }">
        {{ floatDate }}
      </p>
      <img
        v-if="chatContent.bfReadCancel"
        src="@/assets/images/chat/read-burn-back.png"
      />
      <div
        id="allMsgContainer"
        ref="container"
        :style="{
          opacity: containerOpacity,
        }"
      >
        <div
          v-for="(item, index) in blockList"
          :key="'pageNum' + item.pageNum"
          :id="'pageNum' + item.pageNum"
          :style="
            item.minHeight &&
            blockListShowPageNum > item.pageNum + 1 &&
            blockListShowPageNum < item.pageNum - 1
              ? {
                  minHeight: item.minHeight + 'px',
                }
              : {}
          "
        >
          <template
            v-if="
              (blockListShowPageNum <= item.pageNum + 1 &&
                blockListShowPageNum >= item.pageNum - 1) ||
              index === blockList.length - 1
            "
          >
            <div
              v-for="n in item.list"
              :id="n.customMsgId"
              :key="n.customMsgId"
              :class="{
                active: String(n.customMsgId) === String(idHighlighted),
                showTime: Boolean(n.showTime),
                unreadSeparation: unreadSeparationId === n.customMsgId,
                selected: selectedIdList.some((cur) => cur.id == n.id),
              }"
              :data-show-time-day="n.showTimeDay"
            >
              <h3 v-if="unreadSeparationId == n.customMsgId">
                <span @click="unreadSeparationId = -1">
                  {{ $t("未读消息") }}
                </span>
              </h3>
              <span v-if="n.showTime" class="showtimeDay">
                {{ n.showTimeDay }}
              </span>
              <ComMsgSystemNotification
                :groupOwner="groupOwner"
                v-if="[50, 51, 52].includes(n.chatType) || isChannelSystemMsg(n)"
                :msgInfo="n"
                @rightClick="
                  (e) => handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                "
              />
              <section
                v-else
                :class="{
                  self: n.isSelf && chatContent.type !== 'channel',
                  showAvatar: !n.isSelf && chatContent.type === 'group',
                }"
              >
                <ComAvatarName
                  v-if="!n.isSelf && chatContent.type === 'group'"
                  :msgInfo="n"
                  :memberInfos="memberInfos"
                  @rightClick="
                    (e) =>
                      handleEmitInfo(
                        { e, info: n, isAvatar: true },
                        'rightClickMenuDisplay'
                      )
                  "
                  @openMemberDialog="
                    handleMemberDialogShow({
                      id: n.user.uid,
                      icon: n.user.icon,
                      name: n.user.name,
                      nickName: n.user.nickName,
                    })
                  "
                />
                <ComMsgText
                  v-if="n.chatType === 0"
                  :isSelf="n.isSelf"
                  :chatContent="chatContent"
                  :content="n.content"
                  :atUsers="n.atUsers"
                  :currentGuoupId="chatContent.id"
                  :links="n.links"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgText>
                <ComMsgImage
                  v-else-if="[1, 3, 9].includes(n.chatType)"
                  :msgInfo="n"
                  :chatContent="chatContent"
                  @rightClick="
                    (value) => handleEmitInfo(value, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgImage>
                <ComMsgAudio
                  v-else-if="n.chatType === 2"
                  :msgInfo="n"
                  :chatContent="chatContent"
                  @rightClick="(e) => handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')">
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgAudio>
                <ComMsgBusinessCard
                  v-else-if="n.chatType === 5"
                  :msgInfo="n"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgBusinessCard>
                <ComMsgFile
                  v-else-if="n.chatType === 7"
                  :msgInfo="n"
                  :chatContent="chatContent"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgFile>
                <ComMsgNotice
                  v-else-if="n.chatType === 8"
                  :isSelf="n.isSelf"
                  :content="n.content"
                  :atNameList="atNameList"
                  :chatContent="chatContent"
                  :msgInfo="n"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgNotice>
                <ComMsgDice
                  v-else-if="n.chatType === 12"
                  :msgInfo="n"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgDice>
                <ComMsgPoker
                  v-else-if="n.chatType === 18"
                  :msgInfo="n"
                  :chatContent="chatContent"
                  @rightClick="
                    (e) =>
                      handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                  <img
                    v-if="n.deleteSeconds"
                    class="fire"
                    src="@/assets/images/read-delete01.svg"
                  />
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  <ComMsgQuote
                    v-if="n.quoteMessage !== undefined"
                    :msgInfo="n.quoteMessage"
                    :memberInfos="memberInfos"
                    :chatContent="chatContent"
                    @onClick="
                      () =>
                        handleMoveToId({
                          customMsgId: n.quoteMessage.customMsgId,
                          isHighlighted: true,
                        })
                    "
                  />
                  <ComTimeStatusLabel :msgInfo="n" :chatContent="chatContent" />
                </ComMsgPoker>
                <ComMsgRichText
                  v-else-if="n.msgType === 16"
                  :content="n.content"
                  @rightClick="
                    (e) => handleEmitInfo({ e, info: n }, 'rightClickMenuDisplay')
                  "
                >
                </ComMsgRichText>
                <div v-else class="other">
                  <ComSelectItem
                    v-if="selectedIdList.length > 0"
                    :selectedIdList="selectedIdList"
                    :id="n.customMsgId"
                    @onClick="
                      handleEmitInfo(
                        {
                          id: n.customMsgId,
                          msgId: n.MsgID,
                          ...n
                        },
                        'msgSelectedChange'
                      )
                    "
                  />
                  {{ $t("暂不支持该消息类型") }}
                </div>
              </section>
            </div>
          </template>
        </div>
      </div>
    </section>
    <ComFloatRightBtns
      :atMeIds="atMeIds"
      :btnToBottomVisible="btnToBottomVisible"
      :unreadCount="unreadCount"
      @clickToAt="handleToAt"
      @clickToBottom="handleToBottom"
    />
  </div>
</template>
<script>
import dayjs from "dayjs";

// 工具
import { fnUpdateGroupKey, fnUpdateFriendKey } from "@/utils/encryption-decryption.js";
import { chatPageDateformat, chatDate } from "@/utils/base";
import { Cache } from "@/cache";
import {
  fnIdsEnterVisualRangeGet,
  fnMsgListDeleteCalculate,
  fnMsgPropertyUpdate,
} from "@/utils/widget/chat-msg-list";

// 组件
import ComTimeStatusLabel from "./msg/time-status-label.vue";
import ComMsgText from "./msg/text.vue";
import ComFloatRightBtns from "./float-right-btns.vue";

// 事件
import eventCommon from "@/event/common";
import eventBase from "@/event/base";
import eventChannel from "@/event/channel";
import eventMsg from "@/event/msg";

// api
import { getChannelLastMsgInfo } from "@/api/imChannel";

// 模块消息数量
const blockMsgSize = 80;

// 已有的页面
let pageNumListOld = [];

let msgReadByMeTime = 0;

/////////////// timer

// 日期定时隐藏
let timerDateHidden = null;

// 滚动定时触发
let timerScrollTo = null;

// 高亮定时器
let timerHighlighted = null;

let isToBottom = false;

export default {
  components: {
    ComMsgText, // 文本消息
    ComTimeStatusLabel, // 时间和状态标签
    ComFloatRightBtns, // 右边浮动的按钮
    ComSelectItem: () => import("./select-item.vue"), // 选择框
    ComMsgQuote: () => import("./msg/quote.vue"), // 引用
    ComMsgDice: () => import("./msg/dice.vue"), // 骰子
    ComMsgPoker: () => import("./msg/poker.vue"), // 扑克
    ComMsgBusinessCard: () => import("./msg/business-card.vue"), // 名片
    ComMsgAudio: () => import("./msg/audio.vue"), // 音频
    ComMsgFile: () => import("./msg/file.vue"), // 文件
    ComMsgImage: () => import("./msg/image.vue"), // 显示图片
    ComAvatarName: () => import("./avatar-name.vue"), // 头像和名字
    ComMsgSystemNotification: () => import("./msg/system-notification.vue"), // 系统通知
    ComMsgNotice: () => import("./msg/notice.vue"), // 公告
    ComMsgRichText: () => import("./msg/rich-text.vue"), // 富文本
  },
  props: ["chatContent", "selectedList", "selectedIdList", "memberInfos", "groupOwner"],
  data() {
    return this.handleGetInitialData();
  },
  computed: {
    /**
     * At名称列表
     */
    atNameList() {
      return Object.values(this.memberInfos).map(
        (item) => item.name || item.nickName
      );
    },
  },
  inject: ["handleFriendList"],
  mounted() {
    this.updateKey()
    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "chatMsgList",
      [
        "chatMsgListSearchScrollTo",
        "chatMsgListToBottom",
        "msgReadByMe",
        "msgNew",
        "msgDelete",
        "msgListPropertyUpdate",
      ],
      this.eventHandling
    );

    // 获取消息列表
    this.handleMsgListInit();

    // 初始化未读数
    if (this.chatContent.unreadObj) {
      this.unreadCount = this.chatContent.unreadObj.count;
    }

    // 初始化我读的到时间
    msgReadByMeTime = 0;

    // 监听列表滚动
    this.$refs["container"].addEventListener(
      "scroll",
      this.handleListScrollChange
    );

    // 比较最大id
    this.handleIntoChat()
  },
  beforeDestroy() {
    // 懒渲染 移除
    this.$refs["container"].removeEventListener(
      "scroll",
      this.handleListScrollChange
    );

    // 移除监听 移除通信事件的监听机制
    eventBase.fnCommunicationMonitoring("chatMsgList", null);

    // 定时高亮改变 移除
    if (timerHighlighted) {
      clearTimeout(timerHighlighted);
    }
  },
  methods: {
    isChannelSystemMsg(msgInfo) {
        return this.chatContent?.type === "channel" && msgInfo?.chatType === 6;
    },
    updateKey() {
      // const { type, id } = this.chatContent || {};
      // if(type === "friend") {
      //   fnUpdateFriendKey({id})
      // } else if(type === "group") {
      //   fnUpdateGroupKey({id})
      // }
    },
    /**
     * 获取初始化data
     */
    handleGetInitialData() {
      return {
        idHighlighted: "", // 高亮id
        btnToBottomVisible: false, // 置底按钮显示
        blockList: [], // 消息模块块分隔列表
        blockListShowPageNum: -10, // 显示页面号，对应渲染上下一页
        containerOpacity: 0, // 容器透明的，初始化的时候需要滚动定位，定位好之前容器先透明
        pageCount: 0, // 页面总数
        pageLastMsgCount: 0, // 最后一页的消息总数
        floatDateVisible: false, // 浮动日期显示
        floatDate: "", // 浮动日期
        atMeIds: [], // at我的id列表
        unreadCount: 0, // 当前聊天的未读总数
        unreadSeparationId: "", // 未读消息分隔id
      };
    },
    /**
     * 重置所有的data
     */
    handleResetData() {
      // 重新设置 data
      Object.assign(this.$data, this.handleGetInitialData());

      // 已有的页面
      pageNumListOld = [];

      // 设置置底按钮是否显示
      this.handleToBottomBtnVisibleSet();
    },
    /**
     * 输入编辑 恢复焦点
     */
    handleInputEditorFoucs() {
      // 恢复焦点
      eventBase.fnCommunicationSendMsg({
        operator: "sendEditorFoucs",
      });
    },
    /**
     * 成员的会话框 显示
     */
    async handleMemberDialogShow(info) {
      let friendList = await this.handleFriendList();

      let friend = friendList.find((item) => item.id == info.id);
      let values = {
        ...info,
        bfFriend: !!friend,
        depict: friend ? friend.depict || "" : "",
      };

      // 群成员中获取
      if (this.memberInfos[values.id]) {
        // 如果存在则使用群成员的，头像，名称
        values = {
          ...values,
          ...this.memberInfos[values.id],
        };
      }

      eventBase.fnCommunicationSendMsg({
        operator: "memberDialogShow",
        data: {
          values,
        },
      });
    },
    /**
     * 获取引用的名字
     */
    handleQuoteNameGet(quoteMessage) {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      const msgUser =
        quoteMessage.user ||
        quoteMessage.sendMember?.user ||
        quoteMessage.sendUser;
      const isOwn = quoteMessage.sendUid == loginId;
      if (msgUser && !isOwn) {
        const { name, nickName } = this.memberInfos[msgUser.uid] || {};
        return name || nickName || msgUser.nickName;
      }
      return this.$t("你");
    },
    /**
     * 处理事件
     */
    eventHandling(info, operator) {
      // 如果不是当前窗口则不处理
      if (info.id + info.type !== this.chatContent.id + this.chatContent.type) {
        return;
      }

      switch (operator) {
        case "chatMsgListSearchScrollTo": {
          // 聊天列表滚动至
          this.handleMoveToId({
            customMsgId: info.customMsgId,
            isHighlighted: true,
          });
          break;
        }
        case "chatMsgListToBottom": {
          // 置底
          this.eventHandlingChatMsgListToBottom();
          break;
        }
        case "msgReadByMe": {
          // 消息已读
          this.eventHandlingMsgRead(info);
          break;
        }
        case "msgNew": {
          // 新消息
          this.eventHandlingMsgNew(info);
          break;
        }
        case "msgDelete": {
          // 删除消息
          this.eventHandlingMsgDelete(info);
          break;
        }
        case "msgListPropertyUpdate": {
          // console.log(info, '数据更新')
          // 修改消息属性 处理状态改变 发送成功，发送超时，已读
          this.blockList = fnMsgPropertyUpdate(
            info,
            this.blockList,
            this.pageCount
          );
          this.handleMsgEnterVisualRange();
          break;
        }

        default:
      }
    },
    /**
     * 处理事件 删除消息
     */
    eventHandlingMsgDelete(info) {
      const { idsDelete, idListClearReferenced, unreadMsgCount } = info;

      // 如果没有数据，则没必要处理
      if (this.blockList.length === 0) {
        return;
      }

      // 如果idsDelete是空数组，表示全部删除，则清空当前的blockList，重置为空数组
      if (idsDelete && !idsDelete.length) {
        // 重置所有的data
        this.handleResetData();
        return;
      }

      // 同步未读数
      this.unreadCount = unreadMsgCount;

      /////////////// 如果是需要页面重新计算直接走计算，否则进行现有数据处理

      // 如果有获取到最后一页的数据，进行计算确认
      if (
        this.blockList[this.blockList.length - 1].pageNum === this.pageCount
      ) {
        // 如果没有获取到最后一页的数据，直接数据库获取更新
        // 消息列表删除消息计算
        const blockList = fnMsgListDeleteCalculate(this.blockList, idsDelete);

        // 如果存在，则为已修改好，进行数据同步
        if (blockList) {
          // 如果为空，则直接重置
          if (blockList.length === 0) {
            this.handleResetData();
            return;
          }

          // 引用清除
          if (idListClearReferenced.length > 0) {
            for (const i in blockList) {
              blockList[i].list = blockList[i].list.map((item) => {
                if (item.quoteMessage) {
                  return idListClearReferenced.includes(item.customMsgId)
                    ? { ...item, quoteMessage: null }
                    : item;
                  } else {
                    return item
                  }
              });
            }
          }

          // 需要删除的本地id
          const customMsgIdList = idsDelete.filter(item => item.customMsgId).map((item) => item.customMsgId);

          const msgIdList = idsDelete.filter(item => !item.customMsgId).map((item) => item.msgId);

          // 删除数据
          for (let i = 0; i < blockList.length; i++) {
            if(customMsgIdList.length > 0){
              blockList[i].list = blockList[i].list.filter((item) => {
                return !customMsgIdList.includes(item.customMsgId);
              });
            }

            if(msgIdList.length > 0){
              blockList[i].list = blockList[i].list.filter((item) => {
                return !msgIdList.includes(Number(item.MsgID));
              });
            }
          }

          // 页面总数
          this.pageCount = blockList.at(-1).pageNum;

          // 如果显示页号大于总数，则修改为最大
          if (this.blockListShowPageNum > this.pageCount) {
            this.blockListShowPageNum = this.pageCount;
          }

          // 最后页面的消息数量
          this.pageLastMsgCount = blockList.at(-1).list.length;

          // 同步消息列表
          this.blockList = blockList;

          return;
        }
      }

      // 重置获取数据，并定位
      // 使用界面内的第一条消息做为定位，如果该消息被删除了，则依次往下找，如果都没有了，则直接至底显示
      const dom = this.$refs["container"];
      if (dom) {
        // 消息 进入可视区域的
        const msgListEnterVisual = fnIdsEnterVisualRangeGet({
          blockListShowPageNum: this.blockListShowPageNum,
          blockList: this.blockList,
          scrollTop: dom.scrollTop,
          clientHeight: dom.clientHeight,
        });

        if (msgListEnterVisual.length > 0) {
          // 数据库获取新数据
          window.$db
            .getMsgList({
              id: this.chatContent.id,
              type: this.chatContent.type,
              sendTime: msgListEnterVisual[0].sendTime,
              msgBlockList: [],
            })
            .then((res) => {
              if (res) {
                this.blockList = res.msgBlockList;
                this.blockListShowPageNum = res.pageNumCurrent;
                this.pageCount = res.pageCount;
                this.pageLastMsgCount = res.pageLastMsgCount;

                // 设置已存在
                pageNumListOld = this.blockList.map((item) => item.pageNum);

                // 过滤出大于等于当前时间的消息
                let listFilter = [];
                for (const item of this.blockList) {
                  listFilter = [
                    ...listFilter,
                    ...item.list.filter(
                      (n) =>
                        Number(n.sendTime) >=
                        Number(msgListEnterVisual[0].sendTime)
                    ),
                  ];
                }

                // 如果没有，则置底
                if (listFilter.length === 0) {
                  // 置底
                  this.handleScrollTo(-1, 1);
                } else {
                  // 获取最大的, 移动至该消息
                  const info = _.maxBy(listFilter, (item) =>
                    Number(item.sendTime)
                  );

                  if (info) {
                    this.handleMoveToId({
                      customMsgId: info.customMsgId,
                      isImmediately: true,
                    });
                  }
                }
              } else {
                // 如果本地没有数据，表示已经全部删除完了
                this.blockList = [];
              }
            });
        }
      }
    },
    /**
     * 处理事件 置底
     */
    eventHandlingChatMsgListToBottom() {
      // 清除未读总数
      this.unreadCount = 0;

      // 清除未读分隔
      this.unreadSeparationId = -1;

      // 渲染出最后一页 并移动到底部
      this.handleBlockListShowPageNumChange(this.pageCount, true);
    },
    /**
     * 处理事件 消息已读
     */
    eventHandlingMsgRead(info) {
      if (info.unreadInfo) {
        // 同步数据库拿的未读
        this.unreadCount = info.unreadInfo.count;
      } else {
        // 清除未读总数
        this.unreadCount = 0;
      }
    },
    /**
     * 处理事件 新消息
     */
    eventHandlingMsgNew(info) {
      // 如果是公告，则显示公告顶部弹窗
      if (info.msgType === 8) {
        this.$emit("openGroupTopNoticeDialog", info.content);
      }

      const btnToBottomVisibleBefore = this.btnToBottomVisible;
      const showTime = chatDate(info.sendTime, this.$t("昨天"));
      const showTimeDay = chatPageDateformat(info.sendTime);
      let infoNew = {
        ...info,
        showTimeDay,
      };

      // 如果消息不是自己发的，并且当前没有最后的的已读时间
      if (!info.isSelf) {
        // 这里不知道因为什么要这么判断，只生效一次，导致未读消息数量积压，实际上已经上报已读
        // if (msgReadByMeTime === 0) {
        if (msgReadByMeTime < info.sendTime) {
          msgReadByMeTime = info.sendTime + 1;
        }
      }

      // 如果是名片信息，在当前窗口，则处理一下
      if (info.msgType == 5 && info.content.includes("*|*|*")) {
        let cardContent = info.content.split("*|*|*");
        infoNew.content = {
          name: cardContent[0],
          pic: cardContent[1],
          id: cardContent[2],
        };
      }

      if (this.blockList.length > 0) {
        // 最后一个模块信息
        const blockInfoLast = this.blockList[this.blockList.length - 1];

        // 最后一个模块 如果是最后一页
        if (blockInfoLast.pageNum === this.pageCount) {

          // 之前的最后一条信息
          const msgInfoLastBefore =
            blockInfoLast.list[blockInfoLast.list.length - 1];
          // 上一条跟当前数据不是同一天，则需要显示日期
          // console.log({blockInfoLast, msgInfoLastBefore}, '958 -------------->')
          if (
            dayjs(Number(msgInfoLastBefore.sendTime)).format("YYYY-MM-DD") !==
            dayjs(Number(info.sendTime)).format("YYYY-MM-DD")
          ) {
            infoNew = {
              ...infoNew,
              showTime,
            };
          }
          // 如果存在则替换
          const existingIndex = blockInfoLast.list.findIndex(item => `${item.customMsgId}-${item.MsgID}` == `${infoNew.customMsgId}-${infoNew.MsgID}`);
          // const existingIndex = blockInfoLast.list.findIndex(item => item.MsgID == infoNew.MsgID);
          if (existingIndex > -1) {
            blockInfoLast.list[existingIndex] = infoNew;
          }
          // 如果模块消息没有满，则添加到模块
          else if (blockInfoLast.list.length < blockMsgSize) {
            blockInfoLast.list.push(infoNew);

            // 最后页面 消息总数+1
            this.pageLastMsgCount += 1;

            // 重新渲染列表
            this.blockList = _.cloneDeep(this.blockList);
          } else {
            // 总页数加1
            this.pageCount = this.pageCount + 1;

            // 最后 页面数为1
            this.pageLastMsgCount = 1;

            // 添加新模块
            this.blockList.push({
              pageNum: this.pageCount,
              list: [infoNew],
            });
          }
        } else {
          // 如果最后一页不存在，后面访问走常规数据库逻辑
          // 最后一页消息总数小于消息模块消息数，则最后一页消息加1
          if (this.pageLastMsgCount < blockMsgSize) {
            this.pageLastMsgCount += 1;
          } else {
            // 否则 模块加1
            this.pageCount = this.pageCount + 1;

            // 最后 页面数为1
            this.pageLastMsgCount = 1;
          }
        }
      } else {
        /////////////////// 之前没有消息

        // 总页数加1
        this.pageCount = 1;

        // 最后 页面数为1
        this.pageLastMsgCount = 1;

        // 添加新模块
        this.blockList = [
          {
            pageNum: 1,
            list: [
              {
                ...infoNew,
                showTime,
              },
            ],
          },
        ];
        // 显示
        this.blockListShowPageNum = 1;

        // 容器显示
        this.containerOpacity = 1;
      }

      // 如果收到消息时在底部，则自动下滑
      if (!btnToBottomVisibleBefore || isToBottom) {
        setTimeout(() => {
          const dom = this.$refs["container"];
          // 如果没有滚动
          if (dom && dom.clientHeight === dom.scrollHeight) {
            this.handleMsgEnterVisualRange();
          } else {
            this.handleScrollTo(-1, 12);
          }
        }, 5);
      } else {
        // 添加未读
        setTimeout(() => {
          this.unreadCount = this.chatContent.unreadObj
            ? this.chatContent.unreadObj.count
            : 0;
        }, 200);
      }
    },
    /**
     * 触发父组件事件
     */
    handleEmitInfo(value, type) {
      // 没有被选中的情况下 不能选中
      if (type === "msgSelectedChange" && this.selectedList.length === 0) {
        return;
      }

      this.$emit(type, value);
    },

    /**
     * 置底按钮是否显示
     */
    handleToBottomBtnVisibleSet() {
      const dom = this.$refs["container"];
      if (!dom) {
        return;
      }
      const visible = dom.scrollHeight - dom.clientHeight - 50 > dom.scrollTop;

      if (visible !== this.btnToBottomVisible) {
        this.btnToBottomVisible = visible;
      }
    },
    /**
     * 设置当前滚动位置的日期提示
     */
    setTimeDayMsg: _.throttle(function (e) {
      const container = e.target;
      const currentScrollTop = container.scrollTop;
      if (currentScrollTop < 100) {
        this.floatDateVisible = false;
        return;
      }
      const pages = container.children;
      const topTipsH = 32;
      // 获取滚动位置
      for (let i = 0; i < pages.length; i++) {
        for (let j = 0; j < pages[i].children.length; j++) {
          const { offsetTop, offsetHeight: height } = pages[i].children[j];
          // 滚动高度大于当前元素顶部高度，且小于当前元素底部高度，则显示当前日期
          if (
            currentScrollTop >= offsetTop - 32 &&
            currentScrollTop <= offsetTop - topTipsH + height
          ) {
            this.floatDate = pages[i].children[j].dataset.showTimeDay;
            this.floatDateVisible = true;
          }
        }
      }

      // 定时消失
      if (timerDateHidden) {
        clearTimeout(timerDateHidden);
      }

      timerDateHidden = setTimeout(() => {
        this.floatDateVisible = false;
        timerDateHidden = null;
      }, 1000);
    }, 300),
    /**
     * 列表滚动
     */
    handleListScrollChange(e) {
      // 置地按钮是否显示
      this.handleToBottomBtnVisibleSet();

      // 日期显示
      this.setTimeDayMsg(e);

      const dom = this.$refs["container"];
      if (!dom) {
        return;
      }

      // 判断当前滚动到了哪个块，用块顶部进入可视区域为标准 30px偏移

      // 可视top
      const visibleTop = e.target.scrollTop;

      // 可视bottom
      const visibleBottom = dom.clientHeight + visibleTop;

      // 之前的高度
      let heightBefore = 0;

      for (let i = 0; i < this.blockList.length; i++) {
        const domBlock = document.getElementById(
          "pageNum" + this.blockList[i].pageNum
        );

        if (domBlock) {
          // 设置当前块高度
          this.blockList[i].minHeight = domBlock.clientHeight;

          // 如果之前没有把 可视高度占慢
          if (heightBefore < visibleBottom) {
            // 并且当前板块在可视区域内
            if (heightBefore + domBlock.clientHeight > visibleTop) {
              let blockListShowPageNum = this.blockListShowPageNum;

              // 如果有下个板块，并且下个板块 也在可视区域，则当前页数为下个板块
              if (
                i + 1 < this.blockList.length &&
                heightBefore + domBlock.clientHeight < visibleBottom + 20
              ) {
                blockListShowPageNum = this.blockList[i + 1].pageNum;
              } else {
                blockListShowPageNum = this.blockList[i].pageNum;
              }

              // 如果显示页面号发生变化
              if (this.blockListShowPageNum !== blockListShowPageNum) {
                this.handleBlockListShowPageNumChange(blockListShowPageNum);
              }

              break;
            }
          }

          // 设置之前占用的高度
          heightBefore += domBlock.clientHeight;
        }
      }

      // 可视已读
      this.handleMsgEnterVisualRange();
    },
    /**
     * 如果显示页面号发生变化，确认是否要补充数据
     */
    handleBlockListShowPageNumChange(blockListShowPageNum, isToBottom) {
      ///////////////////// 之前显示的页面号
      const pageNumListBefore = [this.blockListShowPageNum];
      if (this.blockListShowPageNum > 1) {
        pageNumListBefore.push(this.blockListShowPageNum - 1);
      }
      if (this.blockListShowPageNum < this.pageCount) {
        pageNumListBefore.push(this.blockListShowPageNum + 1);
      }

      ///////////////////// 新显示的页面号

      // 需要的页号数据
      let pageNumList = [blockListShowPageNum];
      if (blockListShowPageNum > 1) {
        pageNumList.push(blockListShowPageNum - 1);
      }
      if (blockListShowPageNum < this.pageCount) {
        pageNumList.push(blockListShowPageNum + 1);
      }

      // 排除已存在的
      pageNumList = pageNumList.filter((num) => !pageNumListOld.includes(num));

      /////////////////////
      if (pageNumList.length > 0) {
        // 设置 移除页面消息的高度
        const pageNumListRemove = pageNumListBefore.filter(
          (item) => !pageNumList.includes(item)
        );

        for (const item of pageNumListRemove) {
          const dom = document.getElementById("pageNum" + item);
          if (dom) {
            this.blockList[pageNumListOld.indexOf(item)].minHeight =
              dom.clientHeight;
          }
        }

        // 设置已存在
        pageNumListOld = [...pageNumListOld, ...pageNumList];

        // 获取缺失的数据
        this.handleMsgListForPageGet(pageNumList).then(() => {
          // 设置新的页面号
          this.blockListShowPageNum = blockListShowPageNum;

          // 置地则移动到底部
          if (isToBottom) {
            // 滚动到底部
            setTimeout(() => {
              this.handleScrollTo(-1, 1);
            }, 5);
          }
        });
      } else {
        // 设置新的页面号
        this.blockListShowPageNum = blockListShowPageNum;

        // 置地则移动到底部
        if (isToBottom) {
          // 滚动到底部
          setTimeout(() => {
            this.handleScrollTo(-1, 1);
          }, 5);
        }
      }
    },
    /**
     * 高亮设置
     */
    handleHighlightedSet(customMsgId) {
      // 清除定时间移除高亮
      if (timerHighlighted) {
        clearTimeout(timerHighlighted);
      }

      // 设置高亮
      this.idHighlighted = customMsgId;

      // 设置定时高亮移除
      timerHighlighted = setTimeout(() => {
        this.idHighlighted = "";
      }, 2000);
    },
    /**
     * 移动到指定消息的位置
     */
    handleMoveToId({ customMsgId, isImmediately, isHighlighted }) {
      // 添加要高亮的
      if (isHighlighted) {
        this.handleHighlightedSet(customMsgId);
      }

      // 计算之前页板块的高度
      let pageHeightBefore = 0;

      for (const item of this.blockList) {
        if (item.pageNum < this.blockListShowPageNum) {
          const dom = document.getElementById("pageNum" + item.pageNum);
          if (dom) {
            pageHeightBefore += dom.clientHeight;
          }
        } else {
          break;
        }
      }

      // 计算当前板块中，前面信息的高度
      let msgHeightBefore = 0;
      const blockInfo = this.blockList.find(
        (item) => item.pageNum === this.blockListShowPageNum
      );

      if (blockInfo) {
        for (const item of blockInfo.list) {
          if (item.customMsgId == customMsgId) {
            break;
          } else {
            const dom = document.getElementById(item.customMsgId);
            if (dom) {
              msgHeightBefore += dom.clientHeight;
            }
          }
        }
      }

      // 上面的距离
      let top = pageHeightBefore + msgHeightBefore;

      // 保留 50px 的距离
      top = top > 50 ? top - 50 : 0;

      // 移动至
      this.handleScrollTo(top, isImmediately ? 1 : 12);
    },
    /**
     * 指定页号消息列表获取
     * 串型获取
     */
    async handleMsgListForPageGet(pages) {
      const res = await window.$db.getMsgListForPageNum({
        id: this.chatContent.id,
        type: this.chatContent.type,
        pageNum: pages[0],
        msgBlockList: this.blockList,
      });

      if (res) {
        // 赋值列表
        this.blockList = res;
        console.log('>>>>', this.blockList);

        if (pages.length > 1) {
          await this.handleMsgListForPageGet(pages.slice(1));
        }
      }
    },
    // 拉取频道历史消息
    async getChannelHistoryMsg(recentMsgs) {
      const { channelId } = this.chatContent;
      if(!channelId) return;
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      // api获取最后一条的数据信息
        // console.log('getChannelLastMsgInfo--')
      const { data: lastMsgs} = await getChannelLastMsgInfo({
        bizType: 2,
         bizId: Number(channelId),
      });
      if(!lastMsgs?.length) return;
      // console.log('getChannelLastMsgInfo-1-', JSON.stringify(lastMsgs))
      const lastMsgInfo = lastMsgs.find(item => item.msgType === 0);
      // console.log('getChannelLastMsgInfo-2-', lastMsgInfo)

      // 没有消息执行清空
      if(!lastMsgInfo) {
        eventMsg.fnMsgDelete({
            info: {
                id: Number(channelId),
                type: "channel",
                msgId: 0,
                idsDelete: [],
                isOtherPlatformOperate: true,
            },
        });
        return;
      };

      const latestMsgId = Number(lastMsgInfo.latestMsgId);
      const deleteHistoryS = await Cache(`${loginId}-channel-msg-delete-history`) || {}; //本地删除/清空的消息

      // 判断如果本地是最新的则不拉取，由于离线会推最后一条消息，这里根据最后两条进行判断
      // console.log('recentMsgs--', recentMsgs, latestMsgId)
      const lastOneMsgIsExist = recentMsgs.some(item => Number(item.MsgID) === latestMsgId); // 最后一条消息是否存在
      const lastTwoMsgIsExist = recentMsgs.some(item => Number(item.MsgID) === (latestMsgId -1)); // 最后第二条消息是否存在
      if(lastOneMsgIsExist && (latestMsgId <= 1 || lastTwoMsgIsExist)) {
        return
      }

      // api获取历史消息
      const latestSize = 30
      const params = {
        bizType: 2,
        bizId: Number(channelId),
        msgType: 0,
        latestSize: latestMsgId > latestSize ? latestSize : latestMsgId,
        latestMsgId: Number(lastMsgInfo.latestMsgId) + 1,
        eventType: 2,
      }
      // console.log('getChannelHistoryMsg--', params)
      let msgs = await eventChannel.fnGetHistoryMsgs(params)
      // console.log('getChannelHistoryMsg-2-', msgs)
      if(!msgs.length) return;

      // 过滤历史本地删除/清空的消息
      // console.log('deleteHistoryS--', deleteHistoryS)
      const { clearTime, idsDelete } = deleteHistoryS[Number(channelId)] || {};
            // console.log('deleteHistoryS-2-', clearTime, idsDelete)
      if(clearTime) {
       msgs = msgs.filter(item => Number(item.latestChannelMessage.msgTime) > clearTime)
          console.log('deleteHistoryS-3-', msgs)
      }
      if(idsDelete?.length) {
        msgs = msgs.filter(item => {
          console.log('idsDelete--', idsDelete)
          const deleteItem = idsDelete.find(i => Number(i.msgId) === Number(item.latestChannelMessage.msgId))
          return !deleteItem || Number(item.latestChannelMessage.msgTime) > deleteItem.clearTime
        })
         console.log('deleteHistoryS-4-', msgs)
      }

      // 排序
      msgs.sort((a, b) => {
        return Number(a.latestChannelMessage.msgTime) - Number(b.latestChannelMessage.msgTime);
      });
      // console.log('getChannelHistoryMsg-3-', msgs)

      // 消息展示
      for(let i = 0; i < msgs.length; i++) {
        const item = msgs[i]
        await eventMsg.fnChannelMsgAdd(item.latestChannelMessage, true);
      }
    },
    /**
     * 消息列表初始化
     */
    async handleMsgListInit() {
      // 搜索
      const { customMsgId, sendTime } = this.chatContent.searchMsgInfo || {};

      // 未读
      const { time, unreadMsgID, unreadID } = this.chatContent.unreadObj || {};

      // 未读分隔
      if (unreadID) {
        this.unreadSeparationId = unreadID;
      } else if (unreadMsgID) {
        this.unreadSeparationId = await window.$db.getIdForMsgID({
          id: this.chatContent.id,
          type: this.chatContent.type,
          msgId: unreadMsgID,
        });
      }

      // 获取消息列表数据
      window.$db
        .getMsgList({
          id: this.chatContent.id,
          type: this.chatContent.type,
          sendTime: sendTime || time,
          msgBlockList: this.blockList,
        })
        .then((res) => {
          // console.log('blockList--', res)
          if (res) {
            this.blockList = res?.msgBlockList || [];
            this.blockListShowPageNum = res.pageNumCurrent;
            this.pageCount = res.pageCount;
            this.pageLastMsgCount = res.pageLastMsgCount;
            // 设置已存在
            pageNumListOld = this.blockList.map((item) => item.pageNum);

            // console.log('chat-msg-list: ----------->blockList 1335', this.blockList)

            setTimeout(() => {
              if (customMsgId || this.unreadSeparationId) {
                // 搜索/未读 移动至
                this.handleMoveToId({
                  customMsgId: customMsgId || this.unreadSeparationId,
                  isImmediately: true,
                });
              } else {
                // 置底
                this.handleScrollTo(-1, 1);
              }

              // 容器显示
              this.containerOpacity = 1;

              // 如果不需要滚动，则设置一次已读
              const dom = this.$refs["container"];
              if (dom && dom.clientHeight === dom.scrollHeight) {
                this.handleMsgEnterVisualRange();
              }

              // 显示置低按钮
              this.handleToBottomBtnVisibleSet();
            }, 100);
          }

          if(this.chatContent.type === 'channel') {
            const msgList = this.blockList || [];
            // console.log('recentMsgList-1-', msgList)
            const recentMsgList = msgList.at(-1)?.list || [];
              //  console.log('recentMsgList-2-', recentMsgList)
            this.getChannelHistoryMsg(recentMsgList.slice(-10));
          }
        });

      // 如果有未读，则获取未读里面的at我的id列表
      if (this.unreadSeparationId !== "") {
        window.$db
          .getIdsAtUnread({
            id: this.chatContent.id,
            type: this.chatContent.type,
            sendTime: time,
          })
          .then((res) => {
            if (res) {
              this.atMeIds = res;
            }
          });
      }
    },
    /**
     * 滚动到指定top
     */
    handleScrollTo(value, num) {
      if (value === -1) {
        isToBottom = true;
      }

      const dom = this.$refs["container"];
      if (!dom) {
        return;
      }
      if (timerScrollTo) {
        clearTimeout(timerScrollTo);
      }

      const top = value === -1 ? dom.scrollHeight - dom.clientHeight : value;

      const dValue = (top - dom.scrollTop) / num;
      dom.scrollTop += dValue;

      if (num > 1) {
        timerScrollTo = setTimeout(() => {
          this.handleScrollTo(top, num - 1);
        }, 15);
      } else {
        isToBottom = false;
      }
    },
    /**
     * 置底
     */
    handleToBottom() {
      const { id, type } = this.chatContent;

      eventBase.fnCommunicationSendMsg({
        operator: "chatMsgListToBottom",
        data: { id, type },
      });
    },
    /**
     * 移动至at信息
     */
    handleToAt() {
      if (this.atMeIds.length > 0) {
        // 移动至，并且高亮
        this.handleMoveToId({
          customMsgId: this.atMeIds[0],
          isHighlighted: true,
        });

        // 排除第一个
        this.atMeIds = this.atMeIds.filter((_, index) => index !== 0);
      }
    },
    handleIntoChat() {
    },
    /**
     * 消息进入可视范围
     */
    handleMsgEnterVisualRange: _.debounce(function () {
      const dom = this.$refs["container"];
      if (dom) {
        // 消息 进入可视区域的
        const msgListEnterVisual = fnIdsEnterVisualRangeGet({
          blockListShowPageNum: this.blockListShowPageNum,
          blockList: this.blockList,
          scrollTop: dom.scrollTop,
          clientHeight: dom.clientHeight,
        });

        // 可视区没有内容直接结束
        if (msgListEnterVisual.length === 0) {
          return;
        }

        // 有旋转的骰子 则定时让骰子停止
        const diceSpinningMsgList = msgListEnterVisual.filter(
          (item) => item.chatType === 12 && !item.result && item.content
        );

        if (diceSpinningMsgList.length > 0) {
          const { id, type } = this.chatContent;
          // 通讯
          eventBase.fnCommunicationSendMsg({
            operator: "msgListPropertyUpdate",
            operatorType: "dice",
            data: {
              id,
              type,
              list: diceSpinningMsgList.map((item) => {
                return {
                  customMsgId: item.customMsgId,
                  updated: { result: String(item.content).slice(0, 1) },
                };
              }),
            },
          });
        }

        // 进入可视区域的最后一条信息
        const msgLastEnterVisual =
          msgListEnterVisual[msgListEnterVisual.length - 1];

        // 如果有未读，并有未读消息在可视区域内，则设置已读
        let timeUnread = _.get(this.chatContent.unreadObj, "time");

        if (msgReadByMeTime !== 0) {
          timeUnread = msgReadByMeTime;
        }

        if (timeUnread) {
          timeUnread = Number(timeUnread);
          if (msgLastEnterVisual.readStatus !== 2 && Number(msgLastEnterVisual.sendTime) >= timeUnread) {
            eventBase.fnCommunicationSendMsg({
              operator: "msgReadByMe",
              data: {
                id: this.chatContent.id,
                type: this.chatContent.type,
                values: {
                  sendTime: Number(msgLastEnterVisual.sendTime),
                  timeUnread,
                },
              },
            });
            // 更新最后消息事件
            msgReadByMeTime = msgLastEnterVisual.sendTime + 1;
          }
        }
      }
    }, 100),
  },
};
</script>
<style lang="scss">
#chatMsgList {
  flex: auto;
  position: relative;

  > section {
    height: 100%;
    background: #f6f6f6;

    > img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      height: 176px;
      z-index: 1;
      opacity: 0.1;
    }

    #allMsgContainer {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2;
      overflow-y: auto;
      padding: 32px 10px 16px 10px;
      box-sizing: border-box;
      font-family: PingFangSC-Bold;

      > div {
        overflow: hidden;

        > div {
          position: relative;
          padding: 6px 0;

          &.active {
            background: #e9f3f9;
            border-radius: 5px;
            animation: highlight 2s infinite;
            transition: background-color 2s ease;
          }

          > section {
            display: flex;

            img.fire {
              position: absolute;
              width: 20px;
              right: -28px;
              top: 50%;
              transform: translateY(-50%);
            }

            &.self {
              justify-content: flex-end;

              img.fire {
                left: -28px;
                right: auto;
              }
            }

            &.showAvatar {
              padding: 22px 0 0 45px;
              position: relative;
            }

            > .other {
              display: inline-block;
              padding: 12px 22px 16px;
              background: rgba($color: #da2e2e, $alpha: 0.1);
              border-radius: 5px;
            }
          }

          > h3 {
            margin: 0;
            height: 350px;
            text-align: center;
            cursor: pointer;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;

            &:hover {
              opacity: 0.8;
            }

            > span {
              display: block;
              line-height: 35px;
              background: #eee;
              color: #2273ad;
              font-weight: bold;
              font-size: 14px;
            }
          }

          &.unreadSeparation {
            padding-top: 40px;
          }

          &.showTime {
            padding-top: 40px;

            &.unreadSeparation {
              padding-top: 80px;

              > h3 {
                top: 40px;
              }
            }

            .showtimeDay {
              top: 10px;
              opacity: 1;
              margin-left: 0;
              z-index: 0;
            }
          }
        }
      }
    }
  }

  .showtimeDay {
    position: absolute;
    top: 32px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
    margin-left: -8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 12px;
    padding: 0.5em;
    text-align: center;
    line-height: 1em;
    height: auto;
    border-radius: 5px;
    opacity: 0;
    transition: opacity 0.5s;
    &.day-show {
      opacity: 1;
    }
  }

  @keyframes highlight {
    0% {
      background-color: #f6f6f6; /* 初始背景色 */
    }
    30% {
      background-color: #e9f3f9; /* 中间高亮颜色 */
    }
    70% {
      background-color: #e9f3f9; /* 中间高亮颜色 */
    }
    100% {
      background-color: #f6f6f6; /* 结束时恢复原色 */
    }
  }
}
</style>
