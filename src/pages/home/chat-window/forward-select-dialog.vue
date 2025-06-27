<template>
  <div class="forwardSelectDialog" @click.stop>
    <div>
      <h1>{{ $t("消息转发") }}</h1>
      <div class="search">
        <img src="@/assets/images/headNav/search-icon.png" />
        <input v-model="searchText" :placeholder="$t('搜索')" />
        <picture v-if="searchText !== ''" @click="searchText = ''">
          <img src="@/assets/images/headNav/search-close-icon.png" />
        </picture>
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
            <ComImage :src="item.pic" :type="item.type" />
            {{ item.name || item.nickName }}
          </li>
        </ul>
      </section>
      <div class="btns">
        <span @click.stop="$emit('close')">{{ $t("取消") }}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { Cache } from "@/cache";

// 事件
import eventCommon from "@/event/common";
import eventChat from "@/event/chat";

export default {
  props: ["chatContent"],
  data() {
    return {
      searchText: "",
      scrollShowIndex: 0,
      chats: [],
      groups: [],
      friendList: [],
    };
  },
  computed: {
    list() {
      const friendIdMap = {};
      const groupIdMap = {};

      this.chats.forEach(({ type, id }) => {
        if (type === "friend") {
          friendIdMap[id] = true;
        } else if (type === "group") {
          groupIdMap[id] = true;
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

      return this.searchText !== ""
        ? [...this.chats, ...friendList, ...groups].filter(
            ({ name, nickName }) =>
              name?.includes(this.searchText) ||
              nickName?.includes(this.searchText)
          )
        : [...this.chats, ...friendList, ...groups];
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

    > section {
      position: relative;
      height: 360px;
      overflow-y: auto;

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

          > img {
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
