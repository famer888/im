<template>
  <span
    v-if="
      info.type === 'text' && info.content !== '@' && info.content[0] === '@'
    "
    class="at"
    @click="handleAtClick"
    >{{ info.content }}</span
  >
  <span v-else-if="info.type === 'text'">{{
    isNotification ? info.content : filterSensitiveWords(info.content)
  }}</span>
  <img
    v-else-if="info.type === 'image' && safeSrc(info.src)"
    :data-key="info.key"
    :src="safeSrc(info.src)"
  />
  <a
    v-else-if="info.type === 'link'"
    href="#"
    @click.prevent.stop="handleGoLink(info)"
    >{{ info.content }}</a
  >
  <a
    v-else-if="info.type === 'customLink'"
    href="#"
    @click.prevent.stop="handleGoLink(info, true)"
    v-html="sanitizeCustomLinkHtml(info.content)"
    ></a>
  <br v-else />
</template>
<script>
import { filterSensitiveWords } from "@/utils/tools";
import { isChannelLink } from "@/api/imChannel.js";
import { completionUrl } from "@/utils/base";
import { sanitizeCustomLinkHtml, safeSrc } from "@/utils/sanitizeHtml";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import InviteLink from "@/utils/InviteLink";

import { Cache } from "@/cache";

export default {
  name: "lebleEle",
  props: ["info", "isNotification", "currentChatId"],
  methods: {
    sanitizeCustomLinkHtml,
    safeSrc,
    filterSensitiveWords,
    /**
     * 跳转频道聊天窗
     */
    goChannelChatWindow(info) {
      const data = {
        ...info,
        id: info.channelId,
        name: info.channelName,
        type: 'channel',
        showTip: true,
        comType: 'detailsChannel',
      }

      eventBase.fnCommunicationSendMsg({
        operator: 'activeChange',
        data,
      })
    },
    goChannelLink(linkRes) {
      const channelInfo = linkRes?.data;
        if(!channelInfo) {
              window.$toast(linkRes?.msg || "此频道已失效或过期");
        } else if(!channelInfo.linkType || channelInfo.memberType) {
           // 公开的频道链接或者已加入频道直接跳转窗口
          this.goChannelChatWindow(channelInfo)
        } else if(channelInfo) {
           // 私密频道打开加入窗口
            eventBase.fnCommunicationSendMsg({
              operator: "openChannelDialog",
              data: {
                values: channelInfo,
              },
            });
        }
    },
    handleAtClick(e) {
      e.stopPropagation();
      // 第二个参数透传整个 info（含 uid / possibleUid），旧消费者仅取第一个参数仍兼容
      this.$emit("atClick", this.info.content, this.info);
    },
    async validChannelLink(link) {
      try {
        if (!link) return null;
        const res = await isChannelLink({ link });
        return res;
      } catch (error) {
        return null;
      }
    },
    async handleGoLink(info, showConfirm) {
      // 判断静默禁用
      const infoActive = eventCommon.fnCommonInfoRU({ getId: "infoActive" });
      const globalConfig = eventCommon.fnGlobalConfigGet();
      let isSilentDisabled = false;

      // 检查静默禁用状态
      if (this.currentChatId) {
        if (infoActive && String(infoActive.id) === String(this.currentChatId)) {
          // 当前窗口匹配
          if (infoActive.type === 'group') {
             if (globalConfig.group?.disableUnperceived && infoActive.isDisable) {
               isSilentDisabled = true;
             }
          } else if (infoActive.type === 'channel') {
             if (globalConfig.channel?.disableUnperceived && infoActive.isDisable) {
               isSilentDisabled = true;
             }
          }
        } else {
          // 当前窗口不匹配（可能是后台更新了 infoActive，或者在非激活窗口操作）
          // 需要从缓存查状态
           const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
           
           // 尝试判断类型（infoActive 不匹配时，无法直接得知 currentChatId 是 group 还是 channel，
           // 但可以通过尝试查找缓存来确定）
           // 优先假设是 group
           let groupList = await Cache(`${loginId}-GroupList`) || [];
           let groupInfo = groupList.find(i => String(i.id) === String(this.currentChatId));
           
           if (groupInfo) {
              if (globalConfig.group?.disableUnperceived && groupInfo.isDisable) {
                isSilentDisabled = true;
              }
           } else {
             // 尝试 channel
             let channelList = await Cache(`${loginId}-ChannelList`) || [];
             let channelInfo = channelList.find(i => String(i.channelId) === String(this.currentChatId));
             if (channelInfo) {
                if (globalConfig.channel?.disableUnperceived && channelInfo.isDisable) {
                  isSilentDisabled = true;
                }
             }
           }
        }
      }

      if (isSilentDisabled) {
        window.$toast(this.$t("请联系客服 #00001"));
        return;
      }

      const linkUrl = (info?.href || "").replace("<br>", "")
      if(showConfirm) {
         const confirmState = await window.$confirm({
          title: this.$t("打开链接"),
          btnTitleCenter: this.$t("打开"),
          remark: linkUrl
        })
       if(!confirmState) return;
      }
      return new InviteLink({ link: completionUrl(linkUrl) }).redirect();

      try {
        let href = completionUrl(linkUrl)
        const hrefData = new URL(href);
        const searchParams = hrefData.searchParams;
        // 判断 如果点的是群链接，则进入入群操作等相关逻辑，未入群则申请入群，已入群，则跳转过去
        if (
          hrefData.origin == "https://97chat.com" &&
          searchParams.has("qrCode") &&
          searchParams.has("IdCode")
        ) {
          // console.log(
          //   hrefData,
          //   searchParams.get("qrCode"),
          //   searchParams.get("IdCode"),
          //   "点击群链接"
          // );
          return;
          // 现在调用此接口暂时报404，暂且先注释，此功能暂时也不是群增量功能
          // queryGroupLink({qrCode: searchParams.get('qrCode'), IdCode: searchParams.get('IdCode')}).then(res => {
          //   console.log(res, '查看群信息')
          // })
        }
        let linkRes = await this.validChannelLink(linkUrl);
        console.log('validChannelLink--',linkRes )
        if (linkRes?.code === 200) {
          this.goChannelLink(linkRes)
        } else {
          // 其它链接直接打开
          window.open(hrefData.href);
        }
      } catch (error) {
        console.log(error);
        window.open(linkUrl);
      }
    },
  },
};
</script>

