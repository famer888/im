<template>
  <div class="comSettingDialogRepair">
    <h3>{{ $t("修复") }}</h3>
    <dl>
      <dt>{{ $t("消息解密失败") }}</dt>
      <dd>
        <button @click="handleRepair('decryption')">{{ $t("修复") }}</button>
      </dd>
    </dl>
    <dl v-if="isTestEnv">
      <dt>缓存目录</dt>
      <dd>
        <button @click="copyPublicCachePath()">复制</button>
      </dd>
    </dl>
    <dl>
      <dt>重置缓存数据</dt>
      <dd>
        <button @click="handleReset()">重置</button>
      </dd>
    </dl>
  </div>
</template>
<script>
import { ipcRenderer } from "@/platform";
import eventCommon from "@/event/common";
import { getPublicCacheSync } from "@/utils/publicCache";
const packName = process.env.VUE_APP_PACKNAME;
import { copyText } from "@/utils/clipboard";
import {
  fnInitAllGroupKey,
  fnInitAllFriendKey,
  fnInitAllChannelKey
} from "@/utils/e2ee";
import { Cache } from "@/cache";

export default {
  computed: {
    isTestEnv() {
      return packName === "97-new-test";
    },
  },
  methods: {
    /**
     * 重置
     */
    handleReset() {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });

      window
        .$confirm({
          remark: this.$t("确认退出，并重置缓存数据？"),
        })
        .then(async (res) => {
          if (res) {
            localStorage.clear();

            // 清除 好友列表和聊天窗口列表
            await Cache(`${loginId}-ContactList`, []);
            // await Cache(`${loginId}-GroupList`,[]);

            await Cache(`${loginId}MessageGroupList`, []);
            await Cache(`${loginId}MessageUserList`, []);

            // key清理
            await Cache(`${loginId}-friend-key-objs`, {});
            await Cache(`${loginId}-group-key-objs`, {});

            // 群事件
            await Cache(`${loginId}-groupEventExecIdObj`, {});

            const res = await Cache("login-account-list");

            await Cache(
              "login-account-list",
              res.filter((item) => item.id !== loginId)
            );

            window.location.reload();
          }
        });
    },
    copyPublicCachePath() {
      const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      const key = `cachePath-${loginId}`;
      let publicCachePath = getPublicCacheSync(key);
      if (publicCachePath) {
        copyText(publicCachePath);
        window.$toast(this.$t("复制成功"));
      }
    },
    async handleRepair(type) {
       const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
      });
      if (type === "decryption") {
        fnInitAllGroupKey(loginId);
        fnInitAllChannelKey(loginId);
        fnInitAllFriendKey(loginId);
        window.$toast(this.$t("秘钥重置成功"));
      } else {
        // window
        //   .$confirm({
        //     remark: this.$t("修复后需要重新登录，是否继续？"),
        //   })
        //   .then((res) => {
        //     if (res) {
        //       //
        //     window.$loading(true);
        //     // 登出前要先导出,传入修复参数isFix, isFix为true，
        //     // login-account-list这个json文件则设置为空数组，清空登录者信息
        //     ipcRenderer.send("auto-export-db", {isFix: true});
        //     }
        //   });
      }
    },
  },
};
</script>
