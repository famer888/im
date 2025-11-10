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
            <div v-if="list.length === 0" class="empty-state">
              {{ $t("暂无数据") }}
            </div>
            <ul
              v-else
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
      const searchLower = this.searchText.toLowerCase();
      const hasSearch = this.searchText !== "";
      const hasTypeFilter = this.selectedType !== null;

      // 使用 Map 进行高效去重，key 为唯一标识
      const uniqueMap = new Map();

      // 辅助函数：检查是否匹配搜索条件
      const matchSearch = (item) => {
        if (!hasSearch) return true;
        const { name, nickName, channelName } = item;
        return name?.toLowerCase().includes(searchLower) ||
               nickName?.toLowerCase().includes(searchLower) ||
               channelName?.toLowerCase().includes(searchLower);
      };

      // 辅助函数：添加项到 Map（自动去重）
      const addItem = (item, type) => {
        if (hasTypeFilter && type !== this.selectedType) return;
        if (!matchSearch(item)) return;

        const key = `${type}_${item.channelId || item.groupId || item.id}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...item, type });
        }
      };

      // 按优先级顺序处理：chats 优先（最近聊天）
      this.chats.forEach(item => addItem(item, item.type));

      // 处理好友列表
      this.friendList.forEach(item => addItem(item, "friend"));

      // 处理群组列表
      this.groups.forEach(item => addItem(item, "group"));

      // 处理频道列表（只包含有管理员权限的）
      this.channels.forEach(item => {
        if (item.adminPrivacy) {
          addItem(item, "channel");
        }
      });
      uniqueMap.delete("friend_channelNotice");
      uniqueMap.delete("group_invitation");
      return Array.from(uniqueMap.values());
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
        this.chats = eventChat.fnChatListSort([...this.chats, ...res]).list;
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
      // 只显示有管理员以上权限的频道
      this.channels = res ? res.filter(item => item.adminPrivacy) : [];
    });

    Cache(`${loginId}MessageChannelList`).then((res) => {
      if (res && res.length > 0) {
        // 只显示有管理员以上权限的频道聊天
        const filteredChannels = res.filter(item => item.adminPrivacy);
        this.chats = eventChat.fnChatListSort([...this.chats, ...filteredChannels]).list;
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

          > .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 14px;
            color: #999;
          }

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
