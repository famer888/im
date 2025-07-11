import i18n from "@/assets/lang/i18n";
import { emojiObj } from "/public/emoji";
import { strIsSafe } from "@/utils/base";

/**
 * html字符串 按文本，换行，图片，a标签，h4标签 拆分为对象数组
 */
export const splitHtmlStringToObjects = (htmlString) => {
    // 创建一个临时的 DOM 元素来解析 HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    // 用来存放拆分后的结果
    const result = [];

    // 遍历子节点
    Array.from(tempDiv.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // 如果是文本节点，添加对象
            const textContent = node.textContent;
            if (textContent) {
                result.push({ type: "text", content: textContent });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "BR") {
                // 如果是换行符，添加换行对象
                result.push({ type: "break" });
            } else if (node.tagName === "IMG") {
                // 如果是图片，添加对象包含 src 属性
                result.push({
                    type: "image",
                    src: node.src,
                    key: node.dataset.key,
                });
            } else if (node.tagName === "A") {
                // 如果是链接，添加对象包含 href 和文本内容
                const href = node.getAttribute("href");
                const type = node.getAttribute("type");
                const linkText = node.textContent.trim();
                if(type === 'customLink' && strIsSafe(linkText)) {
                    const linkText = node.innerHTML.trim();
                    result.push({
                        type: "customLink",
                        href: href,
                        content: linkText,
                    });
                } else if(linkText) {
                    result.push({
                        type: "link",
                        href: href,
                        content: linkText,
                    });
                }
            } else {
                // 处理其他元素（这里忽略其他元素）
                const textContent = node.textContent.trim();
                if (textContent) {
                    result.push({ type: "text", content: textContent });
                }
            }
        }
    });

    return result;
};

/**
 * 定时删除时间列表
 */
export const rcheduleDeletionTimeList = [
    { name: "5" + i18n.t("秒"), value: 5 },
    { name: "10" + i18n.t("秒"), value: 10 },
    { name: "30" + i18n.t("秒"), value: 30 },
    { name: "1" + i18n.t("分钟"), value: 60 },
    { name: "1" + i18n.t("小时"), value: 60 * 60 },
    { name: "6" + i18n.t("小时"), value: 60 * 60 * 6 },
    { name: "12" + i18n.t("小时"), value: 60 * 60 * 12 },
    { name: "1" + i18n.t("天"), value: 60 * 60 * 24 },
    { name: "3" + i18n.t("天"), value: 60 * 60 * 24 * 3 },
    { name: "7" + i18n.t("天"), value: 60 * 60 * 24 * 7 },
];

/**
 * 定时删除时间文本 获取
 */
export const fnRcheduleDeletionTimeTextGet = (msgCancelTime) => {
    const info = rcheduleDeletionTimeList.find(
        (item) => item.value == msgCancelTime
    );
    return info ? info.name : "";
};

/**
 * 字符串分隔at，返回数组
 */
export const strSplitAt = (htmlStr, splitList) => {
    const str = htmlStr.replace(/ /g, " ");

    let list = [];

    // 按拆分列表先进行拆分
    if (splitList && splitList.length > 0) {
        list = splitStringByAtList(str, splitList);
    } else {
        list.push(str);
    }

    let parts = [];

    // 循环拆分的内容，要是按拆分列表拆分的内容直接添加，否则继续判断拆分
    for (const item of list) {
        if (splitList.includes(item)) {
            parts.push(item);
        } else {
            // 换行拆分数组
            let arrBrSplite = [];

            // 如果有 \n 先进行拆分
            if (item.includes("\n")) {
                arrBrSplite = item.split(/(\n)/);
            } else {
                arrBrSplite.push(item);
            }

            // 再对@进行拆分
            for (const n of arrBrSplite) {
                // 如果有@，则可能需要再次拆分
                if (n.includes("@")) {
                    // 使用正则表达式分隔字符串，同时保留 @ 和前面的空格
                    const result = n.split(/(\s+|(?=@))/).filter(Boolean);
                    const resultNew = [];

                    for (let i = 0; i < result.length; i++) {
                        const strBefore = resultNew[resultNew.length - 1];

                        // 如果@前面为非空格字符，向前合并
                        if (
                            i > 0 &&
                            result[i][0] === "@" &&
                            ![" ", "@"].includes(
                                strBefore[strBefore.length - 1]
                            ) &&
                            strBefore[0] !== "@"
                        ) {
                            resultNew[resultNew.length - 1] += result[i];
                        } else {
                            resultNew.push(result[i]);
                        }
                    }

                    parts = [...parts, ...resultNew];
                } else {
                    parts.push(n);
                }
            }
        }
    }
    return parts;
};

/**
 * 按At列表对字符串进行分割
 */
const splitStringByAtList = (inputString, splitList) => {
    const strList = [];
    let inputStringNew = inputString;
    let inputStringEnd = inputString;

    for (const strAt of splitList) {
        let needSplit = true;

        while (needSplit) {
            needSplit = false;

            // 开始索引
            const indexStart = inputStringEnd.indexOf(strAt);

            // 结束索引
            const indexEnd = indexStart + strAt.length;

            if (indexStart !== -1) {
                // at在最前面或前面有空格
                const charBefore = inputStringEnd.slice(
                    indexStart - 1,
                    indexStart
                );

                if (
                    indexStart === 0 ||
                    (charBefore.length === 1 &&
                        charBefore.trim().length === 0) ||
                    charBefore[0] === "@"
                ) {
                    const charAfter = inputStringEnd.slice(
                        indexEnd,
                        indexEnd + 1
                    );

                    // 最后面为结束或者有空格
                    if (
                        indexEnd === inputStringEnd.length ||
                        (charAfter.length === 1 &&
                            charAfter.trim().length === 0)
                    ) {
                        // 如果前面有字符串，则添加
                        if (indexStart !== 0) {
                            strList.push(inputStringEnd.slice(0, indexStart));
                        }

                        // 添加at的内容
                        strList.push(strAt);

                        // 移除已添加的
                        inputStringNew = inputStringNew.slice(indexEnd);
                    }
                }
            }

            // 确认还有没有相同的需要后续分隔
            inputStringEnd = inputStringEnd.slice(indexEnd);

            if (inputStringEnd.indexOf(strAt) !== -1) {
                needSplit = true;
            }
        }
    }

    if (inputStringNew !== "") {
        strList.push(inputStringNew);
    }

    return strList;
};

/**
 * 字符串替换为表情图片标签
 */
export const strReplaceEmojiImgLabel = (inputString) => {
    let htmlString = inputString;

    // 基本处理
    htmlString = htmlString.replace(/\n/g, "<br>\n");
    // htmlString = htmlString.replace(/ /g, "&nbsp;");
    htmlString = htmlString.replace(/<img&nbsp;/g, "<img ");

    // 表情文字 替换成图片
    const regex = /\[(.+?)\]/g;
    const arr = _.uniq(htmlString.match(regex));

    if (arr) {
        for (const item of arr) {
            if (emojiObj[item]) {
                htmlString = htmlString.replaceAll(
                    item,
                    `<img src="${require("/public/images/emoji/" +
                        emojiObj[item] +
                        ".png")}" data-key="${item}" >`
                );
            }
        }
    }

    return htmlString;
};
