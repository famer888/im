<template>
  <div class="comMsgDice" @click.right="(e) => $emit('rightClick', e)">
    <slot></slot>
    <div class="content">
      <img
        v-if="msgInfo.result"
        :src="require(`@/assets/images/message/touz_${msgInfo.result}.jpg`)"
      />
      <img v-else :src="require('@/assets/images/message/touzi.gif')" />
    </div>
  </div>
</template>
<script>
export default {
  props: ["msgInfo"],
};
</script>
<style scoped lang="scss">
.comMsgDice {
  position: relative;
  padding: 10px 75px 15px 10px;
  border-radius: 10px;
  border-top-left-radius: 0;
  // background: rgb(243, 243, 243);
  > .content {
    height: 40px;

    > img {
      display: block;
      height: 40px;
    }
  }
}
</style>