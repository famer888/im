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
  <img v-else-if="info.type === 'image'" :data-key="info.key" :src="info.src" />
  <a
    v-else-if="info.type === 'link'"
    href="javascript:void(0)"
    @click.stop="handleGoLink(info)"
    >{{ info.content }}</a
  >
  <a
    v-else-if="info.type === 'customLink'"
    href="javascript:void(0)"
    @click.stop="handleGoLink(info, true)"
    v-html="info.content"
    ></a>
  <br v-else />
</template>
<script>
import { filterSensitiveWords } from "@/utils/tools";
import { isChannelLink } from "@/api/imChannel.js";
import { completionUrl } from "@/utils/base";

// 事件
import eventBase from "@/event/base";
import InviteLink from "@/utils/InviteLink";

export default {
  name: "lebleEle",
  props: ["info", "isNotification"],
  methods: {
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
      this.$emit("atClick", this.info.content);
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
          hrefData.origin == "https://ocs.com" &&
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

