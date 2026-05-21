<template>
  <div
    :class="{ comMsgText: true, self: isSelf && chatContent.type !== 'channel' }"
    @click.stop
    @click.right="(e) => $emit('rightClick', e)"
  >
    <slot></slot>
    <div class="contentText">
      <ComLableEle
        v-for="(item, index) in tagList"
        :key="index"
        :info="item"
        :currentChatId="currentGuoupId"
        @atClick="handleAtClick"
      />
    </div>
  </div>
</template>
<script>
// 工具
import { repalceLink, repalceLinkNoPrefix } from "@/utils/base";
import {
  strSplitAt,
  strReplaceEmojiImgLabel,
  splitHtmlStringToObjects,
} from "@/utils/widget";

// 控件
import ComLableEle from "@/pages/home/com/lable-ele.vue";

// 事件
import eventBase from "@/event/base";
import eventCommon from '@/event/common';

export default {
  components: {
    ComLableEle,
  },
  props: ["isSelf", "content", "atUsers", "currentGuoupId", "links", "chatContent", "atUids"],
  watch: {
    info: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.handleInfoSet();
        }
      },
      immediate: true,
    },
  },
  data() {
    return {
      tagList: [],
    };
  },
  mounted() {
    this.handleInfoSet();
  },
  methods: {
    /**
     * 点击了at的内容
     * @param {string} text  @ 文本（含 @ 前缀）
     * @param {object} [info] 来自 lable-ele 的整个节点，可能带 uid / possibleUid
     */
    handleAtClick(text, info) {
      const atText = text.replace("@", "");
      const uid = info?.uid;
      const possibleUid = info?.possibleUid;

      // 高可信度：有 uid 时直接带 uid 走 memberDialogShow，让下游优先按 uid 查
      if (uid != null) {
        eventBase.fnCommunicationSendMsg({
          operator: "memberDialogShow",
          data: {
            atName: atText,
            atUid: uid,
          },
        });
        return;
      }

      // at的名称列表
      const atNameList = this.atUsers
        ? this.atUsers.map((item) => ("@" + item.nickName + " @" + item.name))
        : [];

      // 名字在 atUsers 范围内，直接打开成员对话框（保持原逻辑）
      if (atNameList.some(i => i.includes(text))) {
        eventBase.fnCommunicationSendMsg({
          operator: "memberDialogShow",
          data: {
            atName: atText,
          },
        });
        return;
      }

      // 低可信度：把 possibleUid 也带过去，fnAtClick 在按名字查不到时用它兜底
      eventBase.fnCommunicationSendMsg({
        operator: "atClick",
        data: {
          text: atText,
          groupId: this.currentGuoupId,
          possibleUid,
        },
      });
    },
    /**
     * 处理自定义文本链接增加a标签包裹
     */
    handelCustomLink(htmlStr, links) {
      if(!Array.isArray(links)) return htmlStr;
      let htmlString = htmlStr;
      links.forEach(item => {
        const { location = 0, length, link } = item || {};
        if(link && location >= 0 && length > 0) {
          let source = htmlStr.substring(location, location + length);
          let href = link.replace('http', 'ht#customLink#tp'); // 替换http防污染
          const result = `<a href="${href}" data-href="${link}" type="customLink">${source}</a>`
          htmlString = htmlString.replace(source, result)
        }
      })
      return htmlString
    },
    /**
     * 设置信息
     */
    handleInfoSet() {
      let htmlString = this.content;
      if(this.links) {
        htmlString = this.handelCustomLink(htmlString, this.links);
      }

      // 字符串替换为表情图片标签
      htmlString = strReplaceEmojiImgLabel(htmlString);

      // 连接处理
      htmlString = repalceLink(htmlString);
      // 替换回链接防污染
      htmlString = htmlString.replace('ht#customLink#tp', 'http');

      if(this.atUsers?.length) {
        // 给atUsers增加备注名
        const friendRemarks = eventCommon.fnFriendRemarksGet();
        this.atUsers.forEach(item => {
          if (!item.name) {
           const remarkObj = friendRemarks.find(i => i.id === item.uid);
           if(remarkObj) {
             item.name = remarkObj.name || "";
           }
          }
        })
        // 替换at的好友真实昵称替换为好友备注
        // this.atUsers.forEach(item => {
        //   if(item.name) {
        //     htmlString = htmlString.replace('@'+item.nickName, '@'+item.name)
        //   }
        // })

        // 替换at的好友真实昵称替换为好友备注 优化 确保能正确替换所有at用户
        const usersWithRemark = this.atUsers.filter(item => item.name);
        if (usersWithRemark.length > 0) {
          // 按长度降序排序，防止短名误匹配长名
          usersWithRemark.sort((a, b) => b.nickName.length - a.nickName.length);
          const nameMap = {};
          usersWithRemark.forEach(item => { nameMap[item.nickName] = item.name; });
          const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = usersWithRemark.map(u => escapeRegExp(u.nickName)).join('|');
          // 匹配 @nickName 后面跟随 结束符、空白字符(包含空格、换行等)或@
          const reg = new RegExp(`@(${pattern})(?=$|[\\s@])`, 'g');
          htmlString = htmlString.replace(reg, (match, nickName) => {
            return '@' + (nameMap[nickName] || nickName);
          });
        }

      }
      // 拆分html
      const tagList = splitHtmlStringToObjects(htmlString);
      // at的名称列表
      const atNameList = this.atUsers
        ? this.atUsers.map((item) => "@" + (item.name || item.nickName))
        : [];
        
      // text再进行拆分 把at拆出来
      let tagListNew = [];
      for (const item of tagList) {
        if (item.type === "text") {
          const arr = strSplitAt(item.content, atNameList).map((content) => {
            return {
              type: "text",
              content,
            };
          });

          // 对文本判断是否存在没有 https的链接
          for (const n of arr) {
            if (n.content[0] !== "@") {
              const [previous, next] = (n.content || '').split('@');
              let result = [];
              if (n.content.includes('@')) {
                result = [{ type: "text", content: previous }, { type: "text", content: `@${next}` }];
              } else {
                result = splitHtmlStringToObjects(
                    repalceLinkNoPrefix(previous)
                );
              }
              tagListNew = [...tagListNew, ...result];
            } else {
              tagListNew.push(n);
            }
          }
        } else {
          tagListNew.push(item);
        }
      }
      // console.log('tagListNew ------>', tagListNew)
      tagListNew = tagListNew.filter(item => item.type !== 'break')

      // 高可信度：按 atUsers 中的名字（显示名 与 原始 nickName）匹配 uid
      tagListNew = this.assignAtUidByName(tagListNew);

      // 低可信度兜底：atUsers 缺失但 atUids 存在时，按 @ 出现顺序与 atUids 位置对齐
      if (!this.atUsers?.length && this.atUids?.length) {
        tagListNew = this.assignAtUidByOrder(tagListNew);
      }
      this.tagList = tagListNew;
    },
    /**
     * 高可信度：按 atUsers 中的名字匹配 uid。
     * 同时比对「显示名（备注优先 name || nickName）」与「原始 nickName」两路，
     * 兼容备注替换失败/缺失的场景。命中后写入 item.uid（与 possibleUid 互斥）。
     */
    assignAtUidByName(tagList) {
      if (!this.atUsers?.length) return tagList;
      const nameToUid = new Map();
      for (const user of this.atUsers) {
        // 兼容两种字段命名：有的来源用 uid，有的（如 editor 走出去/回来）用 id
        const uid = user?.uid ?? user?.id;
        if (uid == null) continue;
        // 显示名：与上文 atNameList 口径一致
        const displayName = user.name || user.nickName;
        if (displayName) {
          nameToUid.set('@' + displayName, uid);
        }
        // 原始 nickName 兜底（应对备注替换失败/缺失的场景）
        if (user.nickName) {
          const key = '@' + user.nickName;
          if (!nameToUid.has(key)) nameToUid.set(key, uid);
        }
      }
      for (const item of tagList) {
        if (item.type !== 'text') continue;
        if (!item.content || item.content[0] !== '@' || item.content === '@') continue;
        if (item.uid != null) continue;
        const uid = nameToUid.get(item.content);
        if (uid != null) {
          item.uid = uid;
          // 与 possibleUid 互斥
          if (item.possibleUid != null) delete item.possibleUid;
        }
      }
      return tagList;
    },
    /**
     * 低可信度：atUsers 缺失而 atUids 存在时，按 @ 标签出现顺序与 atUids 位置对齐推测 uid。
     * 写入 item.possibleUid（uid 值，非布尔），与 item.uid 互斥。
     */
    assignAtUidByOrder(tagList) {
      if (!this.atUids?.length) return tagList;
      const atItems = tagList.filter(item =>
        item.type === 'text' &&
        item.content &&
        item.content[0] === '@' &&
        item.content !== '@' &&
        item.uid == null
      );
      if (atItems.length === 0 || atItems.length !== this.atUids.length) {
        return tagList;
      }
      atItems.forEach((item, idx) => {
        const uid = this.atUids[idx];
        if (uid != null) item.possibleUid = uid;
      });
      return tagList;
    },
  },
};
</script>
<style scoped lang="scss">
.comMsgText {
  max-width: 450px;
  min-width: 130px;
  border-radius: 10px;
  border-top-left-radius: 0;
  word-wrap: break-word;
  background: #ffffff;
  position: relative;
  padding: 10px 10px 10px 12px;

  &.self {
    background: #98daff;
    border: 1px solid #87cdf6;
    border-top-left-radius: 10px;
    border-top-right-radius: 0;
  }

  > .contentText {
    padding-right: 75px;
    line-height: 22px;
    white-space: pre-wrap;
    letter-spacing: 0.5px;

    .at {
      margin: 0;
      font-size: 14px;
      color: #3369fe;
      display: inline-block;
      cursor: pointer;
      font-weight: normal;

      &:hover {
        opacity: 0.8;
      }
    }

    > img {
      display: inline-block;
      width: 20px;
      height: 20px;
      position: relative;
      top: 4px;
    }
  }
}
</style>

<style lang="scss">
.contentText {
  > a img {
      display: inline-block;
      width: 20px;
      height: 20px;
      position: relative;
      top: 4px;
    }
}
</style>
