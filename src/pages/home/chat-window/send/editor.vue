<template>
  <div :class="{ comChatSend: true, dialog: isDialog }">
    <div class="btns">
      <div class="emoji">
        <ComActiveIcon icon="small" @click="handleEmojiVisibleChange" />
        <ComEmoji
          v-if="emojiVisible"
          :definedHidden="isDialog"
          @choice="handleSendEmoji"
        />
      </div>
      <div v-if="!isDialog">
        <input
          ref="fileInput"
          type="file"
          name="file"
          accept="*/*"
          multiple
          style="display: none"
          @change="handleFileInputSet"
        />
        <ComActiveIcon icon="file" @click="$refs.fileInput.click()" />
      </div>
    </div>
    <div
      :id="inputId"
      ref="input"
      class="input_div"
      draggable="false"
      autofocus
      contenteditable="true"
      spellcheck="false"
      @mouseup="handleAtListShow"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @paste="handlePaste"
      @contextmenu.prevent="handleContextmenu"
      @click.stop="handleInputClick"
      @blur="handleInputBlur"
    ></div>
    <vue-context class="menuBox" ref="rightClickMenu" :lazy="true">
      <div class="menu-content">
        <li @click="handleCopyClick">
          {{ $t("复制") }}
          <img class="icon" src="@/assets/images/menu/copy.png" alt=""/>
        </li>
        <li @click="handlePasteClick">
          {{ $t("粘贴") }}
          <img class="icon" src="@/assets/images/menu/paste.png" alt=""/>
        </li>
        <li>
          文本格式
          <img class="icon" src="@/assets/images/menu/more.png" alt=""/>

          <div class="menu-two-box">
            <div class="menu-two-item"  @click.prevent="handleCreatTextLink">创建链接</div>
          </div>
        </li>
      </div>
    </vue-context>
    <span v-if="placeholderVisible">
      {{ isEnter ? $t("Enter发送") : $t("CtrlEnter发送") }}
    </span>
    <div
      v-if="
        chatContent.bfReadCancel && !isDialog && chatContent.type == 'friend'
      "
      class="readBurnTimeTip"
      @click.stop="handleOpenRcheduleDeletionConfigDialog()"
    >
      <img src="@/assets/images/chat/read-burn-time.png" />
      <span>
        {{ fnRcheduleDeletionTimeTextGet(chatContent.msgCancelTime || 30) }}
      </span>
    </div>
    <button @click="handleSendMsgText()">{{ $t("发送") }}</button>
    <ComAtList
      v-if="atListVisible"
      :type="chatContent.type"
      :searchText="searchText"
      :isLeader="isLeader"
      @addAt="handleAddAt"
      @close="atListVisible = false"
    />
    <ComRcheduleDeletionConfigDialog
      v-if="rcheduleDeletionConfigDialogVisible"
      :msgCancelTime="chatContent.msgCancelTime || 30"
      :chatContent="chatContent"
    />
    <ComCreateLink
      v-if="createLinkVisible"
      :selectText="selectText"
      :chatContent="chatContent"
      @cancel="createLinkVisible = false"
      @confirm="createLink"
     />
  </div>
</template>
<script>
import { clipboard } from "electron";
import { isElectron, ipcRenderer } from "@/platform";

// 控件
import ComActiveIcon from "@/components/active-icon";

// 工具
import { Local } from "@/utils";
import { fnRcheduleDeletionTimeTextGet } from "@/utils/widget";

import { filterSensitiveWords } from "@/utils/tools";
import { textToEmojiImage, generateUniqueId, strIsSafe } from "@/utils/base";
import {
  fnTextSendInfoGet,
  fnTextGetAt,
  fnCopyEditorContent,
  fnStrLastCousorIndexGet,
  fnEmojiToText,
  fnMoveCursorAfterImage,
  fnGetSelectContent,
  fnGetSelectInnerHTML,
} from "@/utils/widget/editor";

// 事件
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

let savedSelection = null;

export default {
  components: {
    ComActiveIcon,
    ComAtList: () => import("./at-list-dialog.vue"),
    ComEmoji: () => import("./emoji.vue"),
    ComCreateLink: () => import("./create-link.vue"),
    ComRcheduleDeletionConfigDialog: () =>
      import("./rchedule-deletion-config-dialog.vue"),
  },
  props: ["chatContent", "inputId", "isLeader", "msgCancelTime", "quoteInfo", "editInfo"],
  data() {
    return {
      createLinkVisible: false, // 创建链接弹窗 是否显示
      emojiVisible: false, // 表情窗口 是否显示
      isDialog: false, // 是否为对话框
      atListVisible: false, // at列表对话框 是否显示
      placeholderVisible: true,
      searchText: "",
      isEnter: true,
      draftInfos: {},
      rcheduleDeletionConfigDialogVisible: false,
      selectText: "", // 选中的文字
      createLinkOpts: [], // 创建链接的选项信息
    };
  },
  inject: ["provideMemberList"],
  mounted() {
    // 是否为 Enter键 发送
    const { accountConfig } = eventCommon.fnConfigRU();
    this.isEnter = accountConfig.sendShortcutKey === "Enter";

    // 是否为对话框
    this.isDialog = this.inputId === "sendMessageInput2";

    // 如果不为弹窗，则同步草稿
    if (!this.isDialog) {
      // 添加监听 设置通信事件的监听机制
      eventBase.fnCommunicationMonitoring(
        "sendEditor",
        [
          "editorAddText",
          "sendEditorFoucs",
          "hotKeyChange",
          "closeOperator",
          "sendShortcutKey",
        ],
        this.eventHandling
      );

      const idStr = this.chatContent.id + this.chatContent.type;

      // 如果存在草稿则同步
      const draftInfo = eventCommon.fnDraftInfosRU({ getId: idStr });

      if (draftInfo) {
        // 草稿同步
        this.$refs["input"].innerHTML = textToEmojiImage(draftInfo);

        // 光标移动到最后
        this.handleMoveCursorToEnd();

        // 清除草稿
        eventCommon.fnDraftInfosRU({ deleteId: idStr });
      }

      // 是否显示占位提示
      this.handlePlaceholderVisibleSet();
    } else {
      // 弹窗输入同步
      const dom = document.getElementById("sendMessageInput");
      if (dom) {
        this.$refs["input"].innerHTML = dom.innerHTML;

        // 是否显示占位提示
        this.handlePlaceholderVisibleSet();
      }

      // 添加监听 设置通信事件的监听机制
      eventBase.fnCommunicationMonitoring(
        "sendEditorDialog",
        ["closeOperator", "sendShortcutKey"],
        this.eventHandling
      );
    }

    // 默认焦点
    setTimeout(() => {
      if (this.$refs["input"]) {
        this.$refs["input"].focus();

        // 设置回复信息 焦点到输入
        this.handleMoveCursorToEnd();

        // 设置显示占位符提示
        this.handlePlaceholderVisibleSet();
      }
    }, 200);
  },
  beforeDestroy() {
    // 如果不是弹窗，离开时记录草稿
    if (!this.isDialog) {
      // 移除监听 移除通信事件的监听机制
      eventBase.fnCommunicationMonitoring("sendEditor", null);

      // 记录草稿
      const value = this.$refs["input"].innerHTML;
      const idStr = this.chatContent.id + this.chatContent.type;

      eventCommon.fnDraftInfosRU(
        value === ""
          ? { deleteId: idStr }
          : {
              key: idStr,
              value: fnEmojiToText(value),
            }
      );
    } else {
      // 移除监听 移除通信事件的监听机制
      eventBase.fnCommunicationMonitoring("sendEditorDialog", null);
    }
  },
  watch: {
    editInfo(editInfo) {
      const { content } = editInfo || {};
      if(content) {
        this.$refs.input.innerHTML = editInfo.content
      }
    }
  },
  methods: {
    fnRcheduleDeletionTimeTextGet,
    handleBaseMouseDown(e) {
      console.log({ e });
    },
    createLink(opts) {
      const { linkText, linkValue } = opts;
      this.handleInputFocus();
      let selectText = fnGetSelectInnerHTML();
      let inputValue = this.$refs.input.innerHTML
      let linkData = `<a href="${linkValue}">${linkText}</a>`
       inputValue =inputValue.replace(selectText, linkData)


      this.$refs.input.innerHTML = inputValue
      this.createLinkOpts.push(opts);
      this.createLinkVisible = false;
      this.handlePlaceholderVisibleSet()
    },

    handleCreatTextLink() {
       this.handleInputFocus();
      this.selectText = fnGetSelectContent();
      this.createLinkVisible = true;
    },
    /**
     * 输入的焦点离开
     */
    handleInputBlur() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        savedSelection = selection.getRangeAt(0); // 保存当前选中的范围
      }
    },
    /**
     * 输入聚焦
     */
    handleInputFocus() {
      this.$refs["input"].focus();

      const selection = window.getSelection();
      selection.removeAllRanges(); // 清除当前的选中范围
      selection.addRange(savedSelection); // 还原选中的文本范围
    },
    /**
     * 复制 点击
     */
    handleCopyClick() {
      this.handleInputFocus();
      fnCopyEditorContent();
    },
    /**
     * 粘贴点击
     */
    handlePasteClick(e) {
      this.$refs["input"].focus();

      if (savedSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges(); // 清除当前的选中范围
        selection.addRange(savedSelection); // 还原选中的文本范围
      }

      this.handlePaste(e);
    },
    /**
     * 点击输入框
     */
    handleInputClick(event) {
      // 判断是否点击了图片
      if (event.target.tagName === "IMG") {
        fnMoveCursorAfterImage(event.target);
      }

      setTimeout(() => {
        eventBase.fnCommunicationSendMsg({
          operator: "closeOperator",
          data: {
            ids: ["rightClickMenu"],
          },
        });
      }, 100);
    },
    /**
     * 表情显示改变
     */
    handleEmojiVisibleChange() {
      if (this.emojiVisible) {
        // 关闭 表情会话框
        eventCommon.fnCloseListRU({
          removeIds: ["emojiDialog"],
        });

        setTimeout(() => {
          this.handleInputFocus();
        }, 100);
      } else {
        // 添加 表情会话框
        eventCommon.fnCloseListRU({
          addId: "emojiDialog",
        });

        this.emojiVisible = true;

        setTimeout(() => {
          this.handleInputFocus();
        }, 100);
      }
    },
    /**
     * 处理事件
     */
    eventHandling(info, operator) {
      switch (operator) {
        case "editorAddText": {
          // 添加 文本
          this.$refs.input.innerHTML += info.text;
          this.handlePlaceholderVisibleSet();

          // 光标移动到最后
          this.handleMoveCursorToEnd();
          break;
        }
        case "sendEditorFoucs": {
          // 设置回复信息 焦点到输入
          this.handleInputFocus();

          // 设置显示占位符提示
          this.handlePlaceholderVisibleSet();
          break;
        }
        case "hotKeyChange": {
          // enter 快捷键设置改变
          this.isEnter = !Local("sendShortcutKey");
          break;
        }
        case "closeOperator": {
          // 关闭右键点击菜单
          this.$refs.rightClickMenu && this.$refs.rightClickMenu.close();

          // 关闭表情
          this.emojiVisible = false;

          if (info.ids[0] !== "rightClickMenu") {
            // 设置回复信息 焦点到输入
            this.handleInputFocus();

            // 设置显示占位符提示
            this.handlePlaceholderVisibleSet();
          }

          // 关闭定时删除配置的会话框
          this.rcheduleDeletionConfigDialogVisible = false;
          break;
        }
        case "sendShortcutKey": {
          // 设置 发送消息的快捷键
          this.isEnter = info.sendShortcutKey === "Enter";
          break;
        }
        default:
      }
    },
    /**
     * 打开定时删除配置的会话框
     */
    handleOpenRcheduleDeletionConfigDialog() {
      // if (this.chatContent.type == 'group') {
      //   window.$toast('当前操作已被禁用')
      //   return
      // }
      // 添加 阅后即焚配置会话框
      eventCommon.fnCloseListRU({
        addId: "rcheduleDeletionConfigDialog",
      });

      // 打开定时删除配置的会话框
      this.rcheduleDeletionConfigDialogVisible = true;
    },
    /**
     * 移动光标到最后
     */
    handleMoveCursorToEnd() {
      const { childNodes } = document.getElementById(this.inputId);
      if (childNodes) {
        let offset = -1; // 图片后面就是 -1
        const node = childNodes[childNodes.length - 1];
        if (node) {
          if (node.nodeName === "#text") {
            offset = node.nodeValue.length;
          }
        } else {
          if (this.$refs["input"]) {
            this.$refs["input"].focus();
          }
        }

        this.handleCursorSet(offset, childNodes.length - 1);
      }
    },
    /**
     * 添加 br 标签
     */
    handleAddWrap() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 清除任何已选中的文本（如果有的话）
        range.deleteContents();

        const ele = document.createElement("br");
        ele.className = generateUniqueId();
        range.insertNode(ele);

        // 创建一个新的 Range 并设置其位置为图片的后面
        const newRange = document.createRange();
        newRange.setStartAfter(ele);
        newRange.setEndAfter(ele);
        // 清除之前的选区
        selection.removeAllRanges();
        // 将新的 Range 设置为当前选区
        selection.addRange(newRange);

        // 设置显示占位符提示
        this.handlePlaceholderVisibleSet();
      }
    },
    /**
     * 选择表情或发送骰子
     */
    handleSendEmoji(info) {
      this.emojiVisible = false;
      let { value, type, key } = info;

      if (type === 1) {
        setTimeout(() => {
          this.handleInputFocus();
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            // 创建一个新的 Image 元素
            const img = document.createElement("img");
            img.dataset.key = key; // 存储表情key
            img.src = value; // 替换为你的图片URL
            img.className = generateUniqueId();

            // 插入自定义内容并触发撤销历史
            if (!selection.isCollapsed) {
              document.execCommand("delete");
            }

            document.execCommand("insertHTML", false, img.outerHTML);

            this.handlePlaceholderVisibleSet();
          }
        }, 100);
      } else if(type === 2) {
        const { id, type, mute } = this.chatContent;

        eventBase.fnCommunicationSendMsg({
          operator: "msgSend",
          data: {
            id,
            type,
            list: [
              {
                type: "dice",
                values: {
                  chatType: 12,
                  msgType: 12,
                },
                mute,
              },
            ],
          },
        });
      } else if(type === 3) {
        const { id, type, mute } = this.chatContent;

        eventBase.fnCommunicationSendMsg({
          operator: "msgSend",
          data: {
            id,
            type,
            list: [
              {
                type: "poker",
                values: {
                  chatType: 18,
                  msgType: 18,
                },
                mute,
              },
            ],
          },
        });
      }
    },
    /**
     * 根据当前的光标所在 对应显示可以 @ 的好友
     */
    async handleAtListShow() {
      const { type } = this.chatContent;
      // 不是群或者是弹窗
      if (!["group", "channel"].includes(type) || this.isDialog) {
        return;
      }
      const selection = window.getSelection();
      const { anchorOffset, focusOffset, anchorNode } = selection;

      // 不显示@列表
      // 1. 如果光标不在文本上
      // 2. 当前不是群聊
      if (
        anchorNode.nodeName !== "#text" ||
        !["group", "channel"].includes(type)
      ) {
        if (this.atListVisible) {
          this.atListVisible = false;
        }
        return;
      }
      let atListVisible = false;

      // 不为选中
      if (anchorOffset === focusOffset) {
        // @索引
        let atLastIndex = anchorNode.data
          .slice(0, focusOffset)
          .lastIndexOf("@");

        // 最近的空格索引
        const recentSpaceIndex = anchorNode.data
          .slice(0, focusOffset)
          .lastIndexOf(" ");

        // 如果存在空格 并且空格在@之后， 则 @与当前无关
        if (recentSpaceIndex > atLastIndex) {
          atLastIndex = -1;
        }

        // @存在
        console.log("atLastIndex--", atLastIndex)
        if (atLastIndex !== -1) {
          // 第一个就是@
          if (atLastIndex === 0) {
            atListVisible = true;
          } else if (
            anchorNode.data.slice(atLastIndex - 1, atLastIndex) === " " ||
            anchorNode.data.slice(atLastIndex - 1, atLastIndex) === "@"
          ) {
            // 不是第一个的情况下，前面要有空格或者@
            atListVisible = true;
          }
        }

        // 如果@列表显示，则设置搜索文本
        if (atListVisible) {
          // 截取到@之后
          let searchText = anchorNode.data.slice(atLastIndex + 1);

          // 如果有空格，截取空格之前
          const spaceIndex = searchText.indexOf(" ");
          if (spaceIndex > 0) {
            searchText = searchText.slice(0, spaceIndex);
          }

          this.searchText = searchText;
        }

        this.atListVisible = atListVisible;
      }
    },
    /**
     * 键盘操作
     */
    handleKeyDown(e) {
      // 复制
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        fnCopyEditorContent();
        return;
      }

      // @列表 的键盘操作
      if (
        this.atListVisible &&
        ["ArrowUp", "ArrowDown", "Enter"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // enter键
      if (e.keyCode === 13) {
        e.preventDefault(); // 阻止enter键的默认行为
      }

      // 设置显示占位符提示
      this.handlePlaceholderVisibleSet();
    },
    /**
     * 键盘操作
     */
    handleKeyUp(e) {
      // enter键
      if (e.keyCode === 13 && !this.atListVisible) {
        this.handleEnter(e);
      }

      // 如果不是退出键
      if (e.keyCode !== 27) {
        // @列表是否显示
        this.handleAtListShow();
      } else {
        this.atListVisible = false;
      }

      // 设置显示占位符提示
      this.handlePlaceholderVisibleSet();
    },
    /**
     * 设置显示占位符提示
     */
    handlePlaceholderVisibleSet() {
      setTimeout(() => {
        if (this.$refs["input"]) {
          this.placeholderVisible = this.$refs["input"].innerHTML === "";
        }
      }, 20);
    },
    /**
     * 获取当前光标元素的索引
     */
    handleEleIndexGet() {
      const { childNodes } = document.getElementById(this.inputId);
      if (childNodes.length > 0) {
        const { anchorNode, anchorOffset } = window.getSelection();

        if (anchorNode.nodeName === "#text") {
          // 上一个元素不存在则为第一个元素
          if (anchorNode.previousSibling) {
            // 使用的唯一id
            const eleId = anchorNode.previousSibling.className;
            let eleIndex = 0;
            // 找元素的索引
            for (let i = 0; i < childNodes.length; i++) {
              if (
                childNodes[i].outerHTML &&
                childNodes[i].outerHTML.includes(eleId)
              ) {
                eleIndex = i + 1;
              }
            }
            return eleIndex;
          }
        } else {
          // 使用的唯一id
          const eleId = childNodes[anchorOffset - 1].className;
          // 找元素的索引
          for (let i = 0; i < childNodes.length; i++) {
            if (
              childNodes[i].outerHTML &&
              childNodes[i].outerHTML.includes(eleId)
            ) {
              return i;
            }
          }
        }
      }
      return 0;
    },
    /**
     * 光标设置
     * @param {*} offset
     * @param {*} eleIndex
     */
    handleCursorSet(offset, eleIndex) {
      const selection = window.getSelection();
      const node = document.getElementById(this.inputId);
      const { childNodes } = node;
      const rang = document.createRange();

      if (offset === -1) {
        rang.setStart(node, eleIndex + 1);
        rang.setEnd(node, eleIndex + 1);
      } else {
        rang.setStart(childNodes[eleIndex], offset);
        rang.setEnd(childNodes[eleIndex], offset);
      }

      rang.collapse(false); // 起始位置和终止位置是否相同的布尔值
      selection.removeAllRanges(); // 移除选中区域的range对象
      selection.addRange(rang); // 给选中区域添加range对象
    },
    /**
     * 把选中的at成员同步到对应的位置
     */
    handleAddAt(atName) {
      const selection = window.getSelection();
      const { anchorOffset, anchorNode } = selection;
      const data = anchorNode.data;

      // 文本的前面内容
      let textBefore = data.slice(0, anchorOffset);
      const indexBefore = textBefore.lastIndexOf("@");
      textBefore = textBefore.slice(indexBefore + 1);

      // 文本的后面内容
      let textAfter = data.slice(anchorOffset);
      const indexAfter = textAfter.indexOf(" ");
      textAfter =
        indexAfter === -1 ? textAfter : textAfter.slice(0, indexAfter);

      // 被替换的文本
      const textRepaced = textBefore + textAfter;

      //  用来替换的文本
      let textReplace = atName;

      // 如果没有空格分隔则添加空格
      if (
        data.slice(indexBefore + 1).indexOf(textRepaced) !==
        data.slice(indexBefore + 1).indexOf(textRepaced + " ")
      ) {
        textReplace += " ";
      }

      // 新的input内容
      let inputContent = data.slice(0, indexBefore + 1);
      inputContent += data
        .slice(indexBefore + 1)
        .replace(textRepaced, textReplace);

      // 替换的元素索引
      const eleIndex = this.handleEleIndexGet();

      // 如果当前有多个元素，则需要还原其他元素
      const { childNodes } = document.getElementById(this.inputId);
      if (childNodes.length > 0) {
        // 全部元素的html
        const arr = [];
        for (const item of childNodes) {
          if (item.nodeName === "#text") {
            arr.push(item.nodeValue);
          } else {
            arr.push(item.outerHTML);
          }
        }

        // 更新替换
        arr[eleIndex] = inputContent;

        // 合并赋值
        inputContent = arr.join("");
      }

      // let oldInputContent = this.$refs["input"].innerHTML
      this.$refs["input"].innerHTML = inputContent;

      // 光标移动到对应位置
      this.handleCursorSet(indexBefore + 1 + textReplace.length, eleIndex);

      setTimeout(() => {
        this.atListVisible = false;
      }, 100);
    },
    /**
     * enter键触发
     * @param {*} e
     */
    handleEnter(e) {
      // 发送或换行
      // let isSend = !Local("sendShortcutKey") !== e.ctrlKey;
      const { accountConfig } = eventCommon.fnConfigRU();
      let keyBoard = e.ctrlKey ? 'Ctrl+Enter' : 'Enter';
      let isSend = keyBoard == accountConfig.sendShortcutKey

      // shift + center 也是换行
      if (e.shiftKey) {
        isSend = false;
      }

      if (isSend) {
        this.handleSendMsgText();
      } else {
        // 如果是在最后面，需要执行两次
        const { anchorOffset, anchorNode } = window.getSelection();

        // 文本最后一个元素的判断
        if (
          anchorNode.nodeName === "#text" &&
          !_.get(anchorNode, "nextSibling.className")
        ) {
          // 光标在最后
          if (anchorNode.nodeValue.length === anchorOffset) {
            this.handleAddWrap();
          }
        }

        // 非文本最后一个元素的判断
        if (anchorNode.nodeName === "DIV") {
          const { childNodes } = document.getElementById(this.inputId);
          // 如果光标在最后，并最后的元素不是 br
          if (
            anchorOffset === childNodes.length &&
            childNodes[childNodes.length - 1].nodeName !== "BR"
          ) {
            this.handleAddWrap();
          }
        }

        this.handleAddWrap();
      }
    },
    /**
     * 打开右键菜单
     * @param {*} e
     */
    handleContextmenu(e) {
      this.$refs.rightClickMenu && this.$refs.rightClickMenu.open(e);

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        savedSelection = selection.getRangeAt(0); // 保存当前选中的范围
      }
    },
    /**
     * 发送消息 文本
     */
    handleSendMsgText(value) {
      const { id, type, mute } = this.chatContent;
      // 消息文本  &符号通过innerHTML获取会被转义成html实体&amp;，这会导致url字符串里的的query参数里的&符号不准确
      // 因此使用replaceAll 把它们替换回来

      let msgText = value || this.$refs["input"].innerHTML.replaceAll('&amp;', '&')
          // 去掉a标签
          msgText = msgText.replace(/<a[^>]*>([\s\S]*?)<\/a>/, '$1');

      // 发送的内容为空
      if (msgText === "") {
        // 如果是文件对话框，直接触发文件的发送
        if (this.isDialog) {
          // 消息发送
          this.$emit("send", []);
        } else {
          // 如果不是文件对话框
          eventBase.fnCommunicationSendMsg({
            operator: "msgSend",
            data: {
              id,
              type,
              list: [],
              mute,
            },
          });
        }
        return;
      }

      // 获取敏感词
      msgText = filterSensitiveWords(msgText);

      // 发送失败 发送的内容都是敏感词
      if (msgText === "") {
        window.$toast(this.$t("发送的内容全是敏感词"));
        return;
      }

      // 可能是xss攻击语句，限制发送
      if (!strIsSafe(msgText)) {
        console.log("当前消息被限制发送", msgText);
        return;
      }

      // 消息处理，或拆分成多个
      let textListSend = fnTextSendInfoGet(msgText);

      // 如果是群，判断是否有at的信息
      if (type === "group") {
        textListSend = textListSend.map((item) => {
          let content = item.values.content
          const atUsers = fnTextGetAt(
            content,
            this.provideMemberList(),
            this.isLeader
          );

          if (atUsers.length > 0) {
            // 将消息内容中的备注名替换为真实昵称
            atUsers.forEach(i => {
              if(i.name) {
               content = content.replace(i.name, i.nickName);
              }
            });
            item.values.content = content;

            return {
              ...item,
              values: {
                ...item.values,
                atUids: atUsers.map((item) => item.id),
                atUsers,
                groupName: this.chatContent.name,
              },
            };
          }

          return item;
        });
      }

      // 如果是文件对话框，直接触发文件的发送
      if (this.isDialog) {
        // 消息发送
        this.$emit("send", textListSend);
        return;
      }

      // 如果有回复则设置为回复后，发送
      // 发送
      eventBase.fnCommunicationSendMsg({
        operator: "msgSend",
        data: {
          id,
          type,
          list: textListSend,
          quoteInfo: this.quoteInfo,
          editInfo: this.editInfo,
          createLinkOpts: this.createLinkOpts,
          mute,
        },
      });

      // 清空输入框
      this.$refs["input"].innerHTML = "";

      // 设置显示占位符
      this.handlePlaceholderVisibleSet();
    },
    /**
     * 文件选中设置
     */
    handleFileInputSet(event) {
      const files = event.target.files;
      const list = [];
      for (const file of files) {
        list.push(file);
      }

      // 设置要上传的文件列表
      eventBase.fnCommunicationSendMsg({
        operator: "uploadFilesSet",
        data: {
          uploadFiles: list,
        },
      });

      // 清除文件选中
      setTimeout(() => {
        this.$refs.fileInput.value = "";
      }, 100);
    },
    /**
     * 获取文件
     */
    async getFile(url) {
      const response = await fetch("file://" + url);
      const blob = await response.blob();
      blob.lastModifiedDate = new Date();
      blob.name = url.slice(url.lastIndexOf("/") + 1);
      blob.path = url;
      return blob;
    },
    /**
     * 粘贴
     */
    async handlePaste(e) {
      let text;
      document.getElementById(this.inputId).scrollTo(0, 99999999999999);
      e.preventDefault();
      const data = (e.originalEvent || e)?.clipboardData;
      if (data) {
        text = (e.originalEvent || e).clipboardData.getData("text/plain");
      } else {
        text = clipboard.readText();
      }

      // 如果是复制的id
      if (eventCommon.fnIdCopyRU() === text) {
        // id不包括@
        if (!text.includes("@")) {
          text = "@" + text;
        }

        if (this.$refs["input"].innerHTML !== "") {
          text = " " + text;
        }

        text += " ";
      }

      // 文件粘贴
      const fileList = [];

      if (isElectron()) {
        const args = ipcRenderer.sendSync("file-paste");

        // 粘贴文件
        if (args.hasFile) {
          const items = e.clipboardData && e.clipboardData.items;

          if (items && items.length) {
            // 检索剪切板items
            for (var i = 0; i < items.length; i++) {
              const file = items[i].getAsFile();
              if (file && file.path !== "") {
                fileList.push(file);
              }
            }
          }
          if (fileList.length === 0) {
            for (const item of args.files) {
              const res = await this.getFile(item.path);
              fileList.push(res);
            }
          }
        }

        // 粘贴图片
        if (args.hasImage) {
          const res = await this.getFile(args.filename);
          fileList.push(res);
        }

        // 打开上传文件对话框
        if (fileList.length > 0) {
          eventBase.fnCommunicationSendMsg({
            operator: "uploadFilesSet",
            data: {
              uploadFiles: fileList.map((blob) => {
                return new File([blob], blob.name, {
                  type: blob.type,
                });
              }),
            },
          });
        }

        // 如果粘贴的文件，则不粘贴到编辑栏目
        if (args.hasFile || args.hasImage) {
          return;
        }
      }
      if (text && text.trim()) {
        // 移除选中的内容
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // 清除已选中的文本
          range.deleteContents();
        }

        setTimeout(() => {
          // 添加粘贴的内容，表情转换
          const content = textToEmojiImage(text);

          const { childNodes } = document.getElementById(this.inputId);

          // 获取当前所有的元素字符串
          let arr = [];
          for (const item of childNodes) {
            if (item.nodeName === "#text") {
              arr.push(item.nodeValue);
            } else {
              arr.push(item.outerHTML);
            }
          }

          // 插入自定义内容并触发撤销历史
          document.execCommand("insertHTML", false, content);

          // 不为空，不显示占位符
          this.handlePlaceholderVisibleSet();
        }, 10);
      }
    },
  },
};
</script>
<style lang="scss">
.comChatSend {
  position: relative;
  min-height: 91px;
  border-top: 1px solid #eee;
  background: #fff;
  padding: 14px;
  box-sizing: border-box;

  &.dialog {
    padding-left: 50px;
    min-height: 50px;
    border-top: 0;

    > .btns {
      width: 40px;
      left: 0;
    }

    > span {
      left: 50px;
    }

    > button {
      right: 0;
      bottom: -25px;
    }

    &::after {
      content: "";
      display: block;
      position: absolute;
      height: 1px;
      left: 0px;
      right: 0;
      bottom: 8px;
      border-bottom: 1px dashed #ddd;
    }

    #sendMessageInput2 {
      padding-left: 0;
    }
  }

  .menuBox {
    padding: 0 10px;
    border-radius: 8px;
    min-width: 360px;
    padding: 10px 20px;
    background: none;
    box-shadow: none;
    border: none;

    .menu-content {
      width: 160px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }

    .menu-two-box {
      position: absolute;
      left: 160px;
      top: 0;
      min-width: 160px;
      opacity: 0;
      background: #ffffff;
      padding: 0 10px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);

      .menu-two-item {
        width: 100%;
        padding: 10px 0;
      }
    }

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      padding: 10px;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        width: calc(100% - 20px);
        height: 1px;
        background: #f0f0f0;
      }

      &:hover {
        .menu-two-box {
          opacity: 1;
        }
      }

      &:last-child {
        border: none;
        &::after {
          background: none;
        }
      }

      .icon {
        max-height: 16px;
      }

      a {
        padding: 0;

        &:hover {
          background: none;
        }
      }
    }
  }

  > span {
    color: #999;
    font-size: 12px;
    position: absolute;
    top: 30px;
    left: 14px;
    line-height: 50px;
  }

  > .btns {
    height: 24px;
    display: flex;
    margin: 0;
    padding: 0;
    margin-bottom: 6px;

    > div {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 26px;

      img {
        display: block;
      }

      &.emoji {
        &:hover {
          > div {
            display: block;
          }
        }
      }
    }
  }
  #sendMessageInput,
  #sendMessageInput2 {
    max-height: 200px;
    overflow: scroll;
    width: 100%;
    min-height: 90px;
    white-space: pre-wrap;
    line-height: 20px;
    position: relative;
    z-index: 1;


    > img, > a img {
      vertical-align: middle;
      width: 18px;
    }

    picture {
      position: relative;

      &::before,
      &::after {
        content: "";
        position: absolute;
        display: block;
        top: 0;
        height: 100%;
        width: 50%;
        z-index: 1;
      }

      &::before {
        left: 0;
      }

      &::after {
        right: 0;
      }

      > img {
        vertical-align: middle;
        width: 18px;
      }
    }
  }

  #sendMessageInput2 {
    padding-right: 10px;
    min-height: 50px;
  }

  > button {
    position: absolute;
    right: 16px;
    bottom: 13px;
    padding: 0 13px;
    display: block;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
    border-radius: 4px;
    color: #fff;
    background-color: #3369fe;
    text-align: center;
    border: 1px solid #3369fe;
    cursor: pointer;
    z-index: 2;
  }

  .readBurnTimeTip {
    position: absolute;
    right: 76px;
    bottom: 13px;
    width: 20px;
    height: 24px;
    z-index: 2;
    cursor: pointer;

    img {
      height: 22px;
    }
    span {
      position: absolute;
      right: -3px;
      bottom: 2px;
      font-size: 8px;
      text-align: left;
      width: 16px;
      white-space: nowrap;
    }
  }
}
</style>
