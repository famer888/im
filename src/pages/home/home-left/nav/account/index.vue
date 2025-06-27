<template>
  <div class="comAccount">
    <picture @click="handleAccountDialogVisibleSet"  @contextmenu.prevent="handleRightClick">
      <ComImage v-if="icon !== ''" :src="icon" type="friend" />
    </picture>
    <vue-context ref="menu" class="menu" :lazy="true">
      <ComAccountDialog @changeIcon="handleIconChange" />
    </vue-context>
  </div>
</template>
<script>
// 事件
import eventCommon from "@/event/common";
import { ipcRenderer } from "@/platform";

export default {
  components: {
    ComAccountDialog: () => import("./account-dialog.vue"),
  },
  data() {
    return {
      icon: "",
      clickCount: 0
    };
  },
  mounted() {
    const loginInfo = eventCommon.fnCommonInfoRU({
      getId: "loginInfo",
    });

    this.icon = loginInfo.icon === "" ? null : loginInfo.icon;
  },
  methods: {
    // 监听鼠标右击五下
    handleRightClick() {
      this.clickCount++;
      if (this.clickCount === 5) {
        this.openDevTools();
        this.clickCount = 0; // 重置计数器
      }
    },
    // 打开开发者工具
    openDevTools() {
      ipcRenderer.send("open-dev-tools", {});
    },

    /**
     * 账户会话框是否显示设置
     */
    handleAccountDialogVisibleSet(e) {
      if (this.$refs.menu) {
        if (e) {
          this.$refs.menu.open(e);
        } else {
          this.$refs.menu.close();
        }
      }
    },
    /**
     * 改变头像
     */
    handleIconChange(value) {
      this.icon = value;
    },
  },
};
</script>
<style scoped lang="scss">
.comAccount {
  display: flex;
  justify-content: center;
  height: 50px;

  > picture {
    display: block;
    width: 50px;
    height: 50px;
    border: 2px solid rgb(227, 227, 227);
    box-sizing: border-box;
    border-radius: 50%;
    overflow: hidden;
    background: #fff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }

    > img {
      display: block;
      object-fit: cover;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }

  .menu {
    overflow: initial;
  }
}
</style>