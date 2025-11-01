import _ from "lodash";
import i18n from "@/assets/lang/i18n";
import { emojiObj, emojiTextList } from "/public/emoji";

// icon
import doc from "@/assets/images/message/file-doc.png";
import images from "@/assets/images/message/file-image.png";
import video from "@/assets/images/message/file-video.png";
import mp3 from "@/assets/images/message/file-mp3.png";
import pdf from "@/assets/images/message/file-pdf.png";
import ppt from "@/assets/images/message/file-ppt.png";
import xls from "@/assets/images/message/file-xls.png";
import zip from "@/assets/images/message/file-zip.png";
import unknow from "@/assets/images/message/file-unknow.png";

/**
 * 创建唯一id
 */
export const generateUniqueId = () => {
    // 生成一个以非零数字开头的随机 11 位数字
    const firstDigit = Math.floor(Math.random() * 9) + 1; // 生成 1-9 的随机数
    const remainingDigits = Math.floor(Math.random() * 1000000000); // 生成后 10 位随机数
    const uniqueId =
        firstDigit.toString() + remainingDigits.toString().padStart(10, "0"); // 合并并填充
    return uniqueId; // 返回 11 位数字
};

/**
 * 获取文件icon
 */
export const getFileIcon = (fileName) => {
    if (!fileName) return "";
    let type = _.last(fileName.split(".")).toLowerCase();
    if (type.indexOf("doc") > -1) {
        return doc;
    } else if (type.indexOf("png") > -1) {
        return images;
    } else if (type.indexOf("jpg") > -1) {
        return images;
    } else if (type.indexOf("mp3") > -1) {
        return mp3;
    } else if (type.indexOf("pdf") > -1) {
        return pdf;
    } else if (type.indexOf("ppt") > -1) {
        return ppt;
    } else if (type.indexOf("xls") > -1) {
        return xls;
    } else if (type.indexOf("zip") > -1) {
        return zip;
    } else if (["mp4", "mov", "wmv", "m4v", "avi", "flv"].includes(type)) {
        return video;
    } else {
        return unknow;
    }
};

/**
 * Get file's suffix
 */
export const getFileSuffix = (chatType, fileUrl) => {
    let suffix = fileUrl.slice(fileUrl.lastIndexOf("."));

    if (
        [1, 2, 3, 9].includes(chatType) &&
        (suffix.length < 2 || suffix.length > 7)
    ) {
        switch (chatType) {
            case 1:
                suffix = ".png";
                break;
            case 2:
                suffix = ".mp4";
                break;
            case 3:
                suffix = ".png";
                break;
            case 9:
                suffix = ".gif";
                break;
            default:
            // 默认情况，但在这里其实不需要做什么，因为前面的条件已经限定了 chatType 的值
        }
    } else {
        suffix = "";
    }

    return suffix;
};

export const textToEmojiImage = (str) => {
    if (typeof str !== "string") return str;
    let value = str;
    let arr = str.match(/\[(.+?)\]/g);
    arr = Array.from(new Set(arr));

    for (const item of arr) {
        if (emojiTextList.includes(item)) {
            value = value.replaceAll(
                item,
                `<img src="${require(`/public/images/emoji/${emojiObj[item]}.png`)}" data-key="${item}" class="uuid">`
            );
        }
    }
    while (value.includes('class="uuid"')) {
        value = value.replace('class="uuid"', `class="${generateUniqueId()}"`);
    }

    return value;
};

export const textEmojiCount = (str) => {
    let value = str;
    let arr = value.match(/\[(.+?)\]/g);
    let count = arr.length;
    arr = Array.from(new Set(arr));

    for (const item of arr) {
        if (emojiTextList.includes(item)) {
            value = value.replaceAll(item, "");
        }
    }
    count += value.length;
    return count;
};

/**
 * 表情图片替换
 */
export const textToEmojiText = (str) => {
    return str.replace(/<img[^>]+data-key="(\[.*?\])"[^>]*>/g, "$1");
};

export const createHash = (hashLength, num = 36) => {
    // 默认长度 24
    return Array.from(Array(Number(hashLength) || 24), () =>
        Math.floor(Math.random() * num).toString(num)
    ).join("");
};

export const longToNum = (value) => {
    if (typeof value === "number") {
        return value;
    }
    const high = _.get(value, "high") || 0;
    let low = _.get(value, "low") || 0;
    if (low === 0) {
        low = "";
    }

    return Number(high.toString() + low);
};

export const chatGroupDataFormat = (arr, myId) => {
    const unreadObj = {};
    const muteIds = [];

    let list = [];

    try {
        list = arr
            .filter(
                (item) =>
                    item &&
                    Boolean(item.group) &&
                    (item.group.name !== "群通知" ||
                        item.GroupID === "invitation")
            )
            .map((item) => {
                const count = item.group.memberCount
                    ? longToNum(item.group.memberCount)
                    : 0;

                if (item.Count) {
                    unreadObj[item.GroupID + "group"] = {
                        time: item.sendTime,
                        count: item.Count,
                        unreadMsgID: Number(item.MsgID),
                    };
                }

                if (item.bfDisturb) {
                    muteIds.push(item.GroupID + "group");
                }

                return {
                    bfTop: Boolean(item.bfTop),
                    content: item.content,
                    count,
                    id: item.GroupID,
                    msgType: item.msgType,
                    name: item.group.name,
                    pic: item.group.pic,
                    sendTime: item.sendTime,
                    sendUserName:
                        myId === item.sendUid
                            ? ""
                            : `${_.get(item, "sendMember.user.nickName")}: `,
                    type: "group",
                };
            });
    } catch (e) {
        console.log("//// chatGroupDataFormat", e);
        list = [];
    }

    return { unreadObj, list, muteIds };
};

export const chatFriendDataFormat = (arr, myId, idsTop) => {
    const unreadObj = {};
    let list = [];

    try {
        list = arr
            .filter((item) => item && Boolean(item.UserID))
            .map((item) => {
                if (item.Count) {
                    unreadObj[item.GroupID + "friend"] = {
                        time: item.sendTime,
                        count: item.Count,
                        unreadMsgID: Number(item.MsgID),
                    };
                }

                return {
                    bfTop: false,
                    content: item.content,
                    id: item.UserID,
                    identify: item.sendUser.identify,
                    msgType: item.msgType,
                    name: item.sendUser.nickName,
                    pic: item.sendUser.icon,
                    sendTime: item.sendTime,
                    sendUserName:
                        myId === item.sendUid
                            ? ""
                            : `${item.sendUser.nickName}: `,
                    type: "friend",
                };
            });
    } catch (e) {
        console.log("//// chatGroupDataFormat", e);
        list = [];
    }

    return { unreadObj, list };
};

/**
 * 判断时间戳是否是今天、昨天、前天
 * 结果： 0:今天、1昨天、2前天
 */
const isRecentDay = (timestamp) => {
    // 将时间戳转换为Date对象
    const date = new Date(timestamp);

    // 获取当前日期（今天）的Date对象
    const today = new Date();

    // 设置today的时间为00:00:00，以便只比较日期部分
    today.setHours(0, 0, 0, 0);

    // 设置date的时间也为00:00:00，以便与today进行比较
    date.setHours(0, 0, 0, 0);

    // 计算时间差（以天为单位）
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    return diff;
};

export const chatPageDateformat = (timestamp) => {
    if (!timestamp) return;
    // 转换时间戳为Date对象
    const date = new Date(Number(timestamp));

    // 获取当前日期
    const now = new Date();

    // 计算年份、月份、日期等
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // 计算时间差
    const diff = isRecentDay(Number(timestamp));

    if (diff === 0) {
        return i18n.t("今天");
    } else if (diff === 1) {
        return i18n.t("昨天");
    } else if (diff === 2) {
        return i18n.t("前天");
    } else if (year === now.getFullYear()) {
        return i18n.t("m月d日").replace("$m", month).replace("$d", day);
    } else {
        return i18n
            .t("y年m月d日")
            .replace("$y", year)
            .replace("$m", month)
            .replace("$d", day);
    }
};

export const freeTime = (value, g = "y-m-d") => {
    let time = new Date(Number(value));
    let y = time.getFullYear();
    let m = time.getMonth() + 1;
    let d = time.getDate();
    let h = time.getHours();
    let i = time.getMinutes();
    let s = time.getSeconds();
    return g
        .replace("y", y)
        .replace("m", m > 9 ? m : "0" + m)
        .replace("d", d > 9 ? d : "0" + d)
        .replace("h", h > 9 ? h : "0" + h)
        .replace("i", i > 9 ? i : "0" + i)
        .replace("s", s > 9 ? s : "0" + s);
};

export const chatTime = (onlineStatusUpdateTime, text) => {
    if (!onlineStatusUpdateTime) return "";
    let dateStr = new Date().toLocaleDateString();
    let nowDateTime = new Date(dateStr).getTime(); // 当日0点时间
    let duringT = nowDateTime - onlineStatusUpdateTime; // 如果大于0 是今天
    let hour = Math.floor(duringT / 60 / 60 / 1000);
    let toYearTime = new Date(`${dateStr.substr(0, 4)}/1/1 00:00:00`).getTime();
    if (onlineStatusUpdateTime < toYearTime) {
        return freeTime(onlineStatusUpdateTime, "y/m/d h:i");
    } else if (duringT <= 0) {
        return freeTime(onlineStatusUpdateTime, "h:i");
    } else if (hour < 24) {
        return "昨天" + freeTime(onlineStatusUpdateTime, "h:i");
    } else {
        return freeTime(onlineStatusUpdateTime, "m/d h:i");
    }
};

export const chatDate = (onlineStatusUpdateTime, text) => {
    if (!onlineStatusUpdateTime) return "";
    let dateStr = new Date().toLocaleDateString();
    let nowDateTime = new Date(dateStr).getTime(); //当日0点时间
    let duringT = nowDateTime - onlineStatusUpdateTime; //如果大于0 是今天
    let hour = Math.floor(duringT / 60 / 60 / 1000);
    let toYearTime = new Date(`${dateStr.substr(0, 4)}/1/1 00:00:00`).getTime();
    if (onlineStatusUpdateTime < toYearTime) {
        return freeTime(onlineStatusUpdateTime, "y/m/d");
    } else if (duringT <= 0) {
        return freeTime(onlineStatusUpdateTime, "m/d");
    } else if (hour < 24) {
        return freeTime(onlineStatusUpdateTime, "m/d");
    } else {
        return freeTime(onlineStatusUpdateTime, "m/d");
    }
};

/**
 * 格式化消息显示的时间
 */
export const formatTimeStamp = (timestamp) => {
    const date = new Date(Number(timestamp));
    // 获取小时数（0-23）
    const hours = date.getHours();
    // 将小时数转换为12小时制（如果小时数大于12，则减去12）
    const hour12 = hours % 12 || 12; // 使用逻辑或确保0小时变为12小时
    const minutes = date.getMinutes().toString().padStart(2, "0"); // 确保分钟数是两位数
    const isChina = ["zh", "zh-tw", "zh-cn"].includes(i18n.locale);
    let lang = isChina ? ["上午", "下午"] : ["AM", "PM"];
    const ampm = hours < 12 ? lang[0] : lang[1];
    return isChina
    ? `${ampm} ${hour12}:${minutes}`
    : `${hour12}:${minutes} ${ampm} `;
}

/**
 * 替换字符串中的指定字符
 */
export const replaceString = (str, searchChar, replaceChar) => {
    //  给包含正则表达式的特殊字符进行转义
    let escapedSearchChar = searchChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return str.replace(new RegExp(escapedSearchChar, "g"), replaceChar);
};

/**
 * 替换链接
 */
export const repalceLink = (text) => {
    if (!text || !text.replace) return "";
    const regex = /(https?:\/\/[^\s]+)/g; // 匹配http或https开头的链接
    return text.replace(regex, '<a href="$1" target="_blank">$1</a>');
};

/**
 * 替换链接 没有前缀
 */
export const repalceLinkNoPrefix = (text) => {
    const urlPattern = /([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?/g;

    return text.replace(urlPattern, (url) => {
        return `<a href="${`https://${url}`}" target="_blank" >${url}</a>`;
    });
};

export const strIsSafe = (str) => {
    if (typeof str !== "string") {
        return true;
    }

    const strNew = str.replace(/\s*/g, "");

    return (
        !strNew.includes("eval(") &&
        !strNew.includes("child_process") &&
        !strNew.includes(".exec") &&
        !strNew.includes("atob(")
    );
};

/**
 * 对象比较更新
 */
export const objectComparisonUpdate = (updatedObject, value) => {
    let isUpdate = false;
    const obj = _.cloneDeep(updatedObject);

    for (const key of Object.keys(value)) {
        if (obj[key] !== value[key]) {
            isUpdate = true;
            obj[key] = value[key];
        }
    }

    if (isUpdate) {
        return obj;
    }

    return null;
};

export const setMaxLengthStr = (str, len = 10) => {
    if (!str || str.length <= len) {
        return str;
    }
    return `${str.substring(0, len)}...`;
};

export const copyToClipboard = (text) => {
    // 创建一个临时的 textarea 元素
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // 将 textarea 添加到文档中
    document.body.appendChild(textarea);

    // 选中 textarea 中的文本
    textarea.select();

    // 复制文本到剪贴板
    document.execCommand("copy");

    // 移除 textarea 元素
    document.body.removeChild(textarea);
};

/**
 * 文件大小格式化
 */
export const fileSizeFormat = (num) => {
    let size = Number(num);
    // 不能转换为数字的字符串一律原样返回出去
    if (Number.isNaN(size)) {
        return num;
    }

    if (size < 1024) {
        return Number(size.toFixed(2)) + " b";
    }

    const kb = size / 1024;

    if (kb > 1024) {
        const mb = kb / 1024;
        return Number(mb.toFixed(2)) + " mb";
    }

    return Number(kb.toFixed(2)) + " kb";
};

// 获取at的群组成员
export const atMemberListGet = (list, name) => {
    let user = list.find((item) => {
        return item.nickName == name || item.name == name;
    });
    if (user) {
        user.uid = user.id;
    }
    return user;
};

// 消息类型枚举
export const enumMsgType = {
    text: 0, //文字+表情
    image: 1, //图片消息
    voice: 2, //语音消息
    video: 3, //视频消息
    address: 4, //地址
    shareCard: 5, //分享
    system: 6, //系统消息
    file: 7, //文件消息
    groupNotice: 8, //群公告
    gif: 9, //GIF消息
    redEnvelope: 10, //红包
    robot: 11, //机器人
    dice: 12, //骰子
    error: 99, //解密失败
    transfer: 13, // 转账
    payments: 14, // 转账收款
    animatedGame: 18, // 扑克游戏
};

// 是否是苹果电脑
export const isMac = process.platform === "darwin";

/**
 * 对象内的long 类型，转换成number 引用修改
 */
export const fnLongToNumInObj = (obj) => {
    // 如果是数组
    if (Array.isArray(obj)) {
        // 如果数组大于0，并且内容是对象
        if (obj.length > 0 && typeof obj[0] === "object") {
            for (const i in obj) {
                // 如果是long类型，则直接转换
                if (!Array.isArray(obj[i]) && obj[i].low !== undefined) {
                    obj[i] = Number(obj[i]);
                } else {
                    fnLongToNumInObj(obj[i]);
                }
            }
        }
    } else {
        // 对象属性遍历
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "object") {
                // 如果是long类型，则直接转换
                if (!Array.isArray(obj[key]) && obj[key].low !== undefined) {
                    obj[key] = Number(obj[key]);
                } else {
                    fnLongToNumInObj(obj[key]);
                }
            }
        }
    }
};


let timeD = 0

export const getNow = () => {
    const now = new Date().getTime()
    return now + timeD
}

export const setTimeD = (value) => {
    // 计算ntp时间和本地的时间差
    timeD = value;
}


// 获取url域名后的字符
export const getRemainingUrl = (url) => {
    try {
        if(!url) return url;
        var parsedUrl = new URL(url);
        var protocol = parsedUrl.protocol + "//";
        var hostname = parsedUrl.hostname;
        var port = parsedUrl.port;
        var remainingUrl = url.replace(
            protocol + hostname + (port ? ":" + port : ""),
            ""
        );
        return remainingUrl; 
    } catch (error) {
        console.error(error, url)
        return ""
    }
   
}

// 补全url的协议
export const completionUrl = (url) => {
  // 如果 URL 没有协议，但有 www.，默认补上 https://
  if (!url.match(/^(http|https):\/\//i)) {
    if (url.startsWith("www.")) {
      url = "https://" + url;
    } else if (!url.includes("://")) {
      url = "https://" + url;
    }
  }
  return url
}

/**
 * 判断一个值是否为 null、undefined 或 NaN
 * @param {*} value - 待判断的值
 * @returns {boolean} 是则返回 true，否则返回 false
 */
export const isNUN = (value) => {
  // null 或 undefined 直接判断
  if (value === null || value === undefined) {
    return true;
  }
  // NaN 需用 is
  // NaN() 判断（因为 NaN !== NaN）
  if (typeof value === 'number' && isNaN(value)) {
    return true;
  }
  // 其他情况均为有效值
  return false;
}

 /**
 * 频道成员排序方法：先按memberType升序，再按lastTime降序（最近的排前面）
 * @param {Array} list - 需要排序的数组
 * @returns {Array} 排序后的新数组（不修改原数组）
 */
export const channelMemberSort = (list) => {
      // 深拷贝数组，避免修改原数组
      const sortedList = [...list];
      
      sortedList.sort((a, b) => {
        // 1. 先按 memberType 升序排序
        if (a.memberType !== b.memberType) {
          // 处理可能的 undefined 情况（确保 undefined 排在最后）
          if (a.memberType === undefined) return 1;
          if (b.memberType === undefined) return -1;
          return a.memberType - b.memberType; // 数字类型升序
        }
        
        // 2. memberType 相同则按 lastTime 降序排序（最近的排前面）
        const timeA = a.userInfoDTO?.lastTime || 0; // 处理可能的 undefined
        const timeB = b.userInfoDTO?.lastTime || 0;
        
        // 时间戳大的排前面（降序）
        return timeB - timeA;
      });
      
      return sortedList;
}