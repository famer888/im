<template>
  <div class="groupTopNoticeDialog" @click="handleOpenGroupNoticeDialog">
    <h2>
      {{ $t("群公告") }}
      <img src="@/assets/images/headNav/jt-icon.png" />
    </h2>
    <div>
      <span
        v-for="(item, index) of noticeArr"
        :key="index"
        :class="{ at: item.slice(0, 1) === '@', break: item === '\n' }"
        >{{ item }}</span
      >
    </div>
    <span @click.stop="handleClose">{{ $t("知道了") }}</span>
  </div>
</template>
<script>
import { Cache } from "@/cache";

// 工具
import { strSplitAt } from "@/utils/widget";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  props: ["groupId", "content", "memberInfos"],
  data() {
    return { noticeArr: [] };
  },
  watch: {
    content: {
        handler(newNotice, oldNotice) {
          if (newNotice !== oldNotice) {
            this.handleNotice()
          }
        },
        immediate: false,
    }
  },
  inject: ['provideGroupNotice'],
  mounted() {
    this.handleNotice()
  },
  methods: {
    handleNotice() {
      const atNameList = Object.values(this.memberInfos).map(
        (item) => item.name || item.nickName
      );

      this.noticeArr = strSplitAt(
        this.content,
        atNameList
          .filter((item) => item.name || item.nickName)
          .map((item) => "@" + (item.name || item.nickName))
      );
    },
    /**
     * 打开群公告对话框
     */
    handleOpenGroupNoticeDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openGroupNoticeDialog",
      });
      this.provideGroupNotice({notice: this.content})
      this.handleClose();
    },
    /**
     * 关闭
     */
    handleClose() {
      // 登录id
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      // 清除公告记录
      Cache(`${loginId}-groupNotice`).then((res) => {
        if (res) {
          const data = res;
          delete data[this.groupId];

          Cache(`${loginId}-groupNotice`, data);
        }
      });

      this.$emit("close");
    },
  },
};
</script>
<style scoped lang="scss">
.groupTopNoticeDialog {
  padding: 15px 15px 30px;
  box-sizing: border-box;
  position: absolute;
  width: 95%;
  top: 85px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  border-radius: 10px;
  z-index: 10;
  box-shadow: 0px 0px 10px #eee;
  cursor: pointer;

  > h2 {
    display: flex;
    justify-items: center;
    justify-content: space-between;
    font-weight: 600;
    margin: 0;
    font-size: 14px;

    > img {
      display: block;
      height: 12px;
      width: 12px;
      transform: rotate(-90deg);
      cursor: pointer;
    }
  }

  > div {
    margin-top: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    line-height: 20px;
    max-height: 190px;

    > span {
      color: #666;
      font-size: 12px;

      &.at {
        margin: 0;
        font-size: 14px;
        color: #3369fe;
        display: inline-block;
        cursor: pointer;
        font-weight: normal;

        &:hover {
          opacity: 0.8;
        }
      }

      &.break {
        display: block;
      }
    }
  }

  > span {
    color: #3369fe;
    position: absolute;
    right: 15px;
    font-size: 12px;
    bottom: 8px;
    cursor: pointer;
    user-select: none;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>