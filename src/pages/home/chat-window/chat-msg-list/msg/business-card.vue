<template>
  <div
    :class="{ comBusinessCard: true, self: msgInfo.isSelf }"
    @click.right="(e) => $emit('rightClick', e)"
    @click="handleClick"
  >
    <slot></slot>
    <div class="content">
      <ComImage :src="msgInfo.content.pic" type="friend" />
      <h2>{{ msgInfo.content.name }}</h2>
      <span>{{ $t("名片") }}</span>
    </div>
  </div>
</template>
<script>
// 事件
import eventBase from "@/event/base";

export default {
  props: ["msgInfo"],
  methods: {
    /**
     * 点击
     */
    handleClick() {
      const { id, name, pic } = this.msgInfo.content;

      eventBase.fnCommunicationSendMsg({
        operator: "memberDialogShow",
        data: {
          values: {
            id,
            icon: pic,
            nickName: name,
          },
        },
      });
    },
  },
};
</script>
<style scoped lang="scss">
.comBusinessCard {
  max-width: 450px;
  border-radius: 10px;
  border-top-left-radius: 0;
  padding: 10px 10px 10px 12px;
  word-wrap: break-word;
  background: rgb(243, 243, 243);
  border: 1px solid #eeeff3;
  position: relative;
  min-width: 300px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &.self {
    background: #98daff;
    border: 1px solid #87cdf6;
    border-top-left-radius: 10px;
    border-top-right-radius: 0;
  }

  > .content {
    min-height: 60px;

    > img {
      border-radius: 50%;
      position: absolute;
      left: 15px;
      top: 50%;
      width: 42px;
      height: 42px;
      object-fit: cover;
      transform: translateY(-50%);
    }

    > h2 {
      margin: 0;
      padding: 0;
      font-size: 16px;
      font-weight: 500;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 150px;
      margin-left: 55px;
      line-height: 22px;
      max-height: 66px;
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
    }

    > span {
      font-size: 12px;
      right: 14px;
      height: 23px;
      line-height: 23px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      background-color: #3369fe;
      border-radius: 23px;
      padding: 0 10px;
    }
  }
}
</style>