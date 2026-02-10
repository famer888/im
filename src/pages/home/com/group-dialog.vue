<template>
  <div class="comGroupDialog">
    <div>
      <picture @click="handleClose">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <ComImage :src="groupInfo.pic" type="group" />
      <span>{{ groupInfo.name }}</span>
      <p>{{ memberCountRemark }}</p>
      <!-- 群禁用状态 不展示简介 -->
       <!-- globalConfig.group.disableUnperceived && -->
      <div class="remark-container" v-if="!(groupInfo.bfBanned)">
        <div class="remark-content" ref="remarkContent" :class="{ 'expanded': isRemarkExpanded }">
          <ComLableEle v-for="(item, index) in remarkTagList" :key="index" :info="item" :currentChatId="groupInfo.id" @atClick="handleAtClick" />
        </div>
        <span class="toggle-btn" v-if="showToggleBtn" @click="toggleRemark">
          {{ isRemarkExpanded ? '折叠' : '更多' }}
        </span>
      </div>
      <button v-if="groupInfo.addToken" @click="handleJoinGroup">
        {{ $t("加入群聊") }}
      </button>
    </div>
  </div>
</template>
<script>
import { groupJoin } from "@/api/imGroup";
import { Cache } from "@/cache";

// 工具
import { repalceLink, repalceLinkNoPrefix } from "@/utils/base";
import {
  strSplitAt,
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";
import eventGroup from "@/event/group";

import ComLableEle from "@/pages/home/com/lable-ele.vue";

export default {
  props: ["groupInfo", "groupAddToken", "chatContent"],
  components: { ComLableEle },
  data() {
    return {
      memberCountRemark: "",
      isRemarkExpanded: false,
      showToggleBtn: false,
      remarkTagList: [],
      globalConfig: eventCommon.fnGlobalConfigGet(), //禁用 是否静默
    };
  },
  mounted() {
    this.processRemark();
    // 共xx人
    this.memberCountRemark = this.$t("共#1#人").replace(
      "#1#",
      Number(this.groupInfo.memberCount)
    );
    this.$nextTick(() => {
      this.checkRemarkOverflow();
    });
  },
  watch: {
    'groupInfo.remark'() {
      this.processRemark();
      this.$nextTick(() => {
        this.checkRemarkOverflow();
      });
    }
  },
  methods: {
    /**
   * 处理remark文本，支持链接和@提及
   */
    processRemark() {
      if (!this.groupInfo?.remark) {
        this.remarkTagList = [];
        return;
      }

      let htmlString = this.groupInfo.remark;

      // 字符串替换为表情图片标签
      htmlString = strReplaceEmojiImgLabel(htmlString);

      // 连接处理
      htmlString = repalceLink(htmlString);

      // 拆分html
      const tagList = splitHtmlStringToObjects(htmlString);

      // 提取所有@开头的文本作为可能的@提及列表
      const atNameList = this.extractAtNames(htmlString);

      // text再进行递归拆分，把@、链接和换行符都拆出来
      let tagListNew = [];
      for (const item of tagList) {
        if (item.type === "text") {
          // 先处理换行符，按\n拆分
          const lineItems = this.splitByNewline(item.content);

          for (const lineItem of lineItems) {
            if (lineItem.type === "break") {
              tagListNew.push(lineItem);
              continue;
            }

            // 对每一行进行@拆分
            const arr = strSplitAt(lineItem.content, atNameList).map((content) => {
              return {
                type: "text",
                content,
              };
            });

            // 对每个拆分后的文本，再判断是否存在没有 https 的链接
            for (const n of arr) {
              if (n.content[0] !== "@") {
                // 不是@开头的，需要进一步处理链接
                const tagListTextAndA = splitHtmlStringToObjects(
                  repalceLinkNoPrefix(n.content)
                );
                tagListNew = [...tagListNew, ...tagListTextAndA];
              } else {
                // 是@开头的，直接保留
                tagListNew.push(n);
              }
            }
          }
        } else {
          tagListNew.push(item);
        }
      }

      // 递归处理：如果还有text类型且包含未处理的内容，继续处理
      tagListNew = this.recursiveProcessText(tagListNew, atNameList);

      // 识别链接类型：外部链接标记为 customLink
      tagListNew = this.identifyLinkTypes(tagListNew);

      this.remarkTagList = tagListNew;
    },
    /**
     * 按换行符拆分文本
     */
    splitByNewline(text) {
      if (!text.includes('\n')) {
        return [{ type: "text", content: text }];
      }

      const lines = text.split('\n');
      const result = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          result.push({ type: "text", content: lines[i] });
        }
        // 如果不是最后一行，添加换行符
        if (i < lines.length - 1) {
          result.push({ type: "break" });
        }
      }

      return result;
    },
    /**
     * 递归处理文本节点，直到所有链接和@都被拆分
     */
    recursiveProcessText(tagList, atNameList) {
      let hasUnprocessed = false;
      let result = [];

      for (const item of tagList) {
        if (item.type === "text" && item.content) {
          const content = item.content;

          // 检查是否还有未处理的链接（包含http或域名模式）
          const hasLink = /https?:\/\/[^\s]+/.test(content) ||
                         /([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?/.test(content);

          // 检查是否还有未处理的@（非单独的@开头）
          const hasAt = content.includes('@') && content[0] !== '@';

          if ((hasLink || hasAt) && content[0] !== '@') {
            hasUnprocessed = true;

            // 先处理链接
            let processed = repalceLinkNoPrefix(content);
            const tempList = splitHtmlStringToObjects(processed);

            // 再对拆分后的text进行@处理
            for (const temp of tempList) {
              if (temp.type === "text" && temp.content[0] !== '@') {
                const atSplit = strSplitAt(temp.content, atNameList).map((c) => ({
                  type: "text",
                  content: c,
                }));
                result = [...result, ...atSplit];
              } else {
                result.push(temp);
              }
            }
          } else {
            result.push(item);
          }
        } else {
          result.push(item);
        }
      }

      // 如果还有未处理的内容，继续递归
      if (hasUnprocessed) {
        return this.recursiveProcessText(result, atNameList);
      }

      return result;
    },
    /**
     * 提取文本中所有@开头的可能名称
     */
    extractAtNames(text) {
      const atList = [];
      const matches = text.match(/@[^\s@]+/g);
      if (matches) {
        atList.push(...matches);
      }
      return atList;
    },
    /**
     * 识别链接类型：区分外部链接和内部链接（群聊、频道）
     */
    identifyLinkTypes(tagList) {
      const result = [];

      for (const item of tagList) {
        if (item.type === "link") {
          const linkType = this.checkLinkType(item.href);

          // 如果是外部链接，改为 customLink 类型
          if (linkType === 'external') {
            result.push({
              ...item,
              type: 'customLink',
            });
          } else {
            // 内部链接（频道或群聊）保持为 link 类型
            result.push(item);
          }
        } else {
          result.push(item);
        }
      }

      return result;
    },
    /**
     * 根据 URL 模式判断链接类型
     */
    checkLinkType(url) {
      try {
        const href = url.startsWith('http') ? url : `https://${url}`;
        const urlObj = new URL(href);

        // 判断是否是群聊链接
        if (
          urlObj.origin === "https://ocs.com" &&
          urlObj.searchParams.has("qrCode") &&
          urlObj.searchParams.has("IdCode")
        ) {
          return 'group';
        }

        // 判断是否是频道链接（根据域名或路径特征）
        // 可以根据实际的频道链接格式调整这里的判断逻辑
        if (
          urlObj.hostname.includes('68chat.co') ||
          urlObj.hostname === 'ocs.com' ||
          urlObj.pathname.includes('/channel/')
        ) {
          return 'channel';
        }

        // 其他为外部链接
        return 'external';
      } catch (error) {
        console.error('URL 解析错误:', error);
        return 'external';
      }
    },
    /**
    * 点击了@的内容
    */
    handleAtClick(text) {
      const atText = text.replace("@", "");
      eventBase.fnCommunicationSendMsg({
        operator: "atClick",
        data: {
          text: atText,
        },
      });
    },
    /**
     * 检测remark是否超过5行
     */
    checkRemarkOverflow() {
      const el = this.$refs.remarkContent;
      if (el) {
        // 暂时移除展开状态来准确检测
        const wasExpanded = this.isRemarkExpanded;
        this.isRemarkExpanded = false;
        this.$nextTick(() => {
          // scrollHeight > clientHeight 表示有内容溢出
          this.showToggleBtn = el.scrollHeight > el.clientHeight;
          // 恢复展开状态
          this.isRemarkExpanded = wasExpanded;
        });
      }
    },
    /**
     * 切换remark展开/折叠
     */
    toggleRemark() {
      this.isRemarkExpanded = !this.isRemarkExpanded;
    },
    /**
     * 跳转群聊窗口
     */
    goGroupChatWindow(info) {
      const data = {
        ...info,
        id: Number(info.id),
        name: info.name,
        type: 'group',
        comType: 'chat',
      }
      eventBase.fnCommunicationSendMsg({
        operator: 'activeChange',
        data,
      })
    },
    /**
     * 添加到群列表缓存
     */
    async addToGroupList(info) {
      const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
      const groups = await Cache(`${loginId}-GroupList`) || [];
      const index = groups.findIndex(item => item.id == info.id);
      if (index === -1) {
        // 构建群组基本信息，优先使用 info 中的属性，确保关键字段类型正确
        const newGroup = {
          ...info,
          id: Number(info.id),
          memberCount: Number(info.memberCount),
          hostId: Number(info.hostId),
        };
        groups.push(newGroup);
        Cache(`${loginId}-GroupList`, groups);
      }
    },
    /**
     * 申请入群
     */
    handleJoinGroup() {
      const { id, name, pic } = this.groupInfo;
      groupJoin({
        groupId: Number(id),
        reqType: 15,
        addToken: this.groupInfo.addToken,
        msg: "申请入群",
      }).then(async (res) => {
        const { errMsg, errCode } = res?.commonResult || {};
        // const isSilentDisabled = this.globalConfig.group?.disableUnperceived;
        // if (res === 1021 && isSilentDisabled) {
        //   window.$toast(this.$t("请联系客服#00001"));
        //   return;
        // }
        if (errCode != 200) {
          window.$toast(errMsg || res?.errorDesc || this.$t("加入群聊失败"));
        } else {
          if (this.groupInfo.bfJoinCheck) {
            // 入群需要验证
            window.$toast(this.$t("已提交申请入群"));
          } else {
            // 直接入群成功
            window.$toast(this.$t("加入群聊成功"));

            // 更新缓存
            await this.addToGroupList(this.groupInfo);

            // 发送入群通知
            eventGroup.fnGroupAddMessageNotification({
              groupId: Number(id),
              name: name,
              pic: pic,
              content: this.$t("您已加入群聊"),
              updateTime: Date.now(),
              sendTime: Date.now(),
            });

            // 跳转
            setTimeout(() => {
              this.goGroupChatWindow(this.groupInfo);
            }, 200);
          }
          // 关闭
          this.handleClose();
        }
      }).catch(() => {
        window.$toast(this.$t("加入群聊失败"));
      });
    },
    /**
     * 关闭
     */
    handleClose() {
      // 添加 引用对话框
      eventCommon.fnCloseListRU({
        removeIds: ["groupDialog"],
      });
    },
  },
};
</script>

<style scoped lang="scss">
.comGroupDialog {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  >div {
    width: 420px;
    min-height: 236px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding-top: 26px;
    padding-bottom: 30px;
    position: relative;

    >picture {
      position: absolute;
      right: 0;
      top: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }

      >img {
        display: block;
      }
    }

    >img {
      width: 62px;
      height: 62px;
      border-radius: 99px;
    }

    >span {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-top: 10px;
    }

    >p {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
    }

    >button {
      width: 206px;
      height: 32px;
      background: #3369fe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      border-radius: 4px;
      margin-top: 32px;
      border: 0;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .remark-container {
    width: 100%;
    margin-top: 10px;
    padding: 0 20px;
    box-sizing: border-box;
    position: relative;
    font-family: "Times New Roman";

    .remark-content {
      font-size: 12px;
      color: #999;
      line-height: 18px;
      max-height: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      line-clamp: 5;
      -webkit-box-orient: vertical;
      word-break: break-all;

      &.expanded {
        height: 155px;
        max-height: 155px;
        overflow-y: auto;
        display: block;
        -webkit-line-clamp: unset;
        line-clamp: unset;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          border-radius: 10px;
          background: #e5e5e5;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }
      }
    }

    // 支持@提及和链接样式
    :deep(.at) {
      color: #3369fe;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }

    // 内部链接（频道、群聊）样式
    :deep(a) {
      font-size: 14px;
      color: #3369fe;
      text-decoration: none;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(img) {
      display: inline-block;
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }

    .toggle-btn {
      position: absolute;
      right: 20px;
      bottom: 0;
      font-size: 12px;
      color: #178aff;
      cursor: pointer;
      user-select: none;
      background: #fff;
      padding-left: 4px;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
