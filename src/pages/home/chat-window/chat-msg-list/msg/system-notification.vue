<template>
  <div
    class="comSystemNotification"
    @click.right="(e) => $emit('rightClick', e)"
  >
    <span>
      <template v-if="msgInfo.content.slice(0, 3) === '!@#'">
        <strong :class="{'highlight': groupOwner.nickName === msgInfo.content.slice(3, msgInfo.content.lastIndexOf('!@#'))}">
          {{ msgInfo.content.slice(3, msgInfo.content.lastIndexOf("!@#")) }}
        </strong>
        {{ msgInfo.content.slice(msgInfo.content.lastIndexOf("!@#") + 3) }}
      </template>
      <template v-else>
        {{ msgInfo.content }}
      </template>
    </span>
  </div>
</template>
<script>
export default {
  props: ["msgInfo", "groupOwner"],
};
</script>
<style lang="scss">
.comSystemNotification {
  text-align: center;
  padding: 10px 30px !important;
  position: relative;

  > span {
    font-size: 12px;
    color: #666;

    > strong {
      font-size: 12px;
      font-weight: normal;
      &.highlight {
        color: #3369fe;
      }
    }
  }
}
</style>