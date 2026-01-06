<template>
  <div class="comAtListDialog" ref="atList">
    <ul>
      <li
        v-for="(item, index) in atShowList"
        :key="item.id"
        :class="{
          active: index + atListShowIndex === atIndexActive,
        }"
        @click.stop="handleClick(item.name || item.nickName)"
      >
        <ComImage :src="item.icon" type="friend" />
        <h2>
          <span class="name" v-if="item.name" v-html="getWordKeyHtml(item.name)"></span>
          <span class="nickName" v-if="item.nickName" v-html="getWordKeyHtml(item.nickName)"></span>
        </h2>
        <span v-if="!item.type" class="lord">
          {{ $t("群主") }}
        </span>
        <span v-else-if="item.type === 1">
          {{ $t("管理员") }}
        </span>
      </li>
    </ul>
  </div>
</template>
<script>
// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  props: ["searchText", "isLeader", "type"],
  data() {
    return {
      memberList: [],
      atSearchList: [],
      atListShowIndex: 0,
      atIndexActive: 0,
    };
  },
  inject: ["provideMemberList", "provideChannelUserList"],
  computed: {
    /**
     * 艾特--搜索结果--分页
     */
    atShowList() {
      const currentList = this.atSearchList;
      console.log("atSearchList--", currentList)
      const list = currentList.filter(item => {
        const name = item.name + item.nickName
        return name.includes(this.searchText)
      })
      this.atIndexActive = 0;
      return list;
    },
  },
  watch: {
    searchText() {
      // at搜索列表设置
      this.handleAtSearchListSet();
    },
  },
  mounted() {
    // 监听虚拟滚动
    this.$refs["atList"].addEventListener(
      "scroll",
      this.handleAtListScrollChange
    );
    console.log('channel--',this.provideChannelUserList())

    // 成员列表
    if(this.type === "channel") {
      this.memberList = this.provideChannelUserList().map((item) => {
        const userInfo = item.userInfoDTO || {};
        return {
          id: userInfo.uid,
          name: userInfo.name || "",
          icon: userInfo.icon,
          type: item.memberType -1,
          nickName: userInfo.nickName
        };
      });
    } else {
      this.memberList = this.provideMemberList().map((item) => {
        return {
          id: item.id,
          name: item.name,
          icon: item.icon,
          type: item.type,
          nickName: item.nickName
        };
      });
    }


    // at搜索列表设置
    this.handleAtSearchListSet();

    // 添加监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring(
      "atListDialog",
      ["keydown"],
      this.eventHandling
    );
  },
  beforeDestroy() {
    // 移除监听
    this.$refs["atList"].removeEventListener(
      "scroll",
      this.handleAtListScrollChange
    );

    // 移除监听 设置通信事件的监听机制
    eventBase.fnCommunicationMonitoring("atListDialog", null);
  },
  methods: {
    /**
     * 高亮
     */
    getWordKeyHtml(content) {
      return content.replace(
        this.searchText,
        `<span class="highlight">${this.searchText}</span>`
      );
    },
    /**
     * 监听事件执行
     */
    eventHandling(info, operator) {
      if (operator === "keydown") {
        switch (info.key) {
          case "ArrowUp": {
            // 键盘上
            this.handleAtActiveChange(-1);
            break;
          }
          case "ArrowDown": {
            // 键盘下
            this.handleAtActiveChange(1);
            break;
          }
          case "Enter": {
            const {name, nickName} = this.atShowList[this.atIndexActive]
            this.$emit("addAt", name || nickName);
            break;
          }
          default:
        }
      }
    },
    /**
     * at搜索列表设置
     */
    handleAtSearchListSet() {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      let memberList = _.cloneDeep(this.memberList);

      // 如果是管理，则添加at全部成员
      if (this.isLeader) {
        memberList.unshift({
          id: -1,
          type: -1,
          name: "",
          nickName: "全体成员"
        });
      }

      // 移除自己
      memberList = memberList.filter((item) => item.id !== loginId);

      // 无搜索条件--全量显示
      if (!this.searchText) {
        this.atSearchList = memberList;
      } else {
        // 有搜索条件--过滤显示
        this.atSearchList = memberList.filter(({ name, nickName }) =>
          (name + nickName).includes(this.searchText)
        );

        // 如果过滤后没有数据，则关闭
        if (this.atSearchList.length === 0) {
          this.$emit("close");
        }
      }
    },
    /**
     * at的成员列表滚动
     */
    handleAtListScrollChange() {
      console.log("handleAtListScrollChange--")
      _.throttle(this.handleAtListLazyRender, 100);
    },
    /**
     * at的成员列表懒渲染
     */
    handleAtListLazyRender() {
      const dom = this.$refs["atList"];
      const len = this.atShowList.length;
      if (dom.scrollTop > len * 40) {
        return;
      }
      let num = Math.floor(dom.scrollTop / 40) - 5;
      if (num < 0) {
        num = 0;
      }
      this.atListShowIndex = num;
    },
    /**
     * 设置选中的at成员
     */
    handleAtActiveChange(num) {
      let index = this.atIndexActive + num;
      if (index < 0) {
        index = 0;
      }
      const count = this.atSearchList.length;
      if (index > count - 1) {
        index = count - 1;
      }

      // 改变滚动条，让选中的成员能够显示在可视范围内
      const dom = this.$refs["atList"];
      const maxTop = index * 40 + 8;
      const minTop = maxTop - 140;

      if (dom.scrollTop > maxTop) {
        dom.scrollTop = maxTop;
      } else if (dom.scrollTop < minTop) {
        dom.scrollTop = minTop;
      }

      this.atIndexActive = index;

      // at的成员列表懒渲染
      this.handleAtListLazyRender();
    },
    /**
     * 点击选中
     */
    handleClick(name) {
      eventBase.fnCommunicationSendMsg({
        operator: "sendEditorFoucs",
      });
      setTimeout(() => {
        this.$emit("addAt", name);
      }, 200);
    },
  },
};
</script>
<style scoped lang="scss">
.comAtListDialog {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  transform: translateY(-1px);
  max-height: 180px;
  overflow-y: auto;
  background: #f9f9f9;
  border-top: 1px solid #eee;
  margin: 0;
  padding: 8px 0;
  z-index: 2;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 6px rgba(173, 172, 172, 0.3);
    background: #666666;
    border-radius: 10px;
    cursor: pointer;
  }

  > ul {
    margin: 0;
    min-width: 60px !important;
    padding: 0;

    > li {
      height: 40px;
      display: flex;
      align-items: center;
      cursor: pointer;
      position: relative;
      padding-left: 55px;
      text-align: center;
      margin: 0 8px;
      content-visibility: auto;

      &:hover {
        background: #f1f1f1;
      }

      &.active {
        background: #e1eaff !important;
      }

      &:hover {
        background: #eee;
      }

      > h2 {
        display: flex;
        align-items: center;

        .name,.nickName {
          max-width: 200px;
          overflow: hidden;
          display: block;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .name {
          font-size: 14px;
          font-weight: bold;
          color: #000000;
          margin-right: 10px;
        }

        .nickName {
           color: #787878;
           font-weight: 300;
        }

        .highlight {
          color: #3369fe
        }
      }

      > p {
        font-size: 12px;
        font-weight: bold;
        color: #999;
        margin-left: 3px;

        &::before {
          content: "[";
        }
        &::after {
          content: "]";
        }
      }

      > img {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        height: 32px;
        width: 32px;
        border-radius: 50%;
      }

      > span {
        font-size: 12px;
        color: #fff;
        padding: 2px 6px;
        border-radius: 99px;
        background: #fb9203;
        flex-shrink: 0;
        position: absolute;
        right: 10px;

        &.lord {
          background: #3369fe !important;
        }
      }
    }
  }
}
</style>
