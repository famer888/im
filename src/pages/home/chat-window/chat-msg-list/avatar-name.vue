<template>
  <div class="comAvatarName">
    <ComImage
      v-if="memberInfos[String(msgInfo.sendUid)]"
      :src="
        memberInfos[String(msgInfo.sendUid)]
          ? memberInfos[String(msgInfo.sendUid)].icon
          : null
      "
      type="friend"
      @onContextmenu="(e) => $emit('rightClick', e)"
      @onClick="$emit('openMemberDialog')"
    />
    <ComImage
      v-else-if="msgInfo.user"
      :src="msgInfo.user.icon"
      type="friend"
      @onContextmenu="(e) => $emit('rightClick', e)"
      @onClick="$emit('openMemberDialog')"
    />
    <h3 v-if="msgInfo.user">
      {{
        memberInfos[String(msgInfo.user.uid)]
          ? memberInfos[String(msgInfo.user.uid)].name ||
            memberInfos[String(msgInfo.user.uid)].nickName ||
            msgInfo.user.nickName
          : msgInfo.user.name || msgInfo.user.nickName
      }}
    </h3>
    <h3 v-else-if="memberInfos[String(msgInfo.sendUid)]">
      {{
        memberInfos[String(msgInfo.sendUid)].name ||
        memberInfos[String(msgInfo.sendUid)].nickName
      }}
    </h3>
  </div>
</template>
<script>
import ComLoading from "@/components/com-loading";

export default {
  components: { ComLoading },
  props: ["memberInfos", "msgInfo"],
};
</script>
<style scoped lang="scss">
.comAvatarName {
  position: absolute;
  left: 0;
  top: 0;
  padding-left: 6px;
  padding-top: 5px;

  > img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  > h3 {
    margin: 0;
    color: #666;
    font-size: 12px;
    line-height: 22px;
    position: absolute;
    top: 0;
    left: 45px;
    z-index: 1;
    white-space: nowrap;
  }
}
</style>
