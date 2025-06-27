<template>
  <div class="friend-root">
    <p
      v-for="(item, index) in letters"
      :key="index"
      :style="{ top: `${59 * letterIndexs[index] + 26 + index * 40}px` }"
    >
      {{ item }}
    </p>
    <h2>
      {{ $t("联系人") }}
    </h2>
    <ul
      class="friend-list"
      :style="{ paddingTop: listTop, height: listHeight }"
    >
      <li
        v-for="(item, index) in listNew"
        :key="item.id"
        :class="{
          active: id === item.id,
          online: item.online,
        }"
        @click="handleClick(item)"
        :style="
          letterIndexs.includes(index + showIndex) ? { marginTop: '40px' } : {}
        "
      >
        <ComImage :src="item.pic" type="friend" class="icon" />
        <h3>{{ item.name || item.nickName }}</h3>
        <p v-if="item.online">{{ $t("在线") }}</p>
      </li>
    </ul>
    <div class="contactCount">{{ list.length }} {{ $t("位联系人") }}</div>
  </div>
</template>
<script>
import eventBase from "@/event/base";

export default {
  props: ["list", "letters", "letterIndexs", "showIndex", "id"],
  data() {
    return {
      groupVisible: true,
    };
  },
  computed: {
    listNew: function () {
      return this.list.slice(this.showIndex, this.showIndex + 80);
    },
    listTop: function () {
      const letterCount = this.letterIndexs.filter(
        (item) => item < this.showIndex
      ).length;
      return letterCount * 40 + this.showIndex * 59 + 0.1 + "px";
    },
    listHeight: function () {
      return this.list.length * 59 + this.letters.length * 40 + "px";
    },
  },
  methods: {
    handleClick(item) {
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: { ...item, comType: "detailsFriend" },
      });
    },
  },
};
</script>
