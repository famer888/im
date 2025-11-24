<template>
  <div class="comTop">
    <template v-if="chatContent && chatContent.id !== '10002'">
      <picture @click.stop="handleChatRightMenuVisibleChange">
        <ComTextAvatar
          v-if="showChannelTextIcon"
          class="textAvatar"
          :id="chatContent.channelId"
          :value="chatContent.channelName"
        />
        <ComImage v-else :src="chatContent.pic || chatContent.icon" :type="chatContent.type" />
      </picture>
      <div class="userinfo-channel" v-if="chatContent.type === 'channel'">
          <div class="nickname">{{ name }}</div>
          <div class="subscriber">{{chatContent.memberCount}}位订阅者</div>
      </div>
      <div class="userinfo" v-else>
        <div class="nickname">
          <input
            v-if="nameEdit"
            v-model="name"
            autofocus
            ref="refName"
            maxlength="50"
            @blur="handleRemarkNameUpdate"
            @keyup.enter="nameEdit = false"
          />
          <div v-else-if="name" class="text">
            <span
              class="word"
              v-for="(item, index) in nameArr"
              :key="index"
              @click.stop="handleNameClick(index)"
            >
              {{ item }}
            </span>
          </div>
          <div v-if="memberCount" class="count">
             ({{  chatContent.memberCount || memberCount }}{{ $t("人") }})
          </div>
        </div>
        <div class="other">
          <img
            v-if="chatContent.id >= 10000 && chatContent.id <= 10010"
            src="@/assets/images/userInfo/user-icon-v.png"
          />
          <img
            v-if="chatContent.type === 'friend' && !nameEdit"
            src="@/assets/images/message/edit-icon.png"
            @click="handleNameEdit"
          />
        </div>
      </div>
      <img class="icon-search" src="@/assets/images/headNav/icon-search-black.png" @click="serachChat"/>
      <div class="more" v-if="![10001, 10005].includes(chatContent.id)" @click.stop="handleChatRightMenuVisibleChange">
        <img src="@/assets/images/system/icon-menu.png" />
      </div>
      <div class="right-menu-place" v-if="rightMenuVisible"></div>
      <section v-if="selectedList.length > 0" class="selected">
        <span v-if="!haveAnnouncement" @click="$emit('forwardDialogShow')">
          {{ $t("转发") }} {{ selectedList.length }}
        </span>
        <span @click="$emit('topEvent', 'mgsDeleteLocal')">
          {{ $t("删除") }} {{ selectedList.length }}
        </span>
        <span
          v-if="allSelf"
          @click="$emit('topEvent', 'mgsDeleteAllEquipment')"
        >
          {{
            this.chatContent.type === "friend"
              ? `从本地和 ${
                  setMaxLengthStr(
                    this.chatContent.name || this.chatContent.nickName,
                    18
                  ) || $t("移动端")
                } 删除`
              : $t("为所有人删除")
          }}
          {{ selectedList.length }}
        </span>
        <span class="cancel" @click="handleCancel">{{ $t("取消") }}</span>
      </section>
    </template>
    <template v-else-if="chatContent">
      <picture>
        <img src="@/assets/images/message/cszs-icon.png" />
      </picture>
      {{ $t("传输助手") }}
      <img src="@/assets/images/userInfo/user-icon-v.png" />
    </template>
  </div>
</template>
<script>
import { setMaxLengthStr } from "@/utils/base";
import { copyText } from "@/utils/clipboard";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventGroup from "@/event/group";

import ComTextAvatar from '@/components/text-avatar';

let timerNameClick = null;

export default {
  props: ["selectedList", "rightMenuVisible", "memberCount", "chatContent"],
  components: { ComTextAvatar },
  data() {
    return {
      nameEdit: false,
      name: "",
      nameClickNum: 0,
      oldName: "",
    };
  },
  computed: {
    showChannelTextIcon() {
      return this.chatContent.type === 'channel' && !this.chatContent.icon;
    },
    allSelf() {
      return this.selectedList.filter((item) => !item.isSelf).length === 0;
    },
    haveAnnouncement() {
      return Boolean(
        this.selectedList.find((item) =>
          [8, 50, 51, 52].includes(item.chatType)
        )
      );
    },
    nameArr() {
      if (this.name) {
        // 此处理是运营团队提出小需求，希望点击一个单词块就可以复制出来
        return this.name.replaceAll("🪵", "?").split(" ");
      }
      return [];
    },
  },
  mounted() {
    // 初始化名称
    if (this.chatContent) {
      this.name = this.chatContent.name || this.chatContent.nickName  || this.chatContent.channelName;
      this.oldName = this.name;
    }
  },
  methods: {
    setMaxLengthStr,
    serachChat() {
      const { id, type, pic } = this.chatContent;
      console.log('chatContent--',this.chatContent)
      eventBase.fnCommunicationSendMsg({
          operator: "searchSpecifiedChat",
          data: {
              id,
              type,
              pic,
              name: this.name,
          }
      });
    },
    /**
     * 取消选中
     */
    handleCancel() {
      eventCommon.fnCloseListRU({
        removeIds: ["msgSelection"],
      });
    },
    /**
     * 聊天右菜单显示改变
     */
    handleChatRightMenuVisibleChange() {
      if (this.rightMenuVisible) {
        eventCommon.fnCloseListRU({
          removeIds: ["chatRightMenu"],
        });
      } else {
        eventCommon.fnCloseListRU({
          addId: "chatRightMenu",
        });

        // 开启 聊天右菜单
        this.$emit("topEvent", "rightMenuVisibleShow");

        // 如果是群，获取一次群详情
        if (this.chatContent.type == "group") {
          eventGroup.fnGroupDetailGet(this.chatContent.id);
        }
      }
    },
    /**
     * 名字点击，单点一次打开右菜单，双击进行复制
     */
    handleNameClick(index) {
      this.nameClickNum++;

      if (timerNameClick) {
        clearTimeout(timerNameClick);
      }

      timerNameClick = setTimeout(() => {
        if (this.nameClickNum === 1) {
          // 显示右菜单
          this.handleChatRightMenuVisibleChange();
        } else {
          if (this.nameClickNum === 2) {
            copyText(this.nameArr[index]);
          } else {
            copyText(this.name.replaceAll("🪵", "?"));
          }
          window.$toast(this.$t("复制成功"));
        }
        this.nameClickNum = 0;
      }, 400);
    },
    /**
     * 名称编辑
     */
    handleNameEdit() {
      this.nameEdit = true;
      this.$nextTick(() => {
        this.$refs["refName"].focus();
      });
    },
    /**
     * 修改备注名
     */
    handleRemarkNameUpdate() {
      this.nameEdit = false;
      let isDeleeteRemarkName = false;
      if (this.name === this.oldName) {
        return;
      }
      // 判断是否有改变，如果没有改变，则不调用更新方法
      if (this.name === "") {
        // 空字符串表示删除备注名
        isDeleeteRemarkName = true;
        this.name = this.chatContent.nickName;
      }

      this.oldName = this.name;
      // 通讯 更新好友备注
      eventBase.fnCommunicationSendMsg({
        operator: "friendRemarkUpdate",
        operatorType: "name",
        data: {
          id: this.chatContent.id,
          type: "friend",
          values: {
            // 空字符串表示删除备注名
            name: isDeleeteRemarkName ? "" : this.name,
          },
        },
      });
    },
  },
  watch: {
    chatContent: {
      handler() {
        if (this.chatContent) {
          this.name = this.chatContent.name || this.chatContent.nickName  || this.chatContent.channelName;
        }
      },
    },
  },
};
</script>
<style lang="scss" scoped>
.comTop {
  display: flex;
  height: 51px;
  padding: 0 16px;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  font-family: PingFangSC-Bold;
  color: #333;
  position: relative;
  overflow: hidden;
  white-space: nowrap;

  .icon-search {
    margin-right: 10px;
    height: 20px;
    cursor: pointer;
  }

  > img {
    height: 15px;
    display: block;
    margin-left: 5px;
  }

  > picture {
    height: 25px;
    width: 25px;
    margin-right: 12px;

    > img {
      display: block;
      height: 100%;
      width: 100%;
      border-radius: 50%;
    }
  }
  .userinfo-channel {
    flex: 1;
    height: 51px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .subscriber {
      color: #b4b4b4;
      font-size: 10px;
      font-weight: 400;
      margin-top: 4px;
    }

    .nickname {
      max-width: calc(100% - 50px);
      overflow: hidden;
      display: flex;
      flex-wrap: nowrap;
    }
  }

  .userinfo {
    flex: 1;
    display: flex;
    height: 51px;
    align-items: center;
    overflow: hidden;

    .nickname {
      max-width: calc(100% - 50px);
      overflow: hidden;
      display: flex;
      flex-wrap: nowrap;

      > input {
        font-size: 16px;
        font-weight: 700;
        font-family: PingFangSC-Bold;
        color: #333;
        padding: 0;
      }

      .text {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 16px;
        display: flex;
        align-items: center;
        .word {
          padding-right: 3px;
        }
      }

      .count {
        font-size: 16px;
      }
    }

    .other {
      flex: 1;
      display: flex;
      align-items: center;

      > img {
        margin-left: 5px;

        &:first-child {
          width: 20px;
          height: 20px;
        }

        &:nth-child(2) {
          width: 15px;
          height: 15px;
          cursor: pointer;
        }
      }
    }
  }

  > .more {
    width: 30px;
    height: 30px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }

    > img {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  > .right-menu-place {
    width: 260px;
    flex-shrink: 1;
  }

  > .selected {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
    background: #fff;
    display: flex;
    align-items: center;
    padding-left: 20px;

    > span {
      display: block;
      height: 30px;
      line-height: 30px;
      min-width: 100px;
      text-align: center;
      background: #40a7e3;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      margin-right: 10px;
      border-radius: 5px;
      cursor: pointer;
      padding: 0 20px;

      &:hover {
        background: #2398db;
      }

      &.cancel {
        background: #999;

        &:hover {
          background: #bbb;
        }
      }
    }
  }
  .textAvatar {
    width: 25px;
    height: 25px;
    font-size: 12px;
  }
}
</style>
