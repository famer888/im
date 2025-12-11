<template>
  <div class="listSearchs" ref="searchList">
    <template v-if="list.length > 0">
      <h2
        v-for="(item, index) in titles"
        :key="index"
        :style="{ top: item.top }"
      >
        {{ item.name }}
      </h2>
      <ul
        class="search-box"
        :style="{
          paddingTop: this.searchScrollShowIndex * 59 + 27 + 'px',
          paddingBottom: '20px',
          height: listHeight,
        }"
      >
        <li
          v-for="(item, index) in listNew"
          :key="item.customMsgId ? item.customMsgId + index : item.id + item.type + index"
          :style="
            topIndexs.includes(index + searchScrollShowIndex) && index !== 0
              ? { marginTop: '27px' }
              : {}
          "
          :class="{ active: item.id + item.type === idActive }"
          @click="linkTo(item)"
        >
          <TextAvatar
            v-if="item.type === 'channel' && !item.pic && !item.isMessage"
            class="img-head"
            :value="item.name || item.channelName"
            :id="item.id"
            :color="item.logoColor"
          />
          <ComImage
            v-else
            class="img-head"
            :src="item.pic"
            :type="item.type"
          />
          <h3
            v-html="
              getWordKeyHtml(item.name?.replaceAll('🪵', '?') || item.nickName)
            "
          ></h3>
          <div v-if="item.content" v-html="getWordKeyHtml(item.content)"></div>
          <span v-if="item.sendTime && item.isMessage">
            {{ dayjs(+item.sendTime).format("HH:mm") }}
          </span>
          <div v-if="item.type === 'friend' && item.identify === searchText">
            {{ $t("通讯号") }}：<span>{{ item.identify }}</span>
          </div>
        </li>
      <div style="height: 100px;"></div>
      </ul>
    </template>
    <p v-else>
      <img src="@/assets/images/common/empty-icon.png" alt="" />
      <span>{{ $t("暂无数据") }}</span>
    </p>
  </div>
</template>
<script>
import dayjs from "dayjs";

// 组件
import TextAvatar from "@/components/text-avatar";

// 事件
import eventCommon from "@/event/common";
import eventBase from "@/event/base";

let timer = null;

export default {
  components: {
    TextAvatar,
  },
  props: ["searchText", "groups", "channels", "friendList", "noSearchMsg"],
  data() {
    return {
      idActive: "",
      list: [],
      titles: [],
      topIndexs: [],
      searchMessage: [],
      searchScrollShowIndex: 0,
      groupIdList: [],
      friendIdList: [],
      channelIdList: [],
    };
  },
  computed: {
    listNew() {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      const list = this.list.slice(
        this.searchScrollShowIndex,
        this.searchScrollShowIndex + 80
      );

      return list.map((item) => {
        if (!item.name) {
          let info = {};
          if (item.type === "group") {
            info = this.groups.find(({ id }) => id === item.groupId) || {};
          } else if (item.type === "channel") {
            info = this.channels ? this.channels.find(({ channelId }) => channelId === item.id) || {} : {};
            if (info.channelName) {
              info.name = info.channelName;
              info.pic = info.icon;
              info.logoColor = info.logoColor;
            }
          } else {
            info =
              this.friendList.find(
                ({ id }) =>
                  id === (loginId === item.UserID ? item.ToUserID : item.UserID)
              ) || {};
          }
          return {
            ...item,
            name: item.name || info.name,
            nickName: item.nickName || info.nickName,
            pic: item.pic || info.pic,
            logoColor: item.logoColor || info.logoColor,
          };
        }
        return item;
      });
    },
    listHeight() {
      // return this.titles.length * 27 + this.list.length * 59 + "px";
      return window.innerHeight - 81 - 21 + "px";
    },
    listTop() {
      const letterCount = this.titles.filter(
        (item) => item < this.searchScrollShowIndex
      ).length;
      return letterCount * 40 + this.searchScrollShowIndex * 59 + 0.1 + "px";
    },
  },
  mounted() {
    this.$refs["searchList"].addEventListener(
      "scroll",
      this.handleSearchListScrollChange
    );

    this.groupIdList = this.groups.map((item) => item.id);
    this.friendIdList = this.friendList.map((item) => item.id);
    this.channelIdList = this.channels ? this.channels.map((item) => item.channelId) : [];

    this.handleSearchFriendAndGroup();
    this.handleSearchMessage();
  },
  unmounted() {
    this.$refs["searchList"].removeEventListener(
      "scroll",
      this.handleSearchListScrollChange
    );
  },
  watch: {
    searchText: {
      handler() {
        this.$refs["searchList"].scrollTop = 0;
        this.handleSearchFriendAndGroup();
        this.handleSearchMessage();
      },
    },
  },
  methods: {
    dayjs,
    /**
     * 搜索好友和群
     */
    handleSearchFriendAndGroup() {
      const titles = [];
      const topIndexs = [];

      // 好友列表
      const friendList = this.friendList
        .filter(({ name, nickName, identify }) => {
          if (identify && identify === this.searchText) {
            return true;
          }

          if (
            name &&
            name.toUpperCase().includes(this.searchText.toUpperCase())
          ) {
            return true;
          }

          if (
            nickName &&
            nickName.toUpperCase().includes(this.searchText.toUpperCase())
          ) {
            return true;
          }
          return false;
        })
        .map((item) => ({ ...item, type: "friend" }));

      if (friendList.length > 0) {
        titles.push({
          top: 0,
          name: this.$t("联系人"),
        });
        topIndexs.push(0);
      }

      // 群列表
      const groups = this.groups
        .filter((item) => {
          if (item.name) {
            return (
              item.name.toUpperCase().includes(this.searchText.toUpperCase()) &&
              item.bfAddress
            );
          }
          return false;
        })
        .map((item) => {
          return { ...item, type: "group" };
        });

      if (groups.length > 0) {
        titles.push({
          top: titles.length * 27 + friendList.length * 59 + "px",
          name: this.$t("群组"),
        });
        topIndexs.push(friendList.length);
      }

      // 频道列表
      const channels = this.channels
        ? this.channels
            .filter((item) => {
              if (item.channelName) {
                return item.channelName
                  .toUpperCase()
                  .includes(this.searchText.toUpperCase());
              }
              return false;
            })
            .map((item) => {
              return {
                ...item,
                id: item.channelId,
                name: item.channelName,
                pic: item.icon,
                type: "channel",
              };
            })
        : [];

      if (channels.length > 0) {
        const count = friendList.length + groups.length;
        titles.push({
          top: titles.length * 27 + count * 59 + "px",
          name: this.$t("频道"),
        });
        topIndexs.push(count);
      }

      // 消息
      if (this.searchMessage.length > 0) {
        const count = friendList.length + groups.length + channels.length;
        titles.push({
          top: titles.length * 27 + count * 59 + "px",
          name: this.$t("消息"),
        });
        topIndexs.push(count);
      }

      this.list = [...friendList, ...groups, ...channels, ...this.searchMessage];
      this.titles = titles;
      this.topIndexs = topIndexs;
    },
    /**
     * 搜索消息
     */
    handleSearchMessage() {
      if(this.noSearchMsg) return;
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        if (this.searchText !== "") {
          window.$db.getListSearch(this.searchText).then((res) => {
            let arr = [];
            if (res) {
              // 登录id
              const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
              });

              for (const item of res) {
                if (item.list.length > 0) {
                  let name = "";

                  if (item.type === "group") {
                    const groupInfo = this.groups.find((n) => n.id === item.id);

                    // console.log("///////");
                    // console.log(item.id);
                    // console.log(this.groups);

                    if (groupInfo) {
                      name = groupInfo.name;
                    }
                  } else if (item.type === "channel") {
                    const channelInfo = this.channels ? this.channels.find(
                      (n) => n.channelId === item.id
                    ) : null;

                    if (channelInfo) {
                      name = channelInfo.channelName;
                    }
                  } else {
                    const friendInfo = this.friendList.find(
                      (n) => n.id === item.id
                    );

                    if (friendInfo) {
                      name = friendInfo.name || friendInfo.nickName;
                    }
                  }

                  arr = [
                    ...arr,
                    ...item.list
                      .filter((n) => {
                        if (item.type === "group") {
                          if (!this.groupIdList.includes(item.id)) {
                            return false;
                          }
                        } else if (item.type === "channel") {
                          if (!this.channelIdList.includes(item.id)) {
                            return false;
                          }
                        } else {
                          const id =
                            loginId === n.UserID ? n.ToUserID : n.UserID;
                          if (!this.friendIdList.includes(id)) {
                            return false;
                          }
                        }
                        return true;
                      })
                      .map((n) => {
                        return {
                          id: item.id,
                          type: item.type,
                          name,
                          customMsgId: n.customMsgId,
                          MsgID: n.MsgID,
                          content: n.content,
                          sendTime: n.sendTime,
                          isMessage: true,
                        };
                      }),
                  ];
                }
              }
            }
            this.searchMessage = arr;
            this.handleSearchFriendAndGroup();
          });
        } else {
          this.searchMessage = [];
          this.handleSearchFriendAndGroup();
        }
      }, 400);
    },
    getWordKeyHtml(content) {
      if (!content) return "";
      return content.replace(
        this.searchText,
        `<span>${this.searchText}</span>`
      );
    },
    /**
     * 移动至搜索的位置
     */
    linkTo(value) {
      let data = { ...value, searchMsgInfo: null };

      // 如果点的是消息
      if (value.isMessage) {
        if (data.type === "group") {
          const info = this.groups.find((item) => item.id === data.id);

          if (info) {
            data.name = info.name;
          }
        } else if (data.type === "channel") {
          const info = this.channels ? this.channels.find((item) => item.channelId === data.id) : null;

          if (info) {
            data.name = info.channelName;
            data.pic = info.icon;
          }
        } else {
          const info = this.friendList.find((item) => item.id === data.id);

          if (info) {
            data.name = info.name;
            data.nickName = info.nickName;
          }
        }

        data.searchMsgInfo = {
          id: data.id,
          customMsgId: value.customMsgId,
          sendTime: value.sendTime,
        };
      }

      eventBase.fnCommunicationSendMsg({
        operator: "chatMsgListSearchScrollTo",
        data: { ...data, comType: "chat" },
      });

      if (value.isMessage) {
        this.idActive = value.id + value.type;
      } else {
        this.$emit("clearSearch");
      }
    },
    /**
     * 懒渲染
     */
    handleSearchListScrollChange() {
      if (this.searchText === "") {
        return;
      }

      let scrollTop = this.$refs["searchList"].scrollTop;
      let beforeNum = Math.floor(scrollTop / 59);
      if (this.list.length > 80) {
        let index = beforeNum - 40;
        index = index < 0 ? 0 : index;
        index = index > this.list.length ? this.list.length : index;

        if (index !== this.searchScrollShowIndex) {
          this.searchScrollShowIndex = index;
        }
      }
    },
  },
};
</script>
<style lang="scss" >
.listSearchs {
  position: relative;
  overflow-y: auto;
  height: 100%;

  > h2 {
    position: absolute;
    left: 0;
    right: 0;
    font-size: 12px;
    padding-left: 15px;
    line-height: 20px;
    color: #999;
    border-bottom: 1px solid #eee;

    > img {
      display: none;
    }
  }

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

      &:hover {
        background: #f9f9f9;
      }

      &.active {
        background: #efefef;
      }

      > h3 {
        margin: 0;
        width: 120px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 14px;
        color: #333;
        font-weight: normal;
        line-height: 18px;

        > span {
          color: #3369fe;
          font-size: 14px;
        }
      }

      > img, label {
        position: absolute;
        left: 16px;
        top: 50%;
        width: 35px;
        height: 35px;
        transform: translateY(-50%);
        border-radius: 50%;
        object-fit: cover;
      }

      > div {
        font-size: 12px;
        color: #999;
        height: 20px;
        line-height: 20px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 144px;
        top: 1px;

        img {
          vertical-align: top;
        }

        > span {
          color: #3369fe;
          font-size: 12px;
        }
      }
      > span {
        position: absolute;
        right: 10px;
        top: 14px;
        font-size: 11px;
        color: #999;
      }
    }
  }

  > p {
    padding-top: 120px;
    font-size: 12px;
    color: #999;

    > img {
      display: block;
      width: 30%;
      margin: 0 auto 0;
    }

    > span {
      display: block;
      text-align: center;
    }
  }
}
</style>
