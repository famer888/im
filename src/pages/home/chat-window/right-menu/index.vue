<template>
  <div id="comRightMenu" ref="rightMenu" @click.stop>
    <div class="right-menu-content">
      <div class="mask" v-if="chatContent.isDisable"></div>
     <template v-if="chatContent.type === 'channel'">
       <ChannelLink v-if="chatContent.linkType !== 1"  :chatContent="chatContent"  @showQrCode="channelQrcodeVisilbe = true" />
       <ComChannelQrcode v-if="channelQrcodeVisilbe" :chatContent="chatContent"  @close="channelQrcodeVisilbe = false" />
     </template> 
    <template v-else-if="isGroup">
     <ComGroupAliasQrcode
        :chatContent="chatContent"
        @showGroupQrCode="groupQrcodeVisilbe = true"
      />
      <ComGroupNotice :notice="notice" :memberInfoList="memberInfoList" :chatContent="chatContent" />
      <ComGroupQrcode
        v-if="groupQrcodeVisilbe"
        :chatContent="chatContent"
        @close="groupQrcodeVisilbe = false"
      />
    </template>
    <ComFriendInfo v-else :chatContent="chatContent" />
    <ComConfigList
      :chatContent="chatContent"
      :isGroup="isGroup"
      @openDialogMsgClear="handleDialogMsgClearSet"
    />
    <template v-if="isChannel">
        <ul v-if="chatContent.adminPrivacy" class="managerLabel">
          <li @click="handleOpenChannelManageDialog">
            {{ $t("管理员") }}
          </li>
        </ul>
        <ComChannelMemberList
          v-if="chatContent.adminPrivacy"
          :chatContent="chatContent"
          :memberInfoList="channelUserList"
          :friendList="friendList"
          :showIndex="0"
        />
    </template>
    <ul v-if="isGroup && chatContent.memberType !== 2 " class="managerLabel">
      <li @click="handleOpenGroupManageDialog">
        {{ $t("管理员") }}
      </li>
    </ul>
    <div v-if="isGroup" class="invite-friend" @click="inviteFriendDialogVisible = true">邀请好友</div>
    <ComMemberList
      v-if="isGroup"
      :chatContent="chatContent"
      :memberInfoList="memberInfoList"
      :friendList="friendList"
      :showIndex="0"
    />
    <ComGroupManageDialog
      v-if="groupManageDialogVisible"
      :memberInfoList="memberInfoList"
      :groupId="chatContent.id"
    />
    <ComChannelManageDialog
      v-if="channelManageDialogVisible"
      :memberInfoList="channelUserList"
      :channelId="chatContent.channelId"
    />
    <ComDialogRadioSelect
      v-if="clearMsgTypeList.length > 0"
      :title="$t('请选择清空类型')"
      :radioTextList="clearMsgTypeList"
      @submit="handleDialogMsgClearSet"
    />
    <ComInviteFriendJoinGroup
      v-if="inviteFriendDialogVisible"
       :groupId="chatContent.id"
       :memberInfoList="memberInfoList"
      @close="inviteFriendDialogVisible = false"
    />
    </div>
  </div>
</template>
<script>
import _ from "lodash";
import dayjs from "dayjs";
// api
import { groupMemberOnLineStatusList } from "@/api/imGroup";

// 组件
import ComConfigList from "./config-list.vue";
import ComGroupAliasQrcode from "./group-alias-qrcode.vue";
import ComGroupNotice from "./group-notice/index.vue";
import ChannelLink from "./channel-link.vue";
import ComInviteFriendJoinGroup  from "./invite-friend-join-group";

// 工具
import { rcheduleDeletionTimeList } from "@/utils/widget";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  components: {
    ComConfigList,
    ComGroupAliasQrcode,
    ComGroupNotice,
    ChannelLink,
    ComInviteFriendJoinGroup,
    ComGroupQrcode: () => import("./group-qrcode.vue"),
    ComChannelQrcode: () => import("./channel-qrcode.vue"),
    ComFriendInfo: () => import("./friend-info.vue"),
    ComMemberList: () => import("./member-list.vue"),
    ComChannelMemberList: () => import("./channel-member-list.vue"),
    ComGroupManageDialog: () => import("./group-manage-dialog.vue"),
    ComChannelManageDialog: () => import("./channel-manage-dialog.vue"),
    ComDialogRadioSelect: () =>
      import("@/pages/home/com/radio-select-dialog.vue"),
  },
  props: ["chatContent", "isGroup", "isGroupUpdate"],
  inject: ["provideMemberList", "provideFriendList", "provideChannelUserList"],
  data() {
    return {
      rcheduleDeletionTimeList, // 定时删除时间列表
      clearMsgTypeList: [], // 清除消息的选项列表
      groupManageDialogVisible: false, // 群管理会话框 是否显示
      channelManageDialogVisible: false, // 频道管理会话框 是否显示
      isGroupFroceUpdating: false, // 群是否 强制更新中
      groupQrcodeVisilbe: false, // 群二维码显示
      channelQrcodeVisilbe: false, // 群二维码显示
      notice: "", // 公告信息
      showIndex: 0, // 懒渲染使用的索引
      pageIndex: {}, // 分页取群成员在线状态的标识对象，已经获取过的则不会在取
      memberInfoList: [], // 群成员列表
      friendList: [],
      channelUserList: [], // 频道成员列表
      inviteFriendDialogVisible: false, // 邀请好友入群会话框 是否显示
    };
  },
  created() {
    // 获取父控件的 群成员列表
    this.memberInfoList = this.provideMemberList();
    this.friendList = this.provideFriendList();
    this.channelUserList = this.provideChannelUserList();
  },
  mounted() {

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "rightMenu",
      [
        "closeOperator", // 关闭操作
        "groupNoticeSet", // 群公告设置
      ],
      this.eventHandling
    );

    // 公告信息设置
    this.notice = _.get(this.chatContent, "groupNotice.notice") || "";
    // 默认执行第一页，请求在线状态和排序
    if(this.isGroupUpdate && this.memberInfoList.length) {
      this.getGroupMemberOnLineStatus(0)
    }
    
    // 虚拟滚动监听
    this.$refs["rightMenu"].addEventListener(
      "scroll",
      this.handleListScrollChange
    );
  },
  beforeDestroy() {
    // 虚拟滚动
    this.$refs["rightMenu"].removeEventListener(
      "scroll",
      this.handleListScrollChange
    );
  },
  computed: {
    isChannel() {
      return this.chatContent.type === 'channel'
    }
  },
  methods: {
    /**
     * 处理事件
     */
    eventHandling(info, operator) {

      switch (operator) {
        case "groupNoticeSet": {
          const { id, type, notice } = info;

          // 如果是当前，设置公告
          if (this.chatContent.id === id && this.chatContent.type === type) {
            this.notice = notice;
          }

          break;
        }
        case "closeOperator": {
          ///////////////////// 关闭操作
          // 关闭 消息清除对话框
          if (info.ids.includes("msgClearDialog")) {
            this.clearMsgTypeList = [];
          }

          // 关闭 群管理对话框
          if (info.ids.includes("groupManageDialog")) {
            this.groupManageDialogVisible = false;
          }

          // 关闭 频道管理对话框
          if (info.ids.includes("channelManageDialog")) {
            this.channelManageDialogVisible = false;
          }
          break;
        }
        default:
      }
    },
    /**
     * 打开群管理对话框
     */
    handleOpenGroupManageDialog() {
      const { memberType } = this.chatContent;
      if (memberType == 0 || memberType == 1) {
        // 打开 群管理会话框
        eventCommon.fnCloseListRU({
          addId: "groupManageDialog",
        });

        // 显示群管理对话框
        this.groupManageDialogVisible = true;
      }
    },
    /**
     * 打开频道管理对话框
     */
    handleOpenChannelManageDialog() {
      eventCommon.fnCloseListRU({
        addId: "channelManageDialog",
      });

      // 显示群管理对话框
      this.channelManageDialogVisible = true;
    },
    /**
     * 清除消息对话框 设置
     * @index undefined 为打开，-1 关闭，其他为选中提交
     */
    handleDialogMsgClearSet(index) {
      // 打开窗口
      if (index === undefined) {
        // 添加 消息清空会话框
        eventCommon.fnCloseListRU({
          addId: "msgClearDialog",
        });

        // 设置清除窗口
        if (this.isGroup) {
          this.clearMsgTypeList =
            this.chatContent.memberType == 2
              ? [this.$t("仅清空本地聊天记录")]
              : [
                  this.$t("仅清空本地聊天记录"),
                  this.$t("清空本地和所有成员设备的聊天记录"),
                ];
        } else {
          // 10002是传输助手
          this.clearMsgTypeList = this.chatContent.id == 10002 ? [this.$t("仅清空本地聊天记录")] : [
            this.$t("仅清空本地聊天记录"),
            this.$t("清空本地和对方设备的聊天记录"),
          ];
        }
      } else {
        // 移除 消息清空会话框
        eventCommon.fnCloseListRU({
          removeIds: ["msgClearDialog"],
        });

        // 不为 -1 则需要提交清空
        if (index !== -1) {
          eventBase.fnCommunicationSendMsg({
            operator: "msgDelete",
            data: {
              id: this.chatContent.id,
              type: this.chatContent.type,
              idsDelete: [],
              isRemoteDeletion: index === 1,
            },
          });
        }
      }
    },

    handleListScrollChange() {
      const num = Math.floor(this.$refs["rightMenu"].scrollTop / 40) - 30;
      this.showIndex = num < 0 ? 0 : num;
      const index = Math.ceil(this.showIndex / 40);
      if (index > 0 && !this.pageIndex[index]) {
        // 默认进入会获取第一页 40个成员的在线状态，所以当滚动的时候只有大于1的，进入第二页才开始调用，并且pageIndex会记录这一页是否获取过，如果获取过，则不会调用获取
        this.pageIndex[index] = index;
        this.getGroupMemberOnLineStatus(index);
      }
    },
    getGroupMemberOnLineStatus(index) {
      let uids = [];
      // 取40是因为接口限制最大uid数是40个，
      if (this.memberInfoList.length > 40) {
        uids = this.memberInfoList
          .slice(index * 40, (index + 1) * 40)
          .map((item) => item.id);
      } else {
        uids = this.memberInfoList.map((item) => {
          return item.id;
        });
      }

      groupMemberOnLineStatusList({
        groupId: this.chatContent.id,
        uids,
      }).then((res) => {
        if (res) {
          const { userOnLineStatusList } = res;

          // 设置群成员在线状态
          let memberInfoList = _.cloneDeep(this.memberInfoList)

          memberInfoList.forEach((item) => {

            let cur = userOnLineStatusList.find(
              (user) => Number(user.uid) == item.id
            );
            item.online = (cur && cur.online) || false;
            item.onLineTime = dayjs(Number((cur && cur.createTime || 0))).format("YYYY-MM-DD");
            item.createTime = Number((cur && cur.createTime || 0));
          });

          memberInfoList.sort((a, b) => {
              return (b.online ? 1 : 0) - (a.online ? 1 : 0)
          })
          // 排序处理
          memberInfoList.sort((a, b) => {
              return a.type - b.type
          })
          this.memberInfoList = memberInfoList;
        }
      });
    },
  },
};
</script>
<style lang="scss">
#comRightMenu {
  display: flex;
  z-index: 10;
  width: 256px;
  flex-direction: column;
  background-color: #fff;
  position: fixed;
  top: 28px;
  right: 0;
  bottom: 0;
  // box-shadow: -2px 10px 10px rgb(153 153 153 / 30%);
  overflow-y: auto;
  // border-left: 1px solid rgba(238, 238, 238, 0.3);
  color: #333;
  .right-menu-content{
    position: relative;
    flex-direction: column;
    padding-bottom: 60px;
    .mask{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 10;
  }
  }

  .managerLabel {
    cursor: pointer;
    padding: 14px 10px !important;
    border-top: 10px solid #f5f5f5;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    margin: 0;
    li {
      width:  100%;
    }

    &:hover {
      opacity: 0.8;
    }
  }

  > ul {
    padding: 10px 0;
    margin: 0;
    border-top: 10px solid #f5f5f5;

    li {
      display: flex;
      justify-content: space-between;
      height: 35px;
      align-items: center;
      padding: 0 10px;

      .menu-box {
        > li {
          cursor: pointer;

          &:hover {
            background: #f5f5f5;
          }
        }
      }
    }
  }

  > h2 {
    padding: 0 10px;
    margin: 0;
    border-top: 10px solid #f5f5f5;
    height: 40px;
    font-size: 14px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .invite-friend {
    position: fixed;
    right: 0;
    bottom: 0;
    width: 270px;
    height: 40px;
    color: #178AFF;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9;
    background: #fff;
    cursor: pointer;
  }
}
</style>
