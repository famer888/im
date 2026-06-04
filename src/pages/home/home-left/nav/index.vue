<template>
  <div class="comNav">
    <ComAccount />
    <ul>
      <li
        v-for="(item, index) in navList"
        :key="index"
        @click="onChange(index)"
      >
        <img
          class="icon"
          :src="
            require(`@/assets/images/headNav/message/${item}${
              navType == index ? '-active' : ''
            }-icon.png`)
          "
        />
        <span v-if="index === 0 && unreadCount > 0" class="unread">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
        <span v-else-if="index === 1 && contactsUnreadCount > 0" class="unread">
          {{ contactsUnreadCount > 99 ? '99+' : contactsUnreadCount }}
        </span>
      </li>
    </ul>
    <ComSettingBtn />
  </div>
</template>
<script>
// 控件
import ComAccount from "./account/index.vue";
import ComSettingBtn from "./setting-btn.vue";

// 事件
import eventBase from "@/event/base";

export default {
  props: ["navType", "unreadCount", "contactsUnreadCount"],
  data() {
    return {
      navList: ["message", "contacts", "cszs"],
    };
  },
  components: {
    ComAccount,
    ComSettingBtn,
  },
  methods: {
    onChange(val) {
      if (this.navType === val) {
        return;
      }

      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data:
          val === 2
            ? {
                id: 9701,
                type: "friend",
                comType: "chat",
              }
            : null,
      });
      this.$emit("change", val);
    },
  },
};
</script>
<style lang="scss" scoped>
.comNav {
  position: relative;
  display: flex;
  align-items: center;
  padding: 56px 0 0;
  width: 72px;
  background-color: rgb(239, 240, 242);
  text-align: center;
  flex-direction: column;

  > ul {
    margin-top: 40px;
    padding: 0 18px;

    > li {
      display: flex;
      justify-content: center;
      margin-bottom: 35px;
      position: relative;

      &:last-child {
        > img {
          border-radius: 50%;
        }
      }

      > img {
        display: block;
        width: 35px;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }
      }

      > span {
        position: absolute;
        left: 16px;
        top: -10px;
        margin-top: 4px;
        padding: 1px 7px;
        display: inline-block;
        font-size: 12px;
        background: #f44e5a;
        font-weight: 400;
        border-radius: 10px;
        transform: scale(0.86);
        color: #fff;
        text-align: center;
        white-space: nowrap;
        z-index: 2;
      }
    }
  }
}
</style>
