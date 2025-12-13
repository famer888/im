<template>
  <div class="groupNotice" @click.stop="handleOpenGroupNoticeDialog">
    <div class="head">
       <h3>{{ $t("群简介") }}</h3>
       <img class="arrow" src="@/assets/images/common/right-arrow-a.png"/>
    </div>
    <ComGroupNoticeView
      :content="notice"
      :atNameList="atNameList"
      :key="notice"
      :chatContent="chatContent"
    />
  </div>
</template>
<script>
import ComGroupNoticeView from "./view.vue";

// 事件
import eventBase from "@/event/base";

export default {
  components: { ComGroupNoticeView },
  props: ["notice", "memberInfoList", "chatContent"],
  computed: {
    atNameList() {
      // 设置公告数组
      if (this.notice !== "") {
        return this.memberInfoList
          .filter((item) => item.name || item.nickName)
          .map((item) => "@" + (item.name || item.nickName));
      }

      return [];
    },
  },
  methods: {
    /**
     * 打开群简介对话框
     */
    handleOpenGroupNoticeDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openGroupNoticeDialog",
      });
    },
  },
};
</script>
<style scoped lang="scss">
.groupNotice {
  padding: 10px;
  cursor: pointer;
  max-height: 120px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > h3 {
      line-height: 40px;
      margin: 0;
      font-size: 14px;
      color: #000;
    }
    .arrow {
      height: 10px;
    }
  }



  .groupNoticeView {
    overflow: hidden;
  }
}
</style>
