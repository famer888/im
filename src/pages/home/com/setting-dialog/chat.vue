<template>
  <div class="comSettingDialogChat">
    <h3>{{ $t("聊天") }}</h3>
    <dl>
      <dt>{{ $t("账户退出，保留聊天记录") }}</dt>
      <dd>
        <ComSwitch
          :value="!isLoginoutClearHistory"
          @input="handleLoginoutClearHistoryChange"
        />
      </dd>
    </dl>
    <h3>{{ $t("快捷键") }}</h3>
    <dl>
      <dt>{{ $t("发送") }}</dt>
      <dd>
        <div class="select">
          <span>
            {{ sendShortcutKeyList[sendShortcutKeyIndex] }}
          </span>
          <img src="@/assets/images/setting/choice-icon.png" />
          <ul>
            <li
              v-for="(item, index) in sendShortcutKeyList"
              :key="index"
              @click="handleSendShortcutKeySet(index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </dd>
    </dl>
    <dl>
      <dt>{{ $t("截屏") }}</dt>
      <dd>
        <div class="bg">
          <span>ctrl + shift + a</span>
        </div>
      </dd>
    </dl>
    <dl>
      <dt></dt>
      <dd>
        <button @click="handleClear">{{ $t("清空全部聊天记录") }}</button>
      </dd>
    </dl>
  </div>
</template>
<script>
import ComSwitch from "../switch.vue";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

export default {
  components: { ComSwitch },
  data() {
    return {
      isLoginoutClearHistory: false, // 是否登出清空历史记录
      sendShortcutKeyList: ["Enter", "Ctrl+Enter"], // 发送快捷键列表
      sendShortcutKeyIndex: 0, // 发送快捷键列表索引
    };
  },
  mounted() {
    // 获取系统设置
    const { accountConfig } = eventCommon.fnConfigRU();

    // 初始化
    this.isLoginoutClearHistory = accountConfig.isLoginoutClearHistory;
    this.sendShortcutKeyIndex = this.sendShortcutKeyList.indexOf(
      accountConfig.sendShortcutKey
    );
  },
  methods: {
    /**
     * 登出清空历史记录 改变
     */
    handleLoginoutClearHistoryChange() {
      this.isLoginoutClearHistory = !this.isLoginoutClearHistory;

      eventCommon.fnConfigRU({
        isAccount: true,
        infoMerge: {
          isLoginoutClearHistory: this.isLoginoutClearHistory,
        },
      });
    },
    /**
     * 发送快捷键设置
     */
    handleSendShortcutKeySet(index) {
      this.sendShortcutKeyIndex = index;

      const sendShortcutKey = this.sendShortcutKeyList[index];

      // 记录到本地
      eventCommon.fnConfigRU({
        isAccount: true,
        infoMerge: {
          sendShortcutKey,
        },
      });

      // 通讯
      eventBase.fnCommunicationSendMsg({
        operator: "sendShortcutKey",
        data: {
          sendShortcutKey,
        },
      });
    },
    /**
     * 清空
     */
    handleClear() {
      window
        .$confirm({
          remark: this.$t(
            "删除聊天后，将同时删除记录。包括聊天中的文件、图片、视频等内容"
          ),
        })
        .then((res) => {
          if (res) {
            eventBase.fnCommunicationSendMsg({
              operator: "clearAll",
              data: {},
            });
          }
        });
    },
  },
};
</script>
