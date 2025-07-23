<template>
  <div class="listAddressBook" ref="list">
    <Groups
      v-if="groupList.length > 0"
      :list="groupList"
      :showIndex="groupsScrollShowIndex"
      :id="
        infoActive && infoActive.comType === 'detailsGroup'
          ? infoActive.id
          : null
      "
      @onChange="handleGroupsShowChange"
    />
    <!-- <Channels /> -->
    <Friends
      v-if="friendList.length > 0"
      :list="friendList"
      :letters="letters"
      :letterIndexs="letterIndexs"
      :showIndex="friendsScrollShowIndex"
      :id="
        infoActive && infoActive.comType === 'detailsFriend'
          ? infoActive.id
          : null
      "
    />
  </div>
</template>
<script>
import Groups from "./groups";
import Friends from "./friends";
// import Channels from "./channels";

export default {
  data() {
    return {
      groupList: [],
      isGroupListShow: true,
      groupsScrollShowIndex: 0,
      friendsScrollShowIndex: 0,
    };
  },
  props: ["friendList", "letters", "letterIndexs", "groups", "infoActive"],
  components: {
    Groups,
    Friends,
    // Channels,
  },
  methods: {
    /**
     * 懒渲染
     */
    handleListScrollChange() {
      let scrollTop = this.$refs["list"].scrollTop;
      if (this.groupList.length > 0) {
        scrollTop -= 26;
        scrollTop = scrollTop < 0 ? 0 : scrollTop;
      }
      let beforeNum = Math.floor(scrollTop / 59);

      // Groups
      if (this.groupList.length > 80 && this.isGroupListShow) {
        let index = beforeNum - 40;
        index = index < 0 ? 0 : index;
        index = index > this.groupList.length ? this.groupList.length : index;

        if (index !== this.groupsScrollShowIndex) {
          this.groupsScrollShowIndex = index;
        }
      }

      // friendList
      if (this.friendList.length > 80) {
        scrollTop -= 66;
        scrollTop = scrollTop < 0 ? 0 : scrollTop;
        beforeNum = Math.floor(scrollTop / 59);

        if (this.isGroupListShow) {
          beforeNum -= this.groupList.length;
        }

        const max = this.friendList.length - 80;
        let index = beforeNum - 40;
        index = index < 0 ? 0 : index;
        index = index > max ? max : index;

        if (index !== this.friendsScrollShowIndex) {
          this.friendsScrollShowIndex = index;
        }
      }
    },
    /**
     * 群是否显示改变
     * @param {*} value
     */
    handleGroupsShowChange(value) {
      this.isGroupListShow = value;
    },
  },
  mounted() {
    // 懒渲染
    this.$refs["list"].addEventListener("scroll", this.handleListScrollChange);

    // 置顶
    this.$refs["list"].scrollTop = 0;
    
    // 群
    this.groupList = this.groups.filter((item) => {
      return item.bfAddress;
    });
  },
  beforeDestroy() {
    this.$refs["list"].removeEventListener(
      "scroll",
      this.handleListScrollChange
    );
  },
};
</script>
<style lang="scss">
.listAddressBook {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;

  > div, >div div {
    position: relative;
    overflow: hidden;

    > h2 {
      height: 26px;
      line-height: 26px;
      font-size: 14px;
      color: #333;
      position: relative;
      margin: 0;
      padding-left: 20px;
      font-weight: normal;
      cursor: pointer;

      > img {
        position: absolute;
        width: 12px;
        top: 3px;
        right: 16px;
        transition: 0.3s all;
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
      border-top: 1px #eee solid;
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
      border-top: 1px #eee solid;
      margin-bottom: 50px;
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

        &.mute {
          > i {
            background: #ccc;
          }
          > picture {
            display: block;
          }
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

        > div {
          font-size: 12px;
          color: #999;
          line-height: 20px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          width: 140px;
          display: inline-block;
          position: relative;
          top: 1px;

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

        > span {
          position: absolute;
          right: 10px;
          top: 14px;
          font-size: 11px;
          color: #999;
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
        }
      }
    }
  }
}
</style>