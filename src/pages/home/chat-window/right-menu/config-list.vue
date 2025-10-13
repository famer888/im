<template>
  <ul class="comConfigList">
    <li>
      <span> {{ $t("置顶聊天") }}</span>
      <ComSwitch :value="bfTop" @input="handelBfTopChange" />
    </li>
    <template v-if="isChannel">
      <li>
        <span>接收通知</span>
        <ComSwitch :value="bfChannelReceive" @input="channelReceiveChange" />
      </li>
    </template>
    <template v-else>
      <li class="disturb" v-if="chatContent.id !== 10002">
        <span> {{ $t("消息免打扰") }}</span>
        <ComSwitch :value="bfDisturb" @input="handelBfDisturbChange" />
      </li>
      <li v-if="isGroup">
        <span> {{ $t("保存到通讯录") }}</span>
        <ComSwitch :value="bfAddress" @input="handelBfAddressChange" />
      </li>
      <li v-if="!isGroup">
        <span> 加入黑名单</span>
        <ComSwitch :value="bfMyBlack" @input="handelBfMyBlackChange" />
      </li>
    </template>
    <template v-if="!isChannel && !isGroup && chatContent.memberType !== 2 && chatContent.id !== 10002">
      <li>
        <span> {{ $t("阅后即焚") }}</span>
        <ComSwitch
          :value="bfReadCancel"
          :disable="isGroup"
          @input="handleRcheduleDeletionConfig({ bfReadCancel: !bfReadCancel })"
        />
      </li>
      <li v-if="bfReadCancel">
        <span> {{ $t("消息销毁时间") }}</span>
        <div class="select" @click="handleOpenMenuTimeList">
          {{ fnRcheduleDeletionTimeTextGet(msgCancelTime) }}
          <img src="@/assets/images/setting/choice-icon.png" />
        </div>
        <vue-context class="menuTimeList" ref="menuTimeList" :lazy="true">
          <li
            v-for="(item, index) in rcheduleDeletionTimeList"
            :key="index"
            @click="handleRcheduleDeletionConfig({ msgCancelTime: item.value })"
          >
            {{ item.name }}
          </li>
        </vue-context>
      </li>
    </template>
    <template v-if="!isChannel && isGroup && chatContent.memberType !== 2">
      <li v-if="chatContent.memberType == 0">
        <span>{{ $t("进群需审核") }}</span>
        <ComSwitch :value="bfJoinCheck" @input="handelBfJoinCheckChange" />
      </li> 
      <!-- <li>
        <span> {{ $t("禁止成员互添加好友") }}</span>
        <ComSwitch :value="bfJoinFriend" @input="handelBfJoinFriendChange" />
      </li> -->
    </template>
    <li class="clearHistory" v-if="!isChannel || (isChannel && chatContent.memberType !== 3)" @click="$emit('openDialogMsgClear')">
      {{ $t("清空聊天记录") }}
    </li>

    <template v-if="isGroup">
      <li class="clearHistory" v-if="chatContent.memberType == 0" @click="handelDisbandGroup">
        解散群聊
      </li>
      <li class="clearHistory" v-else @click="handelExitGroup">
        删除并退出
      </li>
    </template>
    <template v-else-if="isChannel"></template>
    <template v-else>
        <li class="clearHistory" @click="handelDeleteFriend">
          删除联系人
        </li>
    </template>
   
  </ul>
</template>
<script>
// 工具
import {
  rcheduleDeletionTimeList,
  fnRcheduleDeletionTimeTextGet,
} from "@/utils/widget";

// 事件
import eventBase from "@/event/base";

// 控件
import ComSwitch from "@/pages/home/com/switch.vue";

// api
import { updateMember } from "@/api/imChannel.js";
import { contactsRelation } from "@/api/imContacation.js";
import { updateBlackContacts } from "@/api/imContacation";
import { disableGroup, groupExit } from "@/api/imGroup.js";

export default {
  components: {
    ComSwitch,
  },
  props: ["chatContent", "isGroup"],
  data() {
    return {
      rcheduleDeletionTimeList, // 定时删除时间列表
      bfReadCancel: false, // 阅后即焚 是否开启
      msgCancelTime: 30, // 阅后即焚 时间
      bfTop: false, // 置顶
      bfDisturb: false, // 免打扰
      bfAddress: true, // 保存地址
      bfJoinCheck: false, // 进群是否需要审核
      bfJoinFriend: true, // 是否可以加好友
      bfChannelReceive: false, // 频道消息接收
      bfMyBlack: false, // 是否黑名单好友
    };
  },
  mounted() {
    const {
      bfReadCancel,
      msgCancelTime,
      bfTop,
      bfDisturb,
      bfAddress,
      bfJoinCheck,
      bfJoinFriend,
      isDisturb,
      bfMyBlack,
    } = this.chatContent;

    // 阅后即焚 是否开启
    this.bfReadCancel = bfReadCancel;

    // 阅后即焚 是否开启
    this.msgCancelTime = msgCancelTime || 30;

    // 置顶
    this.bfTop = bfTop;

    // 免打扰
    this.bfDisturb = bfDisturb;

    // 是否保存到通讯录
    this.bfAddress = bfAddress;

    // 进群是否需要审核
    this.bfJoinCheck = bfJoinCheck;

    // 是否可以加好友
    this.bfJoinFriend = bfJoinFriend;

    // 频道接收通知
    this.bfChannelReceive = !isDisturb;
    // 是否黑名单好友
    this.bfMyBlack = bfMyBlack;

    // 事件监听
    this.handleEventMonitor()

    // 监听点击关闭菜单
    const dom = document.getElementById("comRightMenu");
    if (dom) {
      dom.addEventListener("click", this.handleCloseMenuTimeList);
    }
  },
  beforeDestroy() {
    // 移除 监听点击关闭菜单
    const dom = document.getElementById("comRightMenu");
    if (dom) {
      dom.removeEventListener("click", this.handleCloseMenuTimeList);
    }
  },
  computed: {
    isChannel() {
      return this.chatContent.type === 'channel'
    }
  },
  methods: {
    fnRcheduleDeletionTimeTextGet,
    /**
     * 退出群聊
     */
    async handelExitGroup() {
      const { id, type} = this.chatContent
      if(type !== "group" || !id) return;
      const state = await window.$confirm({
        remark: "确认要退出群聊，且删除此群的聊天记录?"
      })
      if(!state) return;
      groupExit({ groupId: id }).then(res => {
         const { errCode } = res?.commonResult || {}
            if (errCode == 200) {
                window.$toast("退出成功");
                eventBase.fnCommunicationSendMsg({
                  operator: "activeChange",
                  data: {comType: ""},
                });
            } else {
                res?.errorDesc && window.$toast(res.errorDesc);
            }
      })
    },
    /**
     * 解散群聊
     */
   async handelDisbandGroup() {
      const { id, type} = this.chatContent
      if(type !== "group" || !id) return;
      const state = await window.$confirm({
        remark: "解散群聊后,所有群成员将失去和群友的联系,同时该群的聊天内容将全部删除"
      })
      if(!state) return;
      disableGroup({ groupId: id }).then(res => {
         const { errCode } = res?.commonResult || {}
            if (errCode == 200) {
                window.$toast("解散成功");
                eventBase.fnCommunicationSendMsg({
                  operator: "activeChange",
                  data: {comType: ""},
                });
            } else {
                res?.errorDesc && window.$toast(res.errorDesc);
            }
      })
    },
    /**
     * 修改好友黑名单状态
     */
    handelBfMyBlackChange() {
      const { type, id } = this.chatContent;
       if(type !== "friend") return;
        const pra = {
            targetUid: Number(id),
            op: this.bfMyBlack ? 7 : 6,
        }
        updateBlackContacts(pra).then(res => {
            const { errCode } = res?.commonResult || {}
            if (errCode == 200) {
                this.bfMyBlack = pra.op === 6;
                window.$toast( this.bfMyBlack ? "加入成功" : "移除成功");
            } else {
                res?.errorDesc && window.$toast(res.errorDesc);
            }
        })
    },
    /**
     * 删除好友
     */
   async handelDeleteFriend() {
      const { type, id } = this.chatContent;
      if(type !== "friend") return;
      const state = await window.$confirm({
          remark: "删除该联系人,会同时删除与该联系人的聊天记录"
        })
      if(!state) return;
      const pra = {
        targetUid: id,
        msg: "",
        op: 1,
      }
      contactsRelation(pra).then(res => {
          if(res.commonResult?.errCode === 200) {
              window.$toast("删除成功");
              eventBase.fnCommunicationSendMsg({
                  operator: "activeChange",
                  data: {comType: ""},
              });
          }
      })
    },
    /**
     * 是否可以加好友 改变
     */
    handelBfJoinFriendChange() {
      const { id, type } = this.chatContent;

      // 改变
      this.bfJoinFriend = !this.bfJoinFriend;

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfJoinFriendSet",
        data: {
          id,
          type,
          bfJoinCheck: this.bfJoinFriend,
        },
      });
    },
    /**
     * 进群是否需要审核 改变
     */
    handelBfJoinCheckChange() {
      const { id, type } = this.chatContent;

      // 改变
      this.bfJoinCheck = !this.bfJoinCheck;

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfJoinCheckSet",
        data: {
          id,
          type,
          bfJoinCheck: this.bfJoinCheck,
        },
      });
    },
    /**
     * 是否保存到通讯录 改变
     */
    handelBfAddressChange() {
      const { id, type } = this.chatContent;

      // 改变
      this.bfAddress = !this.bfAddress;

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfAddressSet",
        data: {
          id,
          type,
          bfAddress: this.bfAddress,
        },
      });
    },
    channelReceiveChange(state) {
      const { channelId } = this.chatContent
      const params = {
        channelId,
        isDisturb: Number(!state),
      }
      updateMember(params).then(res => {
        if(res?.code === 200) {
          this.bfChannelReceive = state
          eventBase.fnCommunicationSendMsg({
            operator: "channelDisturbSet",
            data: {
              id: channelId,
              isDisturb: params.isDisturb,
              type: "channel"
            },
          });
        }
      })
    },
    /**
     * 免打扰改变
     */
    handelBfDisturbChange() {
      const { id, type, name, nickName, pic } = this.chatContent;

      // 改变
      this.bfDisturb = !this.bfDisturb;

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfDisturbSet",
        data: {
          id,
          type,
          bfDisturb: this.bfDisturb,
          name: type == "group" ? name : name || nickName,
          icon: pic,
        },
      });
    },
    /**
     * 打开时间列表菜单
     */
    handleOpenMenuTimeList(e) {
      // if (this.isGroup) {
      //   window.$toast('当前操作已被禁用')
      //   return
      // }
      e.stopPropagation();
      this.$refs.menuTimeList && this.$refs.menuTimeList.open(e);
    },
    /**
     * 关闭时间列表菜单
     */
    handleCloseMenuTimeList() {
      this.$refs.menuTimeList && this.$refs.menuTimeList.close();
    },
    /**
     * 置顶改变
     */
    handelBfTopChange() {
      const { id, type } = this.chatContent;

      // 改变
      this.bfTop = !this.bfTop;

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "bfTopSet",
        data: {
          id,
          type,
          bfTop: this.bfTop,
        },
      });
    },
    /**
     * 阅后即焚 配置
     */
    handleRcheduleDeletionConfig({ bfReadCancel, msgCancelTime }) {
      const { id, type } = this.chatContent;

      // 改变是否开启
      if (bfReadCancel !== undefined) {
        this.bfReadCancel = bfReadCancel;
      }

      // 改变时间
      if (msgCancelTime) {
        this.msgCancelTime = msgCancelTime;
      }

      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "rcheduleDeletionSet",
        data: {
          id,
          type,
          bfReadCancel,
          msgCancelTime,
        },
      });
    },
    /**
     * 事件监听
     */
     handleEventMonitor() {
      eventBase.fnCommunicationMonitoring(
        "configList",
        [
          "msgReadDelete" // 阅后即焚
        ],
        this.eventHandling
      );
    },
    eventHandling(info, operator, operatorType) {
      if (!info) {
        return;
      }
      switch (operator) {
        case "msgReadDelete": {
          if (info.errCode == 5113) {
            window.$toast(this.$t('不是好友关系'))
            this.bfReadCancel = false;
          }
          break;
        }
      }
    }
  },
};
</script>
<style lang="scss">
.comConfigList {
  padding: 10px 0;
  margin: 0;
  border-top: 10px solid #f5f5f5;

  li {
    display: flex;
    justify-content: space-between;
    height: 35px;
    align-items: center;
    padding: 0 10px;

    .menuTimeList {
      > li {
        cursor: pointer;

        &:hover {
          background: #f5f5f5;
        }
      }
    }

    &.clearHistory {
      display: flex;
      justify-content: center !important;
      color: #f44e5a;
      cursor: pointer;
    }
  }
}
</style>