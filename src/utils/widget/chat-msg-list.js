import dayjs from "dayjs";
import i18n from "@/assets/lang/i18n";
import eventCommon from "@/event/common";
import { longToNum, chatPageDateformat, chatDate } from "@/utils/base";

/**
 * IndexedDb 数据库的消息数据格式化
 */
export const fnDbMsgListFormat = (list, isGroup) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    return list.map((item) => {
        let content = item.content;
        const local = item.local;
        const isSelf = item.sendUid === loginId;
        let user = null;

        if (!isSelf) {
            if (isGroup) {
                if (item.sendMember) {
                    user = item.sendMember.user;
                }
            } else {
                user = item.sendUser;
            }

            if (user && typeof user.uid === "object") {
                user.uid = longToNum(user.uid);
            }
        }

        let fileName = item.fileName;
        let fileSize = item.fileSize;
        if (
            fileSize &&
            typeof fileSize === "string" &&
            fileSize.includes("NaN")
        ) {
            fileSize = item.fileSize = "";
        }
        if (
            item.chatType === 7 &&
            !fileName &&
            !fileSize &&
            item.content &&
            item.content.includes("||")
        ) {
            const arr = item.content.split("||");
            fileName = arr[1];
            fileSize = arr[2] ? (Number(arr[2]) / 1024).toFixed(2) + " kb" : "";
        }
        if (item.chatType === 51) {
            const arr = item.content.split("||");
            let str = "";
            const name = isSelf
                ? i18n.t("你")
                : _.get(item, "user.friendRelation.remarkName") ||
                  _.get(item, "user.nickName");
            if (arr[0] === "1") {
                str = name + " " + i18n.t("设置了消息已读XX后销毁");

                // Set time
                let timeStr = "";
                const second = arr[1];
                if (second < 60) {
                    timeStr = second + i18n.t("秒");
                } else if (second < 60 * 60) {
                    timeStr = second / 60 + i18n.t("分钟");
                } else if (second < 60 * 60 * 24) {
                    timeStr = second / (60 * 60) + i18n.t("小时");
                } else {
                    timeStr = second / (60 * 60 * 24) + i18n.t("天");
                }
                str = str.replace("XX", timeStr);
            } else if (item.doType === 0) {
                str = i18n.t("我们已成为好友，打声招呼吧");
            } else {
                str = name + " " + i18n.t("关闭了阅后即焚");
            }
            content = str;
        } else if (item.chatType === 5 && typeof content === "string") {
            const arr = content.split("*|*|*");
            content = {
                name: arr[0],
                id: arr[arr.length - 1],
                pic: arr.length === 3 ? arr[1] : null,
            };
        }

        return {
            id: item.customMsgId,
            customMsgId: item.customMsgId,
            MsgID: item.MsgID,
            content,
            sendTime: Number(item.sendTime),
            chatType: item.chatType,
            msgType: item.msgType,
            result: item.result,
            user,
            local,
            isSelf,
            readStatus: item.readStatus,
            sendUid: item.sendUid,
            fileKey: item.fileKey,
            fileName,
            fileSize,
            localThumbUrl: item.localThumbUrl,
            quoteMessage: item.quoteMessage,
            associationIdList: item.associationIdList,
            bfReadCancel: item.bfReadCancel,
            msgCancelTime: item.msgCancelTime,
            deleteSeconds: item.deleteSeconds,
            url: item.url,
            text: item.text,
            atUsers: item.atUsers,
            thumbUrl: item.thumbUrl,
            width: item.width,
            height: item.height
        };
    });
};

/**
 * 消息列表模块化
 */
export const fnMsgListToBlockInfos = (pageNumList, list, msgBlockList) => {
    const pageSize = 80;
    let beforeTime = 0;
    let beforeUserId = 0;
    let showTimeDay = "";
    for (const i in list) {
        if (
            dayjs(list[i].sendTime).format("YYYY-MM-DD") !==
            dayjs(beforeTime).format("YYYY-MM-DD")
        ) {
            list[i].showTime = chatDate(list[i].sendTime, i18n.t("昨天"));
            showTimeDay = chatPageDateformat(list[i].sendTime, i18n.locale);

            beforeTime = list[i].sendTime;
        } else {
            list[i].showTime = null;
        }
        list[i].showTimeDay = showTimeDay;

        if (beforeUserId === list[i].sendUid) {
            list[i].isSameUser = true;
        }
        beforeTime = list[i].sendTime;
        beforeUserId = list[i].sendUid;

        // 旧的回复信息转换
        if (
            typeof list[i].content === "string" &&
            list[i].content.includes("||-uid:") &&
            list[i].content.includes("||-msgId:")
        ) {
            const arr = list[i].content.split("-||-");

            const quoteMessage = {};
            const content = arr.find((item) => item.includes("content:"));

            quoteMessage.content =
                typeof content === "string"
                    ? content.replace("content:", "")
                    : "";
            quoteMessage.UserID = Number(
                arr.find((item) => item.includes("uid:")).replace("uid:", "")
            );
            quoteMessage.msgId = arr
                .find((item) => item.includes("msgId:"))
                .replace("msgId:", "");

            quoteMessage.chatType = 0;
            quoteMessage.msgType = 0;

            const type = arr.find((item) => item.includes("type:"));
            if (type) {
                const chatType = type.replace("type:", "");

                const map = {
                    "[图片]": 1,
                    "[语音]": 2,
                    "[视频]": 3,
                    "[位置]": 4,
                    "[名片]": 5,
                    "[系统]": 6,
                    "[文件]": 7,
                    "[群公告]": 8,
                    "[动图]": 9,
                    "[骰子]": 12,
                    "[扑克牌]": 18,
                };

                if (map[chatType]) {
                    quoteMessage.content = eventMsg.fnMsgTypeToText({
                        chatType: map[chatType],
                        msgType: map[chatType],
                        haveBrackets: true,
                    });
                } else if (chatType !== "0") {
                    quoteMessage.content = eventMsg.fnMsgTypeToText({
                        chatType: Number(chatType),
                        msgType: Number(chatType),
                        haveBrackets: true,
                    });
                }
            }

            const name = arr
                .find((item) => item.includes("name:"))
                .replace("name:", "");

            if (name === "") {
                quoteMessage.isSameUser = true;
            } else {
                quoteMessage.user = {
                    nickName: name,
                };
            }

            list[i].quoteMessage = quoteMessage;
            list[i].content = arr[0];
        }

        // 旧的图片信息转换
        if ([1, 3, 7, 9].includes(list[i].chatType)) {
            if (list[i].url) {
                list[i].content = list[i].url + "||" + list[i].chatType;
            }
        }
    }

    // 处理新数据
    const msgBlockListNew = [];
    for (let i = 0; i < pageNumList.length; i++) {
        const arr = list.slice(i * pageSize, (i + 1) * pageSize);

        if (arr.length > 0) {
            msgBlockListNew.push({
                pageNum: pageNumList[i],
                list: arr,
            });
        }
    }

    // 分隔旧数据
    const msgBlockListBefore = msgBlockList.filter(
        (item) => item.pageNum < pageNumList[0]
    );

    const msgBlockListAfter = msgBlockList.filter(
        (item) => item.pageNum > pageNumList[pageNumList.length - 1]
    );

    //////////////////////// 数据组合 对应日期显示调整

    // 前一条数据 比对处理
    if (msgBlockListBefore.length > 0) {
        const blockBefore = msgBlockListBefore[msgBlockListBefore.length - 1];

        if (blockBefore.list.length > 0) {
            const beforeInfo = blockBefore.list[blockBefore.list.length - 1];

            const dateCurrent = dayjs(
                msgBlockListNew[0].list[0].sendTime
            ).format("YYYY-MM-DD");

            // 如果跟上一条是同一天的数据，对应处理
            if (
                beforeInfo &&
                dayjs(beforeInfo.sendTime).format("YYYY-MM-DD") !== dateCurrent
            ) {
                msgBlockListNew[0].list[0].showTime = null;
            }
        }
    }

    // 后一条数据 比对处理
    if (msgBlockListAfter.length > 0 && msgBlockListAfter[0].list.length) {
        const dateAfter = dayjs(msgBlockListAfter[0].list[0].sendTime).format(
            "YYYY-MM-DD"
        );

        const blockCurrent = msgBlockListNew[msgBlockListNew.length - 1];
        const dateCurrent = dayjs(
            blockCurrent.list[blockCurrent.list.length - 1].sendTime
        ).format("YYYY-MM-DD");

        if (dateAfter === dateCurrent) {
            msgBlockListAfter[0].list[0].showTime = null;
        }
    }

    // 组合返回
    return [...msgBlockListBefore, ...msgBlockListNew, ...msgBlockListAfter];
};

/**
 * 后去进入可视区域的ids
 */
export const fnIdsEnterVisualRangeGet = ({
    blockListShowPageNum,
    blockList,
    scrollTop,
    clientHeight,
}) => {
    let heightBefore = 0;

    // 偏移量，进入可视的多余部分
    const dValue = 60;

    // 可视区间内的消息列表
    let msgListEnterVisual = [];

    // 计算进入可视范围消息
    for (const item of blockList) {
        // 在前面，并且已经隐藏的页面
        if (item.pageNum < blockListShowPageNum - 1) {
            // 如果有设置最小高度就是对的，没有的话就是出bug了，只能是0
            if (item.minHeight) {
                heightBefore += item.minHeight;
            }
        } else if (item.pageNum === blockListShowPageNum - 1) {
            // 显示的第一个页面，可能有数据在可视范围内也可能没有，显示的数据需要即时拿取高度确保正确
            const domPage = document.getElementById("pageNum" + item.pageNum);
            if (domPage) {
                // 先确认当前页面是否有数据在可视范围内，如果有则获取所有的可视范围内的信息
                if (domPage.clientHeight + heightBefore - scrollTop >= dValue) {
                    // 页面可视的top
                    const pageVisibleTop = scrollTop - heightBefore;

                    // 高度总计
                    let heightTotal = 0;

                    // 有数据在可视范围内，添加可视范围内的消息
                    for (let i = 0; i < item.list.length; i++) {
                        const cur = item.list[i];
                        const msgDom = document.getElementById(cur.customMsgId);

                        if (msgDom) {
                            heightTotal += msgDom.clientHeight;

                            // 当前信息在可视范围内，那么当前页面后面所有数据都在可视范围内
                            if (heightTotal >= pageVisibleTop - dValue) {
                                // 记录所有的数据
                                msgListEnterVisual = item.list.filter(
                                    (_, index) => index >= i
                                );

                                // 结束循环
                                break;
                            }
                        }
                    }
                }

                // 没有数据在可视范围内
                heightBefore += domPage.clientHeight;
            }
        } else {
            // 页面可视的top
            const pageVisibleTop = scrollTop - heightBefore;

            // 页面可视的bottom
            const pageVisibleBottom = scrollTop + clientHeight - heightBefore;

            // 页面消息高度总计
            let heightPageTotal = 0;

            for (const n of item.list) {
                const msgDom = document.getElementById(n.customMsgId);

                if (msgDom) {
                    heightPageTotal += msgDom.clientHeight;

                    // 如果第一条消息还没有找到，则判断是否为第一条
                    if (msgListEnterVisual.length === 0) {
                        if (heightPageTotal >= pageVisibleTop - dValue) {
                            msgListEnterVisual.push(n);
                        }
                    } else {
                        // 第一条消息存在则，直接添加消息，并判断是最后一条，最后一条则结束循环
                        msgListEnterVisual.push(n);

                        if (heightPageTotal > pageVisibleBottom + dValue) {
                            // 结束循环
                            break;
                        }
                    }
                }
            }
        }
    }

    return msgListEnterVisual;
};

/**
 * 消息列表删除消息计算
 */
export const fnMsgListDeleteCalculate = (blockList, idsDelete) => {
    let blockListNew = _.cloneDeep(blockList);
    if (blockListNew) {
        // 最后一页的id列表
        const idsLast = blockListNew[blockListNew.length - 1].list.map(
            (item) => item.customMsgId
        );

        const customMsgIdDeleteList = idsDelete.map((item) => item.customMsgId);

        // 最后页的id列表，完全包括删除的id，则可以直接处理
        if (
            _.difference(idsLast, customMsgIdDeleteList).length === 0 &&
            _.difference(customMsgIdDeleteList, idsLast).length === 0
        ) {
            // 如果正好完全删除，直接删除最后一页
            blockListNew.pop();
            return blockListNew;
        }

        if (_.difference(idsLast, customMsgIdDeleteList).length === 0) {
            // 如果最后一页的消息都删除了 删除最后一页
            blockListNew.pop();

            // 前面还有页面，则继续获取前面的数据
            if (blockListNew.length > 0) {
                blockListNew = fnMsgListDeleteCalculate(
                    blockListNew,
                    idsDelete.filter(
                        (item) => !idsLast.includes(item.customMsgId)
                    )
                );
            }
            return blockListNew;
        }

        return blockListNew;
    }
};

/**
 * 修改消息属性
 * 处理状态改变 发送成功，发送超时，已读
 */
export const fnMsgPropertyUpdate = (info, blockList, pageCount) => {
    const { list } = info;
    let blockListNew = _.cloneDeep(blockList);
    if (blockListNew) {
        // 需要修改的信息 id列表
        const ids = list.map((item) => item.customMsgId);

        // 剩余修改次数，为0时就结束遍历
        let remainingModificationsTimes = ids.length;

        for (let i = 0; i < blockListNew.length; i++) {
            // 模块中的消息 索引
            const indexList = [];

            blockListNew[i].list.forEach((item, index) => {
                if (ids.includes(item.customMsgId)) {
                    indexList.push(index);
                }
            });

            if (indexList.length > 0) {
                for (const index of indexList) {
                    // 要修改的消息 索引
                    const indexMsgUpdated = ids.indexOf(
                        blockListNew[i].list[index].customMsgId
                    );

                    if (indexMsgUpdated !== -1) {
                        blockListNew[i].list[index] = {
                            ...blockListNew[i].list[index],
                            ...list[indexMsgUpdated].updated,
                        };

                        // 更新一次，剩余更新次数就减1
                        remainingModificationsTimes--;

                        // 剩余修改次数，为0时就结束遍历
                        if (remainingModificationsTimes === 0) {
                            break;
                        }
                    }
                }
            }
        }

        const pageNumList = Object.keys(blockListNew).map(
            (key) => blockListNew[key].pageNum
        );

        // 如果最后一页存在，则最后两页，进行重新排序
        if (pageNumList.includes(pageCount)) {
            // 如果只有一页
            if (pageCount === 1) {
                blockListNew[0].list = _.sortBy(
                    blockListNew[0].list,
                    "sendTime"
                );
            } else {
                const pageSize =
                    blockListNew[blockListNew.length - 2].list.length;
                const list = _.sortBy(
                    [
                        ...blockListNew[blockListNew.length - 2].list,
                        ...blockListNew[blockListNew.length - 1].list,
                    ],
                    "sendTime"
                );

                blockListNew[blockListNew.length - 2].list = list.slice(
                    0,
                    pageSize
                );
                blockListNew[blockListNew.length - 1].list =
                    list.slice(pageSize);
            }
        } else if (pageNumList.includes(pageCount - 1)) {
            // 如果最后一页不存在，但倒数第二页存在，则清掉倒数第二页
            blockListNew = blockListNew.pop();
        }

        return blockListNew;
    }
};
