<template>
  <div class="forwardSelectDialog" @click.stop>
    <div>
      <h1>
        <img
          v-if="selectedType !== null"
          class="back-arrow"
          src="@/assets/images/headNav/arrow-right.png"
          @click="handleBack"
        />
        <div @click="handleBack">{{ currentTitle }}</div>
      </h1>
      <div class="search">
        <img src="@/assets/images/headNav/search-icon.png" />
        <input v-model="searchText" :placeholder="$t('搜索')" />
        <picture v-if="searchText !== ''" @click="searchText = ''">
          <img src="@/assets/images/headNav/search-close-icon.png" />
        </picture>
      </div>
      <div class="content-wrapper" :class="{ 'slide-left': selectedType !== null }">
        <div class="main-view">
          <div class="top-items" v-show="selectedType === null">
            <div class="top-item" @click="handleSelectFriend">
              <img class="avatar" src="@/assets/images/logo/logo-58.png" />
              <span class="label">{{ $t("选择朋友") }}</span>
              <img class="arrow" src="@/assets/images/headNav/arrow-right.png" />
            </div>
            <div class="divider"></div>
            <div class="top-item" @click="handleSelectGroup">
              <img class="avatar" src="@/assets/images/logo/group-icon.png" />
              <span class="label">{{ $t("选择群聊") }}</span>
              <img class="arrow" src="@/assets/images/headNav/arrow-right.png" />
            </div>
            <div class="divider"></div>
            <div class="top-item" @click="handleSelectChannel">
              <img class="avatar" src="@/assets/images/logo/channel-notice.webp" />
              <span class="label">{{ $t("选择频道") }}</span>
              <img class="arrow" src="@/assets/images/headNav/arrow-right.png" />
            </div>
          </div>
          <div class="section-separator" v-show="selectedType === null">
            <span>{{ $t("最近") }}</span>
          </div>
          <section ref="list">
            <ul
              :style="{
                paddingTop: this.scrollShowIndex * 60 + 'px',
                height: list.length * 60 + 'px',
              }"
            >
              <li
                v-for="(item, index) in listLazy"
                :key="scrollShowIndex + index"
                @click="$emit('submit', item)"
              >
                <ComTextAvatar
                  v-if="item.type === 'channel' && !item.pic && !item.icon"
                  :value="item.channelName"
                  :id="item.channelId"
                  width="40px"
                  height="40px"
                />
                <ComImage v-else :src="item.pic || item.icon" :type="item.type" />
                {{ item.name || item.nickName || item.channelName }}
              </li>
            </ul>
          </section>
        </div>
      </div>
      <div class="btns">
        <span @click.stop="$emit('close')">{{ $t("取消") }}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { Cache } from "@/cache";
import ComTextAvatar from "@/components/text-avatar";

// 事件
import eventCommon from "@/event/common";
import eventChat from "@/event/chat";

export default {
  components: { ComTextAvatar },
  props: ["chatContent"],
  data() {
    return {
      searchText: "",
      scrollShowIndex: 0,
      chats: [],
      groups: [],
      friendList: [],
      channels: [], // 频道列表
      selectedType: null, // null, 'friend', 'group', 'channel'
    };
  },
  computed: {
    currentTitle() {
      if (this.selectedType === 'friend') {
        return this.$t("选择朋友");
      } else if (this.selectedType === 'group') {
        return this.$t("选择群聊");
      } else if (this.selectedType === 'channel') {
        return this.$t("选择频道");
      }
      return this.$t("消息转发");
    },
    list() {
      const friendIdMap = {};
      const groupIdMap = {};
      const channelIdMap = {};

      this.chats.forEach(({ type, id }) => {
        if (type === "friend") {
          friendIdMap[id] = true;
        } else if (type === "group") {
          groupIdMap[id] = true;
        } else if (type === "channel") {
          channelIdMap[id] = true;
        }
      });

      const friendList = this.friendList
        .filter(({ id }) => !friendIdMap[id])
        .map((item) => {
          return {
            ...item,
            type: "friend",
          };
        });
      const groups = this.groups
        .filter(({ id }) => !groupIdMap[id] && id !== "invitation")
        .map((item) => ({
          ...item,
          type: "group",
        }));
      const channels = this.channels
        .filter(({ id }) => !channelIdMap[id])
        .map((item) => ({
          ...item,
          type: "channel",
        }));

      // 根据selectedType过滤数据
      let allItems = [...this.chats, ...friendList, ...groups, ...channels];

      if (this.selectedType !== null) {
        allItems = allItems.filter(item => item.type === this.selectedType);
      }
      console.log('>>>>', allItems.length);

      // 搜索过滤
      return this.searchText !== ""
        ? allItems.filter(
            ({ name, nickName, channelName }) => {
              const searchLower = this.searchText.toLowerCase();
              return name?.toLowerCase().includes(searchLower) ||
                nickName?.toLowerCase().includes(searchLower) ||
                channelName?.toLowerCase().includes(searchLower)
            }
          )
        : allItems;
    },
    listLazy() {
      return this.list.slice(this.scrollShowIndex, this.scrollShowIndex + 20);
    },
  },
  mounted() {
    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
      getId: "loginId",
    });

    // 聊天列表
    Cache(`${loginId}MessageGroupList`).then((res) => {
      if (res && res.length > 0) {
        // id = invitation 表示是群通知的会话框，则不需要
        let list = res.filter((item) => item.id !== "invitation");
        this.chats = eventChat.fnChatListSort([...this.chats, ...list]).list;
      }
    });

    Cache(`${loginId}MessageUserList`).then((res) => {
      if (res && res.length > 0) {
        this.chats = eventChat.fnChatListSort([...this.chats, ...res]).list;
      }
    });

    // 群列表
    Cache(`${loginId}-GroupList`).then((res) => {
      this.groups = res ? res.filter((item) => item.bfAddress) : [];
    });

    // 获取好友列表
    Cache(`${loginId}-ContactList`).then((res) => {
      if (res && res.length > 0) {
        this.friendList = res;
      }
    });

    // 获取频道列表
    Cache(`${loginId}-ChannelList`).then((res) => {
      this.channels = res ? res : [];
    });

    Cache(`${loginId}MessageChannelList`).then((res) => {
      if (res && res.length > 0) {
        this.chats = eventChat.fnChatListSort([...this.chats, ...res]).list;
      }
    });

    // 懒渲染
    this.$refs["list"].addEventListener("scroll", this.handleListScrollChange);
  },
  beforeDestroy() {
    // 懒渲染
    this.$refs["list"].removeEventListener(
      "scroll",
      this.handleListScrollChange
    );
  },
  methods: {
    handleListScrollChange() {
      const scrollTop = this.$refs["list"].scrollTop;
      const num = Math.ceil(scrollTop / 60);
      this.scrollShowIndex = num > 10 ? num - 11 : 0;
    },
    handleSelectFriend() {
      this.selectedType = "friend";
      this.searchText = "";
      this.scrollShowIndex = 0;
      if (this.$refs["list"]) {
        this.$refs["list"].scrollTop = 0;
      }
    },
    handleSelectGroup() {
      this.selectedType = "group";
      this.searchText = "";
      this.scrollShowIndex = 0;
      if (this.$refs["list"]) {
        this.$refs["list"].scrollTop = 0;
      }
    },
    handleSelectChannel() {
      this.selectedType = "channel";
      this.searchText = "";
      this.scrollShowIndex = 0;
      if (this.$refs["list"]) {
        this.$refs["list"].scrollTop = 0;
      }
    },
    handleBack() {
      this.selectedType = null;
      this.searchText = "";
      this.scrollShowIndex = 0;
      if (this.$refs["list"]) {
        this.$refs["list"].scrollTop = 0;
      }
    },
  },
};
</script>
<style lang="scss">
.forwardSelectDialog {
  position: fixed;
  z-index: 99;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba($color: #000000, $alpha: 0.2);

  > div {
    position: absolute;
    width: 350px;
    top: 50%;
    left: 50%;
    background: #fff;
    border-radius: 5px;
    transform: translate(-50%, -50%);

    > h1 {
      margin: 0;
      padding: 15px 0 5px 20px;
      font-size: 16px;
      font-weight: bold;
      position: relative;
      display: flex;
      align-items: center;

      > .back-arrow {
        position: absolute;
        left: 10px;
        height: 12px;
        transform: rotate(180deg);
        cursor: pointer;
        opacity: 0.6;

        &:hover {
          opacity: 1;
        }
      }
    }

    > .search {
      height: 40px;
      padding-left: 45px;
      position: relative;
      border-bottom: 1px solid #eee;
      display: flex;

      > img {
        position: absolute;
        left: 20px;
        height: 15px;
        top: 50%;
        transform: translateY(-50%);
      }

      > input {
        width: 100%;
        background: none;

        &::placeholder {
          color: #999;
        }
      }

      > picture {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }

        > img {
          display: block;
          width: 15px;
          height: 15px;
        }
      }
    }

    > .content-wrapper {
      position: relative;
      overflow: hidden;

      > .main-view {
        width: 100%;
        transition: all 0.3s ease-in-out;

        > .top-items {
          background: #fff;

          > .top-item {
            display: flex;
            align-items: center;
            height: 60px;
            padding-left: 70px;
            padding-right: 20px;
            cursor: pointer;
            position: relative;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover {
              background: #f6f4f4;
            }

            > .avatar {
              position: absolute;
              left: 10px;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
            }

            > .label {
              flex: 1;
              font-size: 14px;
              color: #666;
            }

            > .arrow {
              height: 12px;
              opacity: 0.4;
              margin-left: 10px;
            }
          }

          > .divider {
            height: 1px;
            background: #eee;
            margin: 0 20px;
          }
        }

        > .section-separator {
          height: 20px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          padding-left: 10px;

          > span {
            font-size: 12px;
            color: #999;
          }
        }

        > section {
          position: relative;
          height: 240px;
          overflow-y: auto;
          transition: height 0.3s ease-in-out;

          > ul {
            padding: 0;
            margin: 0;
            box-sizing: border-box;

            > li {
              display: flex;
              height: 60px;
              align-items: center;
              font-size: 14px;
              color: #666;
              cursor: pointer;
              position: relative;
              padding-left: 70px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              box-sizing: border-box;

              &:hover {
                background: #f6f4f4;
              }

              > img,
              > label {
                position: absolute;
                left: 10px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
              }
            }
          }
        }
      }

      &.slide-left {
        > .main-view {
          animation: slideInFromRight 0.3s ease-in-out;

          > section {
            height: 442px;
          }
        }
      }
    }

    @keyframes slideInFromRight {
      0% {
        transform: translateX(100%);
        opacity: 0;
      }
      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }

    > .btns {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      border-top: #e4e4e4 1px solid;

      > span {
        cursor: pointer;
        color: #0084cb;
        font-size: 14px;
        line-height: 34px;
        display: block;
        padding: 0 20px;
        border-radius: 4px;

        &:hover {
          background: #e3f1fa;
        }
      }
    }
  }
}
</style>
