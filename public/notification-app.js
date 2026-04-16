import { emojiObj, emojiTextList } from "./emoji.js";

const groupIcon = "./images/default_chat_icon.png";
const friendIcon = "./images/logo-58.png";
const channelIcon = "./images/channel-notice.webp";
const closeIcon = "./images/notification/close.png";
const groupChatIcon = "./images/notification/group_chat_icon.png";
const ipcRenderer = window.electronAPI && window.electronAPI.ipcRenderer;

const msgTypeIcon = {
  1: "msg_image",
  2: "msg_voice",
  3: "msg_video",
  5: "msg_name_card",
  7: "msg_file",
  9: "msg_image",
  10: "msg_red_pack",
  12: "msg_dice",
  18: "msg_dice",
};
const msgTypeName = {
  1: "图片",
  2: "语音",
  3: "视频",
  5: "名片",
  7: "文件",
  9: "动图",
  10: "红包",
  12: "骰子",
  18: "扑克牌",
};

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeSrc(url) {
  if (typeof url !== "string") return "";
  if (/^(?:\.\/|local-resource:|app:|file:)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

let debounceTimeout;
function debounce(func, wait) {
  return function (...args) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.onload = () => {
  console.log("onload---");
  htmlAndWindowHeightSync();
};

ipcRenderer.on("showList", (event, listData) => {
  initAutoClose();
  const listContainer = document.getElementById("list-container");
  if (existsInReply()) return;

  let html = "";
  const msglist = listData.slice(-3);
  msglist.forEach((item) => {
    const isGroup = item.type === "group";
    const defaultIcon =
      { friend: friendIcon, group: groupIcon, channel: channelIcon }[
        item.type
      ] || friendIcon;
    const iconSrc = `./images/notification/${msgTypeIcon[item.msgType]}.png`;

    html += `<li id="notice-item-${escapeHtml(item.id)}" class="list-item">
              <div class="info-box">
                <div class="img-box">
                  <img src="${safeSrc(item.icon) || defaultIcon}" class="avatar" />
                </div>
                <div class="info">
                  <div class="nickname-box">
                    ${isGroup ? `<img class="group-chat-icon" src="${groupChatIcon}" />` : ""}
                    <span class="nickname">${escapeHtml(item.name)}</span>
                  </div>
                  <div class="text-content">
                    ${
                      item.msgType in msgTypeIcon
                        ? `
                          <span class="user-name">${item.userName ? escapeHtml(item.userName) + ":" : ""}</span>
                          <img class="msg-type-icon" src="${iconSrc}" />
                          <span class="msg-type-name">${msgTypeName[item.msgType]}</span>
                        `
                        : `
                         ${isGroup && item.userName ? `<span class="user-name">${escapeHtml(item.userName)}:</span>` : ""}
                         <span class="msg-value">${handleMsgContent(item.content)}</span>
                        `
                    }
                  </div>
                </div>
                <img src="${closeIcon}" class="close-item"/>
                <button class="reply-button" style="${item.showReplyIcon ? "" : "display: none;"}">回复</button>
              </div>
              <div class="reply-form">
                <textarea class="reply-input" name="myTextarea" placeholder="Ctrl+Enter发送" rows="1"></textarea>
                <button class="reply-form-button">发送</button>
              </div>
            </li>`;
  });

  listContainer.innerHTML = html;

  msglist.forEach((item) => {
    const listItem = document.getElementById(`notice-item-${item.id}`);
    if (!listItem) return;

    listItem.addEventListener("click", (event) => goChat(item));

    const closeItem = listItem.querySelector(".close-item");
    closeItem.addEventListener("click", (event) => {
      event.stopPropagation();
      closeNotice(item);
    });

    const replyForm = listItem.querySelector(".reply-form");
    replyForm.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const replyButton = listItem.querySelector(".reply-button");
    const replyInput = listItem.querySelector(".reply-input");
    replyButton.addEventListener("click", (event) => {
      event.stopPropagation();
      replyForm.style.display = "flex";
      replyButton.style.display = "none";
      setTimeout(() => {
        replyInput.focus();
      }, 100);
    });

    replyInput.addEventListener("input", () => {
      replyInput.style.height = "auto";
      replyInput.style.height = replyInput.scrollHeight + "px";
    });

    replyInput.addEventListener("keydown", function (event) {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        const replyText = replyInput.value;
        sendMsg(item, replyText);
      }
    });

    const sendButton = listItem.querySelector(".reply-form-button");
    sendButton.addEventListener("click", () => {
      const replyText = replyInput.value;
      sendMsg(item, replyText);
    });
  });

  updateHidAllShow(listData.length >= 2);
});

function existsInReply() {
  const elements = document.querySelectorAll(`.reply-form`);
  for (let element of elements) {
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display !== "none") {
      return true;
    }
  }
  return false;
}

function htmlAndWindowHeightSync() {
  const sendPageHeightChange = debounce((height) => {
    ipcRenderer.send("noticePageHeightChange", { height });
  }, 20);

  const element = document.getElementById("notice-main");
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const newHeight = entry.contentRect.height;
      console.log("Element height changed:", newHeight);
      sendPageHeightChange(newHeight);
    }
  });
  resizeObserver.observe(element);
}

function initAutoClose() {
  const noticeMainDom = document.getElementById("notice-main");

  const clearTimer = () => {
    clearTimeout(window.timerAutoClose);
    window.timerAutoClose = null;
  };

  const pollingClose = () => {
    clearTimer();
    if (existsInReply()) return;
    window.timerAutoClose = setTimeout(() => {
      let opacity = noticeMainDom.style.opacity;
      opacity -= 0.2;
      noticeMainDom.style.opacity = opacity;
      if (opacity <= 0) {
        hideAllNotice();
      } else {
        pollingClose();
      }
    }, 1000);
  };

  clearTimer();
  noticeMainDom.style.opacity = 1;
  setTimeout(() => {
    pollingClose();
  }, 2000);

  noticeMainDom.addEventListener("mouseenter", function (event) {
    console.log("mouseenter--");
    noticeMainDom.style.opacity = 1;
    clearTimer();
  });

  noticeMainDom.addEventListener("mouseleave", function (event) {
    console.log("mouseleave--");
    pollingClose();
  });
}

function sendMsg(item, value) {
  ipcRenderer.send("notificationReply", {
    ...item,
    value,
  });
  closeNotice(item);
}

function closeNotice(item) {
  var liToRemove = document.getElementById(`notice-item-${item.id}`);

  if (liToRemove) {
    liToRemove.parentNode.removeChild(liToRemove);
  }
  console.log("closeClick--", item);
  ipcRenderer.send("noticeCloseItem", { id: item.id });
}

function hideAllNotice() {
  const listContainer = document.getElementById("list-container");
  listContainer.innerHTML = "";
  updateHidAllShow(false);
  ipcRenderer.send("hidAll");
}

function updateHidAllShow(state) {
  const hidAllDom = document.getElementById("hidAll");
  hidAllDom.style.display = state ? "block" : "none";
  if (state) {
    hidAllDom.addEventListener("click", (event) => hideAllNotice());
  }
}

function goChat(item) {
  console.log("goChat--4-", item);
  ipcRenderer.send("noticeGoChat", item);
  hideAllNotice();
}

function handleMsgContent(contentStr) {
  if (typeof contentStr !== "string") return escapeHtml(contentStr);
  let str = contentStr.replaceAll("!@#", "");
  return textToEmojiImage(str);
}

function textToEmojiImage(str) {
  const escaped = escapeHtml(str);
  let value = escaped;
  const arr = Array.from(new Set(str.match(/\[(.+?)\]/g)));

  for (const item of arr) {
    if (emojiTextList.includes(item)) {
      value = value.replaceAll(
        escapeHtml(item),
        `<img class="emoji-item" src="${`./images/emoji/${emojiObj[item]}.png`}">`
      );
    }
  }
  return value;
}
