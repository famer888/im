<template>
  <div class="groups-root">
    <h2
      @click="
        groupVisible = !groupVisible;
        $emit('onChange', groupVisible);
      "
    >
      {{ $t("群组") }}
      <img
        src="@/assets/images/headNav/jt-icon.png"
        :style="groupVisible ? {} : { transform: 'rotate(180deg)' }"
      />
    </h2>
    <ul
      v-if="groupVisible || show"
      :style="{
        paddingTop: this.showIndex * 59 + 'px',
        height: listHeight,
      }"
    >
      <li
        v-for="item in listNew"
        :key="item.id"
        :class="{ active: id === item.id }"
        @click="handleClick(item)"
      >
        <ComImage :src="item.pic" type="group" class="icon" />
        <h3>{{ item.name.replaceAll("🪵", "?") }}</h3>
      </li>
    </ul>
  </div>
</template>
<script>
import eventBase from "@/event/base";

export default {
  props: ["list", "show", "showIndex", "id"],
  data() {
    return {
      groupVisible: true,
    };
  },
  computed: {
    listNew: function () {
      return this.list
        .filter((item) => item.bfAddress)
        .slice(this.showIndex, this.showIndex + 80);
    },
    listHeight: function () {
      return this.list.filter((item) => item.bfAddress).length * 59 + "px";
    },
  },
  methods: {
    handleClick(item) {
      console.log('>>>>>>>>>>>>>>>>> 56 groups', item)
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: { ...item, comType: "detailsGroup" },
      });
    },
  },
};
</script>
