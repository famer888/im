import { textToEmojiText } from "@/utils/base";
import { copyText } from "@/utils/clipboard";

/**
 * 发送的文本消息 获取
 */
export const fnTextSendInfoGet = (htmlString) => {
    // 单条消息最大字数，表情算1，换行算1
    const msgMaxSize = 1500;
    const tempDiv = document.createElement("div"); // 创建一个临时的 div 元素
    tempDiv.innerHTML = htmlString; // 将 HTML 字符串赋值给该元素
    // 纯文本
    const text = tempDiv.textContent || tempDiv.innerText || ""; // 提取文本内容

    // 包含的图片
    const imgTags = htmlString.match(/<img\b[^>]*>/gi) || [];

    // 包含的换行
    const brTags = htmlString.match(/<br class="[0-9]*">/gi) || [];

    // 字符串数组
    const strArr = [];

    // 消息超过 1500 则需要拆分为多个 后续依次发送
    if (text.length + imgTags.length > msgMaxSize) {
        // 标签加上索引，进行排序
        let tags = imgTags.map((str) => {
            return { index: htmlString.indexOf(str), str };
        });

        tags = [
            ...tags,
            ...brTags.map((str) => {
                return { index: htmlString.indexOf(str), str };
            }),
        ];

        // 排序
        tags = _.orderBy(tags, ["index"], ["asc"]);

        // 依次替换记录索引
        const indexList = [];

        let htmlStringNew = htmlString;
        for (const item of tags) {
            indexList.push(htmlStringNew.indexOf(item.str));
            htmlStringNew = htmlStringNew.replace(item.str, " ");
        }

        // 文本拆分，按记录的索引还原 空格为标签
        const pageCount = Math.ceil(htmlStringNew.length / msgMaxSize);

        for (let i = 0; i < pageCount; i++) {
            // 截取
            let str = htmlStringNew.slice(i * msgMaxSize, (i + 1) * msgMaxSize);

            // 按索引去替换
            for (let j = 0; j < indexList.length; j++) {
                const index = indexList[j];
                if (index >= i * msgMaxSize && index <= (i + 1) * msgMaxSize) {
                    const indexNew = index - i * msgMaxSize;
                    str =
                        str.substring(0, indexNew) +
                        tags[j].str +
                        str.substring(indexNew + 1);
                }
            }

            strArr.push(str);
        }
    } else {
        strArr.push(htmlString);
    }

    // 返回处理后的 字符串列表
    return strArr.map((str) => {
        // 替换换行
        let content = str.replace(/<br class="[0-9]*">/g, "\n");
            content = content.replace(/&nbsp;/g, ' ');

        // 替换表情
        for (const imgStr of imgTags) {
            if (content.includes(imgStr)) {
                content = content.replace(imgStr, imgStr.match(/\[.*?\]/)[0]);
            }
        }

        return {
            type: "text",
            values: {
                chatType: 0,
                content,
            },
        };
    });
};

/**
 * 表情图片替换为文本
 */
export const fnEmojiToText = (htmlString) => {
    const tempDiv = document.createElement("div"); // 创建一个临时的 div 元素
    tempDiv.innerHTML = htmlString; // 将 HTML 字符串赋值给该元素

    // 包含的图片
    const imgTags = htmlString.match(/<img\b[^>]*>/gi) || [];

    // 替换换行
    let content = htmlString;

    // 替换表情
    for (const imgStr of imgTags) {
        content = content.replace(imgStr, imgStr.match(/\[.*?\]/)[0]);
    }

    return content;
};

/**
 * at的成员id
 */
export const fnTextGetAt = (str, atList, isLeader) => {

    // 所有被@的名称
    let names = [];

    for (const item of atList) {
        let memberName = "";
        if(str.includes(item.name)) memberName = item.name;
        else if(str.includes(item.nickName)) memberName = item.nickName;
        
        if (memberName && str.includes("@")) {
            const index = str.indexOf(memberName);

            // 如果前面是at
            if (index !== 0 && str[index - 1] === "@") {
                // 后面是at或空格，或者是最后，则为at
                const lastIndex = index + memberName.length;
                if (
                    lastIndex === str.length ||
                    [" ", "@"].includes(str[lastIndex])
                ) {
                    names.push(item.name || item.nickName);
                }
            }
        }
    }

    // 所有被@的名称
    names = [
        ...names,
        ...str
            .replace(/@/g, "#$%@")
            .split("#$%")
            .filter((item) => item.indexOf("@") === 0)
            .map((item) => {
                if (item === "@全体成员") {
                    return -1;
                } else {
                    return item.slice(1);
                }
            }),
    ];

    // 返回被@的成员id列表
    return names.includes(-1) && isLeader
        ? [-1]
        : atList
              .filter((item) =>
                  names.some((n) => n.indexOf(item.name || item.nickName) === 0)
              )
              .map((item) => {
                  return { id: item.id.toString(), nickName: item.nickName, name: item.name };
              });
};

// 获取选中的内容
export const fnGetSelectContent = () => {
    const innerHTML = fnGetSelectInnerHTML()
    return textToEmojiText(innerHTML.replace(/<br class="[0-9]*">/g, "\n"))
}

// 获取输入框选择内容的innerHTML
export const fnGetSelectInnerHTML = () => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedNodes = range.cloneContents();
    const div = document.createElement("div");
    div.appendChild(selectedNodes);
    return div.innerHTML;
}

/**
 * 复制当前选中的内容
 */
export const fnCopyEditorContent = () => {
    // 处理换行, 表情处理
    copyText(
        fnGetSelectContent()
    );
};

/**
 * 光标设置到新加的内容后面 的参数
 */
export const fnStrLastCousorIndexGet = (
    anchorOffset,
    eleIndex,
    str,
    elInput
) => {
    // 先分析字符串的元素情况
    if (str.includes("<img")) {
        // 如果有表情
        // 获取元素
        const arr = [];
        const arr1 = str.split("<img").filter((item) => item !== "");
        for (const item of arr1) {
            if (item.includes(" src=")) {
                const str = item.slice(0, item.indexOf(">") + 1);
                if (str === item) {
                    arr.push(item);
                } else {
                    arr.push(str);
                    arr.push(item.slice(item.indexOf(">") + 1));
                }
            } else {
                arr.push(item);
            }
        }

        // 如果是一个表情
        if (arr.length === 1) {
            let eIndex = eleIndex + 1;
            // 如果是全部需要 -1
            if (elInput.innerHTML === str) {
                eIndex -= 1;
            }
            return [-1, eIndex];
        }

        // 如果第一个元素是表情,或者不是在文本中添加
        if (arr[0].indexOf(" src") === 0 || anchorOffset === -1) {
            let eIndex = arr.length + eleIndex;
            // 如果是全部需要 -1
            if (elInput.innerHTML === str) {
                eIndex -= 1;
            }
            // 如果最后一个元素也是表情
            if (arr[arr.length - 1].indexOf(" src") === 0) {
                return [-1, eIndex];
            }
            // 如果最后一个元素不是表情
            return [arr[arr.length - 1].length, eIndex];
        } else {
            // 第一个元素是文本并且是在文本中添加
            const eIndex = arr.length + eleIndex - 1;

            // 如果最后一个元素也是表情
            if (arr[arr.length - 1].indexOf(" src") === 0) {
                return [-1, eIndex];
            }
            // 如果最后一个元素不是表情
            return [arr[arr.length - 1].length, eIndex];
        }
    }

    // 如果粘贴的都是文字
    // 如果是在子元素外粘贴的
    if (anchorOffset === -1) {
        return [str.length, eleIndex];
    }
    return [anchorOffset + str.length, eleIndex];
};

/**
 *  函数：将光标移动到点击图片后面
 */
export const fnMoveCursorAfterImage = (image) => {
    // 获取图片的下一个兄弟节点，看看后面是否有空白文本节点
    const range = document.createRange();
    const selection = window.getSelection();

    // 创建一个空白文本节点，在图片后插入
    const blankTextNode = document.createTextNode(""); // 空格节点，作为光标位置

    // 将这个空白节点插入图片后面
    image.parentNode.insertBefore(blankTextNode, image.nextSibling);

    // 设置光标在新创建的文本节点之后
    range.setStartAfter(blankTextNode); // 将光标设置在新文本节点后面
    range.setEndAfter(blankTextNode);

    // 清除当前的选择，设置新的选择范围
    selection.removeAllRanges();
    selection.addRange(range);
};
