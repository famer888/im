<template>
  <div class="groupNotice" @click.stop="handleOpenGroupNoticeDialog">
    <h3>{{ $t("群公告") }}</h3>
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
     * 打开群公告对话框
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

  > h3 {
    line-height: 40px;
    margin: 0;
    font-size: 16px;
  }
}
</style>