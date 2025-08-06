<template>
  <div class="comGroupDialog">
    <div>
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <ComImage :src="groupInfo.pic" type="group" />
      <span>{{ groupInfo.name }}</span>
      <p>{{ memberCountRemark }}</p>
      <button v-if="groupInfo.addToken" @click="handleJoinGroup">
        {{ $t("加入群聊") }}
      </button>
    </div>
  </div>
</template>
<script>
import { groupJoin } from "@/api/imGroup";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  props: ["groupInfo", "groupAddToken", "chatContent"],
  data() {
    return {
      memberCountRemark: "",
    };
  },
  mounted() {
    // 共xx人
    this.memberCountRemark = this.$t("共#1#人").replace(
      "#1#",
      Number(this.groupInfo.memberCount)
    );
  },
  methods: {
    /**
     * 申请入群
     */
    handleJoinGroup() {
      groupJoin({
        groupId: Number(this.groupInfo.id),
        reqType: 15,
        addToken: this.groupInfo.addToken,
        msg: "申请入群",
      }).then((res) => {
        const { errMsg, errCode } = res?.commonResult || {};
        if (errCode != 200) {
          window.$toast(errMsg || res?.errorDesc || this.$t("加入群聊失败"));
        } else {
          if (this.groupInfo.bfJoinCheck) {
            // 入群需要验证
            window.$toast(this.$t("已提交申请入群"));
          }
          // 关闭
          this.handleClose();
        }
      });
    },
    /**
     * 关闭
     */
    handleClose() {
      // 添加 引用对话框
      eventCommon.fnCloseListRU({
        removeIds: ["groupDialog"],
      });
    },
  },
};
</script>

<style scoped lang="scss">
.comGroupDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  > div {
    width: 400px;
    min-height: 236px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding-top: 26px;
    position: relative;

    > picture {
      position: absolute;
      right: 0;
      top: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }

      > img {
        display: block;
      }
    }

    > img {
      width: 62px;
      height: 62px;
      border-radius: 99px;
    }

    > span {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-top: 10px;
    }

    > p {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
    }

    > button {
      width: 206px;
      height: 32px;
      background: #3369fe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      border-radius: 4px;
      margin-top: 32px;
      border: 0;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>