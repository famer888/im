<template>
  <div class="groupNotice" @click.stop="handleOpenGroupNoticeDialog">
    <div class="head">
      <h3>{{ $t("频道简介") }}</h3>
      <img class="arrow" src="@/assets/images/common/right-arrow-a.png" />
    </div>
    <ComChannelNoticeView :content="remark" :atNameList="atNameList" :key="remark" :chatContent="chatContent" />
  </div>
</template>
<script>
import ComChannelNoticeView from "./view.vue";

// 事件
import eventBase from "@/event/base";

export default {
  components: { ComChannelNoticeView },
  props: ["remark", "memberInfoList", "chatContent"],
  computed: {
    atNameList() {
      try {
        // 设置简介数组
        if (this.remark !== "") {
          return this.memberInfoList
            .filter((item) => item.userInfoDTO.name || item.userInfoDTO.nickName)
            .map((item) => "@" + (item.userInfoDTO.name || item.userInfoDTO.nickName));
        }
        return [];
      } catch (err) {
        return []
      }
    },
  },
  methods: {
    /**
     * 打开简介对话框
     */
    handleOpenGroupNoticeDialog() {
      eventBase.fnCommunicationSendMsg({
        operator: "openChannelNoticeDialog",
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

    >h3 {
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
