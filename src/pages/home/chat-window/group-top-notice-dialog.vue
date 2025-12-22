<template>
  <div class="groupTopNoticeDialog">
    <h2 @click="handleOpenGroupNoticeDialog">
      {{ $t("群简介") }}
      <img src="@/assets/images/headNav/jt-icon.png" />
    </h2>
    <div>
      <ComGroupNoticeView
      :content="formatedNotice.notice"
      :atNameList="atNameList"
      :chatContent="chatContent"
    />
    </div>
    <span @click.stop="handleClose">{{ $t("知道了") }}</span>
  </div>
</template>
<script>
import { Cache } from "@/cache";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
// 控件
import ComGroupNoticeView from "./right-menu/group-notice/view";

export default {
  props: ["groupId", "content", "memberInfos", "chatContent"],
  components: { ComGroupNoticeView },
  data() {
    return { noticeArr: [] };
  },
  computed: {
    atNameList() {
      // 设置公告数组
      if (this.content !== "") {
        return Object.values(this.memberInfos)
          .filter((item) => item.name || item.nickName)
          .map((item) => "@" + (item.name || item.nickName));
      }

      return [];
    },
    formatedNotice() {
      // 历史逻辑，改起来很麻烦，用patter替换吧
      // this.content patter为^#123#$-1234567890
      // 中间为uid，后面为notice
      const match = this.content.match(/^\^#(.+?)#\$-(.*)$/s);
      const uid = match ? match[1] : '';
      const notice = match ? match[2] : this.content;
      return {
        uid,
        notice,
      }
    }
  },
  inject: ['provideGroupNotice'],
  mounted() {
  },
  methods: {
    /**
     * 打开群公告对话框
     */
    handleOpenGroupNoticeDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openGroupNoticeDialog",
      });
      const { uid, notice } = this.formatedNotice;
      this.provideGroupNotice({ notice, editorId: Number(uid) })
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

  > h2 {
    display: flex;
    justify-items: center;
    justify-content: space-between;
    font-weight: 600;
    margin: 0;
    font-size: 14px;
    cursor: pointer;

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
