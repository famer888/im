import { Cache } from "@/cache";
import { receiveGroupEvent } from "@/socket/api/message";
import {
    generateUniqueId,
    longToNum,
    objectComparisonUpdate,
} from "@/utils/base";

import {
    getGroupEventList,
    getGroupDetail,
    getGroupEventLatest,
    GroupUpdate,
    getGroupMemberListV2,
} from "@/api/imGroup";

// 事件
import eventBase from "./base";
import eventCheduledCeletion from "./cheduled-deletion";
import eventFriend from "./friend";
import eventCommon from "./common";

// 成员列表对象
let memberListObj = {};

// 记录阻塞的事件
const groupEventObj = {};

// 记录群事件最后执行的参数
let groupEventExecIdObj = {};

// 补偿中的群key列表
let replenishingGroupEventKeyList = [];

// 群需要初始化的id列表
let groupInitInfoList = [];

// 群需要初始化之后执行的事件
let groupInitEvents = {};

// 群初始化延迟处理列表
let groupInitDelayedList = [];

// 群需要初始化的详情信息
let groupInitDetailsGetList = [];

// 群成员的拉取排队
let groupInitMemberGetList = [];

// 群初始化接口获取队列
let groupInitInterfaceGetueue = [];

// 补偿参数
let compensateParams = {};

/**
 * 检查退群/解散群事件是否应该被执行的守卫函数
 * 如果是退群或解散群聊事件，检查本地存储包括数据库缓存和会话列表
 * 如果存在，继续执行；如果不存在，则不执行并发送回执确认
 */
const fnGroupEventGuard = async (data, loginId) => {
    try {
        // 判断是否为群请求事件（包含退群和解散群事件）
        if (!data.groupReqEventMsgDto || data.groupReqEventMsgDto?.length === 0) {
            return true; // 不是请求事件，允许执行
        }

        // 获取群ID
        const groupId = Number(
            data.groupReqEventMsgDto[0]?.commonMsgDto?.groupBaseInfo?.groupId
        );

        // 获取事件类型和发起人ID
        let groupReqType = null; // 退群/解散群事件类型
        let exitEventFromUid = null; // 发起人ID

        // 检查是否为6踢出群(groupReqType 6)groupReqType groupReqType 13）事件
        const exitOrDismissEvent = data.groupReqEventMsgDto.find((item) => [6, 7, 13].includes(item.groupReqType));

        if (!exitOrDismissEvent) {
            // 不是退群或解散群事件，直接允许执行
            return true;
        }

        groupReqType = exitOrDismissEvent.groupReqType;
        exitEventFromUid = Number(exitOrDismissEvent.commonMsgDto.fromUid);

        // 检查是否存在群事件执行ID（表示群在本地有记录）
        const hasEventRecord =
            groupEventExecIdObj[groupId + "broadcast"] ||
            groupEventExecIdObj[groupId + "unicast"] ||
            groupEventExecIdObj[groupId + "update"];

        // 如果有事件记录，说明本地存在该群，允许执行
        if (hasEventRecord) {
            return true;
        }

        // 本地不存在该群事件记录，需要清理本地缓存和会话列表
        // console.log("群不存在本地事件记录，清理本地数据", groupId, groupReqType);

        // 1. 清理群成员列表缓存
        const groupMemberList = await Cache(
            `${loginId}_${groupId}_groupMemberList`
        );
        if (groupMemberList && groupMemberList.length > 0) {
            await Cache(`${loginId}_${groupId}_groupMemberList`, []);
        }

        // 2. 从群列表中移除该群
        const groupList = (await Cache(`${loginId}-GroupList`)) || [];
        const hasInGroupList = groupList.some((item) => item.id === groupId);
        if (hasInGroupList) {
            const updatedGroupList = groupList.filter((item) => item.id !== groupId);
            await Cache(`${loginId}-GroupList`, updatedGroupList);
        }

        // 3. 判断是否需要删除会话列表
        let shouldDeleteChat = false;

        if (groupReqType === 13) {
            // 群解散事件：无论谁解散，都删除会话列表
            shouldDeleteChat = true;
        } else if ([6, 7].includes(groupReqType) && exitEventFromUid === loginId) {
            // 群成员退出事件：只有当退出的是本人时才删除会话列表
            shouldDeleteChat = true;
        }

        // 4. 从会话列表中移除该群（如果需要）
        if (shouldDeleteChat) {
            eventBase.fnCommunicationSendMsg({
                operator: "deleteChat",
                data: {
                    id: groupId,
                    type: "group",
                    isDeleteLocal: true,
                },
            });
        }

        // 5. 发送回执确认收到事件（避免服务器重复推送）
        data.groupReqEventMsgDto.forEach((item) => {
            receiveGroupEvent({
                groupId,
                receiptStatus: 0,
                msgType: item.commonMsgDto.msgType,
                msgId: [Number(item.commonMsgDto.msgId)],
            });
        });

        return false;
    } catch (error) {
        // 守卫函数出错时，允许事件继续执行，避免阻塞正常流程
        console.error("fnGroupEventGuard error:", error);
        return true;
    }
};

/**
 * 群相关事件
 */
const fnRnGroupEvent = async (data, isGroupInitEvent) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 执行守卫检查：对于退群和解散群事件，如果本地不存在该群，则不执行（守卫内部会发送回执）
    const shouldExecute = await fnGroupEventGuard(data, loginId);
    if (!shouldExecute) {
        return;
    }

    let typeStr = "update";
    // console.log("=================收到群事件", data, isGroupInitEvent, _.cloneDeep(groupEventExecIdObj));
    let groupId = null;
    if (data.groupUpdateEventMsgDto && data.groupUpdateEventMsgDto.length > 0) {
        // 如果群更新事件来了，则检查是否有创群事件等事件msgId,如果不存在，则表示丢失了事件，则不需要处理
        // 直接提示收到
        groupId = Number(
            data.groupUpdateEventMsgDto[0].commonMsgDto.groupBaseInfo.groupId
        );
        if (!groupEventExecIdObj[groupId + "broadcast"]) {
            const isInit = await fnCheckGroupMemberList(groupId);
            // console.log('groupEventExecIdObj 事件id不存在 》》1')
            if (!isInit) {
                // 当前群更新信息丢失创群事件信息，则把信息推入到群初始化队列去
                if (!groupInitDetailsGetList.includes(groupId)) {
                    // 如果当前群存在初始化等待队列中，就不在push进去了
                    groupInitInfoList.push({
                        id: groupId,
                        msgId: Number(
                            data.groupUpdateEventMsgDto.at(-1).commonMsgDto
                                .msgId
                        ),
                        msgType:
                            data.groupUpdateEventMsgDto.at(-1).commonMsgDto
                                .msgType,
                    });

                    groupInitDetailsGetList.push(groupId);
                    // console.log('丢失创群事件，进入初始化 》》1')
                }
                // 确认收到
                data.groupUpdateEventMsgDto.forEach((item) => {
                    receiveGroupEvent({
                        groupId,
                        receiptStatus: 0,
                        msgType: item.commonMsgDto.msgType,
                        msgId: [Number(item.commonMsgDto.msgId)],
                    });
                });
                // 立即执行初始化
                fnRunInit();
                return;
            }
        }
    }

    if (data.groupReqEventMsgDto && data.groupReqEventMsgDto.length > 0) {
        groupId = Number(
            data.groupReqEventMsgDto[0].commonMsgDto.groupBaseInfo.groupId
        );
        let groupReqEventInfo = data.groupReqEventMsgDto.at(-1);
        let msgId = Number(groupReqEventInfo.commonMsgDto.msgId);
        switch (data.groupReqEventMsgDto[0].commonMsgDto.evenType) {
            case 0: {
                typeStr = "init";
                break;
            }
            case 1: {
                let msg = groupReqEventInfo.commonMsgDto.msg;
                let msgs = [
                    "邀请你加入群聊",
                    "你通过扫描二维码加入了群聊",
                    "你通过群别名加入了群聊",
                ]; // 这些消息是其它进群得创群事件
                let isHas = false;
                for (let i = 0; i < msgs.length; i++) {
                    let itemMsg = msgs[i];
                    if (msg.includes(itemMsg)) {
                        isHas = true;
                        break;
                    }
                }
                if (
                    !groupEventExecIdObj[groupId + "broadcast"] &&
                    !groupEventExecIdObj[groupId + "unicast"]
                ) {
                    // 收到群事件，但是发现丢失创群事件，则把当前所有群事件都丢弃，直接进入初始化流程
                    const isInit = await fnCheckGroupMemberList(groupId);
                    // console.log('groupEventExecIdObj 事件id不存在 》》2', groupEventExecIdObj, isInit)
                    if (!isInit) {
                        // 如果群成员列表不存在，则把当前所有群事件都丢弃，直接进入初始化流程
                        if (!groupInitDetailsGetList.includes(groupId)) {
                            // 将当前触发初始化的消息保存到事件队列中，以便初始化完成后重放（避免消息丢失）
                            // 构造符合格式的消息对象
                            const pendingEvents = data.groupReqEventMsgDto.map(item => ({
                                ...item,
                                commonMsgDto: {
                                    ...item.commonMsgDto,
                                    msgId: Number(item.commonMsgDto.msgId)
                                }
                            }));
                            // 存入阻塞队列
                            groupInitEvents[groupId + "broadcast"] = pendingEvents;

                            // 如果当前群存在初始化等待队列中，就不在push进去了
                            groupInitInfoList.push({
                                id: groupId,
                                msgId: msgId,
                                msgType: groupReqEventInfo.commonMsgDto.msgType,
                            });

                            groupInitDetailsGetList.push(groupId);
                            // console.log('丢失创群事件，进入初始化 》》2', {msgId})
                        }
                        // 确认收到
                        data.groupReqEventMsgDto.forEach((item) => {
                            receiveGroupEvent({
                                groupId,
                                receiptStatus: 0,
                                msgType: item.commonMsgDto.msgType,
                                msgId: [Number(item.commonMsgDto.msgId)],
                            });
                        });
                        // 立即执行初始化
                        fnRunInit();
                        return;
                    }
                }
                typeStr = "broadcast";
                // 如果退群，则上次事件改到，退群的上一个
                const exitId = Math.max(
                    data.groupReqEventMsgDto
                        .filter((item) => item.commonMsgDto.msgType === 3)
                        .map((item) => Number(item.commonMsgDto.msgId))
                );

                if (exitId !== 0) {
                    groupEventExecIdObj[
                        Number(
                            data.groupReqEventMsgDto[0].commonMsgDto
                                .groupBaseInfo.groupId
                        ) + typeStr
                    ] = exitId - 1;
                }
                break;
            }
            case 2: {
                typeStr = "unicast";
                break;
            }
            default:
        }
    }

    // 收到的事件列表
    let list =
        typeStr === "update"
            ? data.groupUpdateEventMsgDto
            : data.groupReqEventMsgDto;

    list = list.map((item) => {
        return {
            ...item,
            commonMsgDto: {
                ...item.commonMsgDto,
                msgId: Number(item.commonMsgDto.msgId),
            },
        };
    });

    if (list.length === 0) {
        return;
    }

    // 都是单个群，单个类型收到和执行
    // const groupId = Number(list[0].commonMsgDto.groupBaseInfo.groupId);

    // 如果是初始化进行中群，对应事件就都阻塞起来，完成初始化之后执行
    if (groupInitInfoList.some((item) => item.id === groupId)) {
        if (typeStr !== "init") {
            // 初始化完成后的排队
            groupInitEvents[groupId + typeStr] = groupInitEvents[
                groupId + typeStr
            ]
                ? [...groupInitEvents[groupId + typeStr], ...list]
                : list;
        }

        return;
    }

    // 如果初始化跟其他事件混合，其他事件直接放弃掉
    if (typeStr === "init") {
        // 如果有初始化的内容
        const initInfo = list.find((item) => !item.commonMsgDto.evenType);

        if (initInfo) {
            const msgId = Number(initInfo.commonMsgDto.msgId);
            // 确认收到
            receiveGroupEvent({
                groupId,
                receiptStatus: 0,
                msgType: initInfo.commonMsgDto.msgType,
                msgId: [msgId],
            });

            // 群清理
            fnGroupClear(groupId);

            ////////////////// 把初始化信息放到对应的变量去依次处理
            // 如果当前不存在，则添加处理
            if (!groupInitInfoList.some((item) => item.id === groupId)) {
                setTimeout(() => {
                    groupInitInfoList.push({
                        id: groupId,
                        msgId: Number(initInfo.commonMsgDto.msgId),
                        msgType: initInfo.commonMsgDto.msgType,
                    });
                    groupInitDetailsGetList.push(groupId);
                }, 1000);
            }
        }
        return;
    }

    // 非创建入群
    if (!isGroupInitEvent && typeStr === "broadcast") {
        const joinInfo = list.find((item) => fnIsJoinGroup(item));

        // 如果有加入群信息存在
        if (joinInfo) {
            // 初始化之后执行
            groupInitEvents[groupId + typeStr] = [joinInfo];

            // 添加初始化信息
            groupInitInfoList.push({
                id: groupId,
                msgId: Number(joinInfo.commonMsgDto.msgId),
                msgType: joinInfo.commonMsgDto.msgType,
            });
            groupInitDetailsGetList.push(groupId);
            return;
        }
    }

    // 收到的列表, 升序排序
    list = _.orderBy(list, ["commonMsgDto.msgId"], ["asc"]);

    // 列表id
    let msgIdList = list.map((item) => Number(item.commonMsgDto.msgId));

    // 如果有重复则，去重复
    if (_.uniq(msgIdList).length !== msgIdList.length) {
        msgIdList = _.uniq(msgIdList);
        list = _.uniqBy(list, "commonMsgDto.msgId");
    }

    // 对象key
    const key = groupId + typeStr;

    // 执行的最后一个id
    let msgIdLast = groupEventExecIdObj[key] || 0;

    const msgIdListBefore = msgIdList.filter((id) => id <= msgIdLast);
    // console.log('>>>>>>>>>>>>>>>>> 213 msgIdList', msgIdList)
    // 需要阻塞执行的id
    let msgIdListAfter = [];
    for (const id of msgIdList) {
        // 如果之前执行的id不存在，则设置为当前的前一个
        if (msgIdLast === 0) {
            msgIdLast = id - 1;
        }

        // 如果是正常顺序,序号加1
        if (msgIdLast + 1 === id) {
            msgIdLast++;
        } else {
            // 如果发现缺失，设置需要阻塞执行的id
            msgIdListAfter = msgIdList.filter((id) => id > msgIdLast);

            if (msgIdListAfter.length > 0) {
                // 更新补偿的执行时间
                const obj = groupEventObj[key] || {
                    events: [],
                    isDoing: false,
                };
                groupEventObj[key] = {
                    ...obj,
                    execTime: new Date().getTime() + 1000,
                    execIdList: msgIdListAfter,
                };
            }
            break;
        }
    }

    // 新的列表
    const listNew = [];

    // 被记录事件的id列表
    let eventRecordIdList = [];
    if (msgIdListAfter.length > 0) {
        eventRecordIdList = groupEventObj[key].events.map((item) =>
            Number(item.commonMsgDto.msgId)
        );
    }

    // 判断是否有出现异常的事件，序号发现缺失，抛出到异常处理
    for (const item of list) {
        const msgId = Number(item.commonMsgDto.msgId);

        if (msgIdListAfter.includes(msgId)) {
            // 记录异常相关信息
            // 如果没有被记录则记录
            if (!eventRecordIdList.includes(msgId)) {
                groupEventObj[key].events.push(item);
            }
        } else if (!msgIdListBefore.includes(msgId)) {
            // 正常执行的消息
            listNew.push(item);
        }

        // 已经执行过的 或 已记录阻塞执行的，直接推送让后端不要再推送了
        if (msgIdListBefore.includes(msgId) || msgIdListAfter.includes(msgId)) {
            if (typeStr !== "update") {
                // 确认收到
                receiveGroupEvent({
                    groupId,
                    receiptStatus: 0,
                    msgType: item.commonMsgDto.msgType,
                    msgId: [msgId],
                });
            }

            // 确认完成
            receiveGroupEvent({
                groupId,
                receiptStatus: 3,
                msgType: item.commonMsgDto.msgType,
                msgId: [msgId],
            });
        }
    }

    if (listNew.length > 0) {
        // 因为后续事件逻辑处在异步中，担心服务端会推送新得事件来，当前得事件id还没有存储，所以在进入异步执行前，先存储事件id
        // 设置事件执行的最后的id信息
        listNew.forEach((item) => {
            const msgId = Number(item.commonMsgDto.msgId);
            groupEventExecIdObj[groupId + typeStr] = msgId;
        });
    }

    // console.log(listNew);
    // console.log("=================循环执行", {typeStr, groupEventExecIdObj});

    // 如果有多个事件则依次处理
    for (let i = 0; i < listNew.length; i++) {
        setTimeout(() => {
            if (typeStr === "update") {
                // 更新事件
                fnGroupUpdataEvent(list[i], loginId);
            } else {
                // 消息事件
                fnGroupMsgEvent(list[i], loginId);
            }
        }, 30 + i * 30);
    }

    // 检查并发送群邀请更新通知（筛选入群消息，目标成员为自身，状态为1）
    fnCheckAndNotifyGroupInvitation(data, loginId);
};

/**
 * 群更新事件
 */
const fnGroupUpdataEvent = async (data, loginId) => {
    // 群名，群头像，禁言， 阅后即焚 变更
    const { commonMsgDto, fromUid, handleType } = data;
    // console.log('群更新事件 >>>>>>>>>>>>', data)
    if (commonMsgDto && commonMsgDto.groupBaseInfo) {
        const { groupBaseInfo, updateTime, msgType, msgId, msg } = commonMsgDto;
        const groupId = Number(groupBaseInfo.groupId);
        const {
            groupName,
            pic,
            groupShutup,
            groupMsgCancelTime,
            groupReadCancel,
        } = groupBaseInfo;

        // 群信息变更
        if ([1, 2].includes(handleType)) {
            // 更新
            let updateValues = {};
            if (handleType === 1) {
                updateValues = { name: groupName };
            } else if (handleType === 2) {
                updateValues = { pic };
            }

            eventBase.fnCommunicationSendMsg({
                operator: "groupUpdate",
                data: {
                    type: "group",
                    id: groupId,
                    values: updateValues,
                },
            });
        } else if (handleType === 5) {
            // 禁言
            const bfShutup = Boolean(groupShutup);
            let info = {
                customMsgId: generateUniqueId(),
                name: groupName,
                groupId,
                pic,
                content: `${Number(fromUid) === loginId ? "你" : "管理员"}${
                    bfShutup ? "开启" : "关闭"
                }了全员禁言`,
                notification: "",
                updateTime: Number(updateTime),
                sendTime: Number(updateTime),
                bfShutup,
                type: "group",
                id: groupId,
                msgId,
            };

            fnGroupAddMessageNotification(
                {
                    ...info,
                },
                "groupShutupAll"
            );
        } else if (handleType === 6) {
            let content = msg;
            if (msg.includes("#{uids")) {
                const groupMemberList =
                    (await Cache(`${loginId}_${groupId}_groupMemberList`)) ||
                    [];

                const operatorMemberInfo =
                    groupMemberList.find(
                        (item) => item.id === Number(fromUid)
                    ) || {};

                content = `${
                    operatorMemberInfo.name ||
                    operatorMemberInfo.nickName ||
                    "管理员"
                }${msg.slice(msg.lastIndexOf("}") + 1)}`;
            }

            // 阅后即焚改变，同步
            eventCheduledCeletion.fnGroupMsgConfigRUD(
                groupReadCancel
                    ? {
                          key: groupId,
                          value: groupMsgCancelTime,
                      }
                    : { deleteId: groupId }
            );

            // 阅后即焚消息推送到组件
            eventBase.fnCommunicationSendMsg({
                operator: "cheduledDeletionConfig",
                data: {
                    bfReadCancel: groupReadCancel,
                    msgCancelTime: groupMsgCancelTime,
                    name: groupName,
                    id: groupId,
                    groupId,
                    type: "group",
                    content,
                },
            });

            // 阅后即焚
            fnGroupAddMessageNotification(
                {
                    id: groupId,
                    name: groupName,
                    groupId,
                    pic,
                    content,
                    notification: "",
                    updateTime: Number(updateTime),
                    sendTime: Number(updateTime),
                    customMsgId: generateUniqueId(),
                },
                "operatorReadCancel"
            );
        }

        // 确认完成
        receiveGroupEvent({
            groupId,
            receiptStatus: 3,
            msgType,
            msgId: [Number(msgId)],
        });

        // ////////////////// 事件执行的最后的id信息
        groupEventExecIdObj[groupId + "update"] = Number(commonMsgDto.msgId);

        // 到本地
        if (timerGroupEventExecIdObjToLocal) {
            clearTimeout(timerGroupEventExecIdObjToLocal);
        }

        timerGroupEventExecIdObjToLocal = setTimeout(
            groupEventExecIdObjToLocal,
            1000
        );
    }
};

/**
 * 群消息事件
 */
const fnGroupMsgEvent = async (data, loginId) => {
    const chatType = 50;

    const {
        groupReqStatus,
        groupReqType,
        commonMsgDto,
        groupMember,
        fromUid,
        checkUid,
        receiveUid,
        groupNoticeMsgDto,
        isHide, // 是否隐藏消息（不写入消息列表和数据库）
    } = data;
    const { groupBaseInfo } = commonMsgDto;
    const typeStr = commonMsgDto.evenType === 1 ? "broadcast" : "unicast";
    let customMsgId = generateUniqueId();
    const info = {
        id: customMsgId,
        name: groupBaseInfo.groupName,
        groupId: Number(groupBaseInfo.groupId),
        pic: groupBaseInfo.pic,
        content: "",
        remark: "",
        notification: "",
        updateTime: Number(commonMsgDto.updateTime),
        groupReqType,
        groupReqStatus,
        customMsgId,
        memberCount: groupMember.length,
    };
    let bfTop = false;

    // 确认收到
    receiveGroupEvent({
        groupId: info.groupId,
        receiptStatus: 0,
        msgType: commonMsgDto.msgType,
        msgId: [Number(commonMsgDto.msgId)],
    });

    switch (groupReqType) {
        case 1: {
            if (groupReqStatus === 1) {
                // 创群默认身份为群成员2，如果是群主则更新info.memberType为0
                // 创群
                if (commonMsgDto.msgType === 1) {
                    info.memberType = 2;
                    // 群主id
                    const hostId = Number(fromUid);

                    // 群主信息
                    const hostInfo = groupMember.find((n) => !n.type);
                    // 处理最大邀请用户数名称，最多31个
                    let maxGroupMember = [];
                    if (groupMember.length > 31) {
                        maxGroupMember = groupMember.slice(0, 31);
                    } else {
                        maxGroupMember = [...groupMember];
                    }

                    let membersStr = maxGroupMember
                        .filter(
                            (item) =>
                                Number(item.user.uid) !== hostId &&
                                Number(item.user.uid) !== loginId
                        )
                        .map(
                            (item) =>
                                eventFriend.fnFriendRemarkNameObjRU({
                                    getId: Number(item.user.uid),
                                }) || item.user.nickName
                        )
                        .join("，");

                    membersStr +=
                        groupMember.length > 31
                            ? " ..."
                            : maxGroupMember.length == 2
                            ? ""
                            : " ";
                    membersStr += "加入群聊";

                    // 自己创群
                    if (hostId === loginId) {
                        info.type = "createGroupSelf";
                        if (maxGroupMember.length === 1) {
                            info.content = commonMsgDto.msg;
                        } else {
                            info.content = `你邀请 ${membersStr}`;
                        }
                        // 更新info.memberType
                        info.memberType = 0;
                    } else {
                        // 好友创群直接加入
                        info.type = "createGroupFriend";
                        info.content = `!@#${
                            eventFriend.fnFriendRemarkNameObjRU({
                                getId: hostId,
                            }) || hostInfo.user.nickName
                        }!@# 邀请${
                            maxGroupMember.length == 2 ? "你" : " 你,"
                        }${membersStr}`;
                    }

                    // 初始化成员列表
                    Cache(
                        `${loginId}_${info.groupId}_groupMemberList`,
                        groupMember.map((item) => {
                            return {
                                bfShow: true,
                                depict: item.user.signature || "",
                                icon: item.user.icon,
                                id: Number(item.user.uid),
                                identify: item.user.identify,
                                name: eventFriend.fnFriendRemarkNameObjRU({
                                    getId: Number(item.user.uid),
                                }),
                                nickName: item.user.nickName,
                                type: item.type || 0,
                                joinTime: Date.now(),
                            };
                        })
                    );
                } else if (commonMsgDto.msgType === 2) {
                    info.memberType = 2;
                    // 被好友邀请，直接加入群
                    // 获取邀请你的好友信息
                    const contactList =
                        (await Cache(`${loginId}-ContactList`)) || [];
                    const friendInfo = contactList.find(
                        (item) => item.id === Number(fromUid)
                    );
                    let names = "";
                    groupMember.forEach((item, index) => {
                        let userUid = Number(item.user.uid);
                        if (userUid !== loginId) {
                            let friend = contactList.find(
                                (cur) => cur.id == userUid
                            );
                            names +=
                                "," +
                                ((friend && friend.name) || item.user.nickName);
                        }
                    });
                    // console.log({contactList, friendInfo, fromUid})
                    // 设置信息
                    if (friendInfo) {
                        info.type = "createGroupFriend";
                        info.content = `!@#${
                            friendInfo.name || friendInfo.nickName || ""
                        }!@# 邀请你${names}加入群聊`;
                    } else {
                        // 临时添加，好友列表恢复则删除
                        info.type = "createGroupFriend";
                        info.content = "邀请你加入群聊";
                    }
                } else {
                    // 同意加入群
                    // 有成员加入
                    if (commonMsgDto.msgType === 4) {
                        info.type = "groupAddMember";
                        // info.memberType = 2;
                        // 获取被操作人的信息
                        const groupMemberList =
                            (await Cache(
                                `${loginId}_${info.groupId}_groupMemberList`
                            )) || [];
                        const operatorMemberInfo =
                            groupMemberList.find(
                                (item) => item.id === Number(fromUid)
                            ) || {};

                        const members = groupMember
                            .filter((item) => Number(item.user.uid) !== loginId)
                            .slice(0, 31);

                        let membersStr = members
                            .map(
                                (item) =>
                                    eventFriend.fnFriendRemarkNameObjRU({
                                        getId: Number(item.user.uid),
                                    }) || item.user.nickName
                            )
                            .join("，");

                        membersStr += groupMember.length > 31 ? " ..." : " ";
                        membersStr += "加入群聊";

                        // 自己添加
                        if (Number(fromUid) === loginId) {
                            info.content = `你邀请 ${membersStr}`;
                        } else {
                            // 其他人添加

                            info.content = `!@#${
                                operatorMemberInfo.name ||
                                operatorMemberInfo.nickName ||
                                "管理员"
                            }!@# 邀请 ${membersStr}`;
                        }
                        let memberList = [
                            ...groupMemberList,
                            ...groupMember.map((item) => {
                                return {
                                    bfShow: true,
                                    depict: item.user.signature || "",
                                    icon: item.user.icon,
                                    name: eventFriend.fnFriendRemarkNameObjRU({
                                        getId: Number(item.user.uid),
                                    }),
                                    id: Number(item.user.uid),
                                    identify: item.user.identify,
                                    nickName: item.user.nickName,
                                    type: item.type || 0,
                                    joinTime: Date.now(),
                                };
                            }),
                        ];
                        info.memberCount = memberList.length;
                        // 群成员添加到列表
                        await Cache(
                            `${loginId}_${info.groupId}_groupMemberList`,
                            memberList
                        );
                    }
                }
            } else {
                // 创群被邀请，好友操作要求 需要自己审核
                // 获取邀请你的好友信息
                const contactList =
                    (await Cache(`${loginId}-ContactList`)) || [];
                const friendInfo = contactList.find(
                    (item) => item.id === Number(fromUid)
                );
                info.type = "inviteJoinGroup";
                // 获取
                const user = _.get(groupMember, "[0].user");
                if (user && Number(user.uid) !== loginId) {
                    // 被邀请人是好友，则看有没有好友备注
                    const friendInfoNew = contactList.find(
                        (item) => item.id === Number(user.uid)
                    );
                    let name = user.nickName;
                    if (
                        friendInfoNew &&
                        friendInfoNew.name &&
                        friendInfoNew.name !== ""
                    ) {
                        name = friendInfoNew.name;
                    }

                    info.notification = friendInfo
                        ? `!@#${
                              friendInfo.name || friendInfo.nickName || ""
                          }!@# 邀请 ${name} 加入聊天`
                        : `${name} 加入聊天`;
                } else {
                    info.notification = friendInfo
                        ? `!@#${
                              friendInfo.name || friendInfo.nickName || ""
                          }!@# 邀请你加入群聊`
                        : "你加入群聊";
                }
            }
            break;
        }
        case 2: {
            let newMemberInfo = groupMember[0].user;
            // 通过扫描加入群
            if (groupReqStatus === 1) {
                // 自己直接加入群，同意申请加入
                if (Number(groupMember[0].user.uid) === loginId) {
                    info.type = "joinGroupQRCode";
                    info.content = "你通过扫描二维码加入群聊";
                    info.memberType = 2;
                } else {
                    // 其他成员加入群
                    info.type = "groupAddMember";

                    // 获取被操作人的信息
                    const groupMemberList =
                        (await Cache(
                            `${loginId}_${info.groupId}_groupMemberList`
                        )) || [];

                    info.content = `${
                        eventFriend.fnFriendRemarkNameObjRU({
                            getId: Number(newMemberInfo.uid),
                        }) || newMemberInfo.nickName
                    } 通过扫描二维码加入了群聊`;
                    let memberList = [
                        ...groupMemberList,
                        ...groupMember.map((item) => {
                            return {
                                bfShow: true,
                                depict: item.user.signature || "",
                                icon: item.user.icon,
                                id: Number(item.user.uid),
                                name: eventFriend.fnFriendRemarkNameObjRU({
                                    getId: Number(item.user.uid),
                                }),
                                identify: item.user.identify,
                                nickName: item.user.nickName,
                                type: item.type || 0,
                                joinTime: Date.now(),
                            };
                        }),
                    ];
                    info.memberCount = memberList.length;
                    // 群成员添加到列表
                    await Cache(
                        `${loginId}_${info.groupId}_groupMemberList`,
                        memberList
                    );
                }
            } else {
                // 扫描审核申请
                info.type = "groupApply";
                // 如果是通过自己扫码
                //if (Number(fromUid) === loginId) {
                info.notification = `${
                    eventFriend.fnFriendRemarkNameObjRU({
                        getId: Number(newMemberInfo.uid),
                    }) || groupMember[0].user.nickName
                } 申请加入${info.name}`;
                //}
            }
            break;
        }
        case 3: {
            // 拒绝你的加入群申请
            if (groupReqStatus === 2) {
                // 如果已经有名字
                if (!groupNoticeMsgDto.noticeMsg.includes("uids")) {
                    info.notification = groupNoticeMsgDto.noticeMsg;
                } else {
                    // 查好友
                    const contactList =
                        (await Cache(`${loginId}-ContactList`)) || [];
                    const friendInfo = contactList.find(
                        (item) => item.id === Number(checkUid)
                    );
                    info.notification = `管理员 ${
                        friendInfo
                            ? friendInfo.name || friendInfo.nickName || ""
                            : ""
                    } 拒绝你加入群聊`;
                }
            }
            break;
        }
        case 4: {
            // 扫码进群 拒绝你的加入群申请
            if (groupReqStatus === 2) {
                // 如果已经有名字
                if (!groupNoticeMsgDto.noticeMsg.includes("uids")) {
                    info.notification = groupNoticeMsgDto.noticeMsg;
                } else {
                    // 查好友
                    const contactList =
                        (await Cache(`${loginId}-ContactList`)) || [];
                    const friendInfo = contactList.find(
                        (item) => item.id === Number(checkUid)
                    );
                    info.notification = `管理员 ${
                        friendInfo
                            ? friendInfo.name || friendInfo.nickName || ""
                            : ""
                    } 拒绝你加入群聊`;
                }
            }
            break;
        }
        case 5: {
            // 被邀请者 拒绝加入群
            if (groupReqStatus === 2 && Number(fromUid) === loginId) {
                const contactList =
                    (await Cache(`${loginId}-ContactList`)) || [];
                const friendInfo = contactList.find(
                    (item) => item.id === Number(checkUid)
                );

                info.notification = `${
                    friendInfo.name || friendInfo.nickName || ""
                } 拒绝加入${info.name}群`;
            }
            break;
        }
        case 6: {
            // 有成员被移出[或包括自己]
            // 群成员列表
            const groupMemberList =
                (await Cache(`${loginId}_${info.groupId}_groupMemberList`)) ||
                [];

            // 被移出的成员id
            const idRemove = Number(groupMember[0].user.uid);

            // 如果是自己被移出
            if (idRemove === loginId) {
                fnGroupClear(info.groupId);
                info.type = "exit";
            } else {
                // 其他人被移出
                info.type = "groupRemoveMember";

                // 如果是自己操作移出
                if (Number(fromUid) === loginId) {
                    // 获取被移出成员的信息
                    const memberInfoRemove =
                        groupMemberList.find((item) => item.id === idRemove) ||
                        {};

                    info.content = `你将${
                        memberInfoRemove.name ||
                        memberInfoRemove.nickName ||
                        idRemove
                    }移出群聊`;
                }
                let memberList = groupMemberList.filter(
                    (item) => item.id !== idRemove
                );
                info.memberCount = memberList.length;
                // 更新到列表
                await Cache(
                    `${loginId}_${info.groupId}_groupMemberList`,
                    memberList
                );
            }
            break;
        }
        case 7: {
            // 退群
            // 如果退群的是自己
            if (Number(fromUid) === loginId) {
                fnGroupClear(info.groupId);
                info.type = "exit";
            } else {
                // 成员自己退群
                const groupMemberList =
                    (await Cache(
                        `${loginId}_${info.groupId}_groupMemberList`
                    )) || [];

                const memberInfo =
                    groupMemberList.find(
                        (item) => item.id === Number(fromUid)
                    ) || {};

                info.type = "memberExit";

                // 如果是发给自己
                if (groupMemberList && Number(receiveUid) === loginId) {
                    const myInfo = groupMemberList.find(
                        (item) => item.id === loginId
                    );

                    if (myInfo && !myInfo.type) {
                        // 自己是群主，群成员退群则通知自己
                        info.content =
                            memberInfo.name || memberInfo.nickName
                                ? `${
                                      memberInfo.name || memberInfo.nickName
                                  } 退出群聊`
                                : `会员id ${fromUid} 退出群聊`;
                    }
                }
                let memberList = groupMemberList.filter(
                    (item) => item.id !== Number(fromUid)
                );
                info.memberCount = memberList.length;
                // 更新到列表
                await Cache(
                    `${loginId}_${info.groupId}_groupMemberList`,
                    memberList
                );
            }

            break;
        }
        case 8: {
            // 管理员设置
            const groupMemberList =
                (await Cache(`${loginId}_${info.groupId}_groupMemberList`)) ||
                [];
            info.type = "setAdmin";
            if (Number(groupMember[0].user.uid) === loginId) {
                // 你被设置为管理员
                const memberInfo = groupMemberList.find(
                    (item) => item.id === Number(fromUid)
                );
                info.memberType = 1;
                info.notification = memberInfo
                    ? `${
                          memberInfo.name || memberInfo.nickName
                      }将你设置为管理员`
                    : "你已成为本群管理员";
                info.content = "你已成为本群管理员";
                info.permissions = groupMember[0].right;
            }

            for (const i in groupMemberList) {
                if (groupMemberList[i].id === Number(groupMember[0].user.uid)) {
                    groupMemberList[i].type = 1;
                }
            }
            // console.log('>>>>>>>>>>>>>>>>> 1015 groupMemberList', groupMemberList)
            // 更新到列表
            await Cache(
                `${loginId}_${info.groupId}_groupMemberList`,
                _.orderBy(groupMemberList, ["type"], ["asc"])
            );

            break;
        }
        case 9: {
            // 被移出管理员
            const groupMemberList =
                (await Cache(`${loginId}_${info.groupId}_groupMemberList`)) ||
                [];
            info.type = "removeAdmin";
            if (Number(groupMember[0].user.uid) === loginId) {
                info.notification = "你的管理员身份已被移除";
                info.content = info.notification;
                info.memberType = 2;
                info.permissions = {
                    bfJoinCheck: false,
                    bfPushNotice: false,
                    bfResetQrcode: false,
                    bfSetAdmin: false,
                    bfUpdateData: false,
                };
            }

            for (const i in groupMemberList) {
                if (groupMemberList[i].id === Number(groupMember[0].user.uid)) {
                    groupMemberList[i].type = 2;
                }
            }

            // 更新到列表
            await Cache(
                `${loginId}_${info.groupId}_groupMemberList`,
                _.orderBy(groupMemberList, ["type"], ["asc"])
            );

            break;
        }
        case 10: {
            // 自己的管理员权限被改变
            info.type = "adminPermissionChanges";
            info.permissions = groupMember[0].right;
            // info.content = "你的管理员权限被改变";
            break;
        }
        case 11: {
            // 群禁用
            const { msg } = commonMsgDto;
            info.type = "groupDisable";
            info.isDisable = true;
            // isHide true群静默禁用
            if (!isHide) {
                info.content = msg;
                info.notification = msg;
            }
            break;
        }
        case 12: {
            // 禁言相关
            info.content = commonMsgDto.msg;
            info.mute = groupReqStatus ? true : false;
            // 这个判断是因为有些通知不需要推送到群通知，比如群成员解除禁言，但是开启群成员禁言是需要推送的
            // 开启禁言会返回这个 groupNoticeMsgDto 对象
            if (groupNoticeMsgDto && groupNoticeMsgDto.isNotice) {
                info.notification = commonMsgDto.msg;
            }
            break;
        }
        case 13: {
            // 解散群
            // info.notification = `群聊${info.name} 已解散`;
            const { msg } = commonMsgDto;
            // msgType 4表示自己是群主自己解散群，3表示自己不是群主，其他人是群主解散了群
            info.notification = msg;
            info.type = "exit";
            fnGroupClear(info.groupId);
            break;
        }
        case 15: {
            // 通过名片加入群
            if (groupReqStatus === 1) {
                // 获取被操作人的信息
                const groupMemberList =
                    (await Cache(
                        `${loginId}_${info.groupId}_groupMemberList`
                    )) || [];

                // 自己直接加入群，同意申请加入
                if (Number(groupMember[0].user.uid) === loginId) {
                    info.type = "joinGroupName";
                    info.content = "你通过群别名加入了群聊";
                } else {
                    // 其他成员加入群
                    info.type = "groupAddMember";
                    // 如果是通过自己
                    let newMemberInfo = groupMember[0].user;
                    if (Number(fromUid) === loginId) {
                        info.content = `${
                            eventFriend.fnFriendRemarkNameObjRU({
                                getId: Number(newMemberInfo.uid),
                            }) || newMemberInfo.nickName
                        } 通过群别名加入了群聊`;
                    } else {
                        // 成员
                        info.content = `${
                            eventFriend.fnFriendRemarkNameObjRU({
                                getId: Number(newMemberInfo.uid),
                            }) || newMemberInfo.nickName
                        } 通过群别名加入了群聊`;
                    }
                    let memberList = [
                        ...groupMemberList,
                        ...groupMember.map((item) => {
                            return {
                                bfShow: true,
                                depict: item.user.signature || "",
                                icon: item.user.icon,
                                id: Number(item.user.uid),
                                name: eventFriend.fnFriendRemarkNameObjRU({
                                    getId: Number(item.user.uid),
                                }),
                                identify: item.user.identify,
                                nickName: item.user.nickName,
                                type: item.type || 0,
                                joinTime: Date.now(),
                            };
                        }),
                    ];
                    info.memberCount = memberList.length;
                    // 群成员添加到列表
                    await Cache(
                        `${loginId}_${info.groupId}_groupMemberList`,
                        memberList
                    );
                }
            } else {
                const id = Number(groupMember[0].user.uid);
                const contactList =
                    (await Cache(`${loginId}-ContactList`)) || [];
                const friendInfo = contactList.find((item) => item.id === id);

                if (friendInfo) {
                    info.notification = `${
                        friendInfo.name || friendInfo.nickName || ""
                    } 申請加入 ${info.name}`;
                } else {
                    info.notification = `${groupMember[0].user.nickName} 申請加入 ${info.name}`;
                }
            }
            break;
        }
        case 16: {
            // 群启用
            const { msg } = commonMsgDto;
            info.type = "groupDisable";
            info.isDisable = false;
            // isHide true群静默启用
            if (!isHide) {
                info.content = msg;
                info.notification = msg;
            }
            delete info.name;
            break;
        }
        default: {
            // 群主变更
            if (!groupReqType) {
                info.type = "hostChange";

                let groupOwner = groupMember[0].user;
                let mange = groupMember[1].user;

                const groupMemberList =
                    (await Cache(
                        `${loginId}_${info.groupId}_groupMemberList`
                    )) || [];

                let remarkName = "";

                let count = 0;
                for (let i = 0; i < groupMemberList.length; i++) {
                    let item = groupMemberList[i];
                    if (item.id == Number(groupOwner.uid)) {
                        item.type = 0;
                        remarkName = item.name || item.nickName;
                        count++;
                    }
                    if (item.id == Number(mange.uid)) {
                        item.type = 1;
                        count++;
                    }
                    if (count == 2) {
                        break;
                    }
                }

                if (Number(groupOwner.uid) === loginId) {
                    let curItem = groupMemberList.find(
                        (item) => item.id == Number(mange.uid)
                    );

                    remarkName = curItem.name || curItem.nickName;
                    info.notification = remarkName + " 将群转让给你";
                    info.content = "你已成为群主";
                    info.memberType = 0;
                } else {
                    info.content = "群主变更为 " + remarkName;
                }

                info.newGroupOwner = Number(groupOwner.uid); // 新群主id
                info.oldGroupOwner = Number(mange.uid); // 老群主id
                // 更新到列表
                await Cache(
                    `${loginId}_${info.groupId}_groupMemberList`,
                    _.orderBy(groupMemberList, ["type"], ["asc"])
                );
            }
        }
    }
    const params = {
        id: info.groupId,
        type: "group",
        time: info.updateTime,
        sendTime: info.updateTime,
        content: info.content,
        notification: info.notification,
        groupReqType,
        chatType,
        msgType: chatType,
        bfTop,
        groupId: info.groupId,
        groupName: info.name,
        pic: info.pic,
        memberCount: info.memberCount,
        isHide, // 是否隐藏消息（不更新会话列表最后一条消息）
    };

    // 群身份变更
    if (info.memberType !== undefined) {
        params.memberType = info.memberType;
    }
    // 自己被禁言
    if (info.mute !== undefined) {
        params.mute = info.mute;
    }
    // 设置管理员，权限更新
    if (info.permissions !== undefined) {
        params.permissions = { ...info.permissions };
    }
    // 群禁用
    if (info.isDisable !== undefined) {
        params.isDisable = info.isDisable;
    }

    // 群主更换，新老群主id
    if (info.newGroupOwner !== undefined) {
        params.newGroupOwner = info.newGroupOwner;
        params.oldGroupOwner = info.oldGroupOwner;
    }
    // console.log('params >>>>>>>>>>>>>>> 1252', params, info.type)
    // 添加信息
    if (
        info.content !== "" ||
        [
            "exit",
            "groupRemoveMember",
            "groupAddMember",
            "memberExit",
            "adminPermissionChanges",
            "removeAdmin",
            "setAdmin",
            "groupApply",
        ].includes(info.type) ||
        info.notification
    ) {
        // 如果是当前窗口，则即时同步
        eventBase.fnCommunicationSendMsg({
            operator: "groupNotification",
            operatorType: info.type,
            data: params,
        });

        if (info.content !== "") {
            // 暂且注释，android还没写完，无法验证
            // isHide 为 true 时，不往消息列表添加消息，不写入数据库
            if (!isHide) {
                fnGroupAddMessageNotification(
                    {
                        ...info,
                        content: info.content,
                        groupReqType,
                        sendTime: info.updateTime,
                    },
                    info.type
                );
            }
        }
    }

    // 更新本地缓存 GroupList (例如成员数量变更)
    // 通过发送 groupUpdate 事件通知 home-left 更新
    // 退群事件不发送 groupUpdate，因为 groupNotification exit 已将群从列表移除，
    // 再发 groupUpdate 会导致 fuGroupUpdate 将群重新 push 回列表
    if (info.type !== "exit") {
        const updateValues = {};
        if (info.memberCount !== undefined) updateValues.memberCount = info.memberCount;
        if (info.isDisable !== undefined) updateValues.isDisable = info.isDisable;
        if (info.memberType !== undefined) updateValues.memberType = info.memberType;

        if (Object.keys(updateValues).length > 0) {
            eventBase.fnCommunicationSendMsg({
                operator: "groupUpdate",
                data: {
                    type: "group",
                    id: info.groupId,
                    values: updateValues,
                },
            });
        }
    }

    // 确认完成
    receiveGroupEvent({
        groupId: info.groupId,
        receiptStatus: 3,
        msgType: commonMsgDto.msgType,
        msgId: [Number(commonMsgDto.msgId)],
    });

    if (info.type !== "exit") {
        // 设置事件执行的最后的id信息
        groupEventExecIdObj[info.groupId + typeStr] = Number(
            commonMsgDto.msgId
        );

        // 到本地
        if (timerGroupEventExecIdObjToLocal) {
            clearTimeout(timerGroupEventExecIdObjToLocal);
        }

        timerGroupEventExecIdObjToLocal = setTimeout(
            groupEventExecIdObjToLocal,
            1000
        );
    }
};

/**
 * 群初始化
 */
const fnRunInit = () => {
    // 如果当前请求的接口队列不超过6个，则加新的获取接口事件入队列
    if (groupInitInterfaceGetueue.length < 6) {
        // 常规差值
        let dValue = 6 - groupInitInterfaceGetueue.length;

        // 优先完善群信息 详情加入 队列
        if (groupInitDetailsGetList.length > 0) {
            const detailsJoinGetueueList = groupInitDetailsGetList
                .slice(0, dValue)
                .map((id) => {
                    return {
                        id,
                        type: "details",
                    };
                });

            // 初始化等待进入排队的列表
            groupInitDetailsGetList =
                detailsJoinGetueueList.length === groupInitDetailsGetList.length
                    ? []
                    : groupInitDetailsGetList.slice(
                          detailsJoinGetueueList.length
                      );

            // 设置剩下的差值
            dValue = dValue - detailsJoinGetueueList.length;

            // 加入排队
            groupInitInterfaceGetueue = [
                ...groupInitInterfaceGetueue,
                ...detailsJoinGetueueList,
            ];
        }

        ///////////////////// 群成员获取 加入队列
        // 1. 大于1万2的需要分多组获取，不需要分组获取的优先
        // 2. 不能加入当前队列的先等待，让能加入的先加入

        // 能直接加入的先加入
        for (const item of _.cloneDeep(groupInitMemberGetList)) {
            // 符合要求加入队列
            if (item.pageCount <= dValue) {
                const info = {
                    id: item.id,
                    type: "member",
                    pageCount: item.pageCount,
                    memberCount: item.memberCount,
                };

                // 加入队列
                groupInitInterfaceGetueue = [
                    ...groupInitInterfaceGetueue,
                    ...Array.from(
                        { length: item.pageCount },
                        (_$, index) => index + 1
                    ).map((pageNum) => {
                        return {
                            ...info,
                            pageNum,
                        };
                    }),
                ];

                // 设置剩下的差值
                dValue = dValue - groupInitInterfaceGetueue.length;

                // 移除原本的
                groupInitMemberGetList = groupInitMemberGetList.filter(
                    (item) => item.id !== info.id
                );

                // 如果全部排满则，不用再循环
                if (dValue === 0) {
                    break;
                }
            }
        }

        // 如果当前队列为空，则开始让大于6的加入
        if (
            groupInitInterfaceGetueue.length === 0 &&
            groupInitMemberGetList.length > 0
        ) {
            const info = {
                id: groupInitMemberGetList[0].id,
                type: "member",
            };

            // 加入队列
            groupInitInterfaceGetueue = [
                ...groupInitInterfaceGetueue,
                ...Array.from(
                    { length: groupInitMemberGetList[0].pageCount },
                    (_$, index) => index + 1
                ).map((pageNum) => {
                    return {
                        ...info,
                        pageNum,
                    };
                }),
            ];

            // 移除等待
            groupInitMemberGetList = groupInitMemberGetList.slice(1);
        }
    }

    //////////////////////// 按队列调用接口
    // 最高并发6个
    if (groupInitInterfaceGetueue.filter((item) => item.isDoing).length < 6) {
        // 等待执行的列表
        const waitList = groupInitInterfaceGetueue.filter(
            (item) => !item.isDoing
        );

        // 有的等待处理的
        if (waitList.length > 0) {
            // 最多发起数量
            const maxSize =
                6 - (groupInitInterfaceGetueue.length - waitList.length);

            const num = maxSize < waitList.length ? maxSize : waitList.length;

            for (let i = 0; i < num; i++) {
                waitList[i].isDoing = true;

                // 同步详情
                if (waitList[i].type === "details") {
                    fnGroupDetailInit(waitList[i].id);
                } else {
                    // 同步群成员
                    fnMemberListGet(waitList[i]);
                }
            }
        }
    }
};

/**
 * 群初始化 延迟处理添加
 */
const fnInitDelayedAdd = (id) => {
    // 设置重新获取次数
    groupInitInfoList = groupInitInfoList.map((item) =>
        item.id === id
            ? { ...item, reReqTimes: (item.reReqTimes || 0) + 1 }
            : item
    );

    // 从队列移除
    groupInitInterfaceGetueue = groupInitInterfaceGetueue.filter(
        (item) => item.id !== id
    );

    // 移除详情获取
    groupInitDetailsGetList = groupInitDetailsGetList.filter(
        (item) => item !== id
    );

    // 移除群成员获取
    groupInitMemberGetList = groupInitMemberGetList.filter(
        (item) => item.id !== id
    );

    // 清理缓存的数据
    delete memberListObj[id];

    // 如果不在延迟排队中，添加延迟5秒等待排队
    if (groupInitDelayedList.some((item) => item.id === id)) {
        const info = groupInitInfoList.find(item.id === id);
        let time = 5000;

        // 如果是第二次则，5分钟后再获取
        if (info.reReqTimes === 2) {
            time = 1000 * 60 * 5;
        } else if (info.reReqTimes > 2) {
            // 如果已经获取两次了，就不再获取了
            groupInitInfoList = groupInitInfoList.filter(
                (item) => item.id !== id
            );
            return;
        }

        groupInitDelayedList.push({
            time: new Date().valueOf() + time,
        });
    }
};

/**
 * 群初始化 延迟列表
 */
const fnGroupInitDelayedList = () => {
    const now = new Date().getTime();
    for (const i in _.cloneDeep(groupInitDelayedList)) {
        if (groupInitDelayedList[i].time <= now) {
            groupInitDetailsGetList.push(groupInitDelayedList[i].id);
            delete groupInitDelayedList[i];
        }
    }
};

/**
 * 获取群详情
 */
const fnGroupDetailGet = (groupId) => {
    getGroupDetail({ groupId }).then((res) => {
      const { errCode } = res?.commonResult || {};
       // 无感知未开启：返回1021
       // 无感知已开启：返回12009
        if (res === 1021 || res === 12009 || errCode === 1021 || errCode === 12009) {
             eventBase.fnCommunicationSendMsg({
                operator: "groupUpdate",
                data: { type: "group", id: groupId, values: { id: groupId, isDisable: true } },
            });
            return;
        }

        if (res && res.group) {
            const info = fnGroupDataFormat([
                {
                    ...res.group,
                    // bfAddress: res.bfAddress,
                    bfAddress: true,
                    qrExpire: res.qrExpire,
                    qrUrl: res.qrUrl,
                    shortLink: res.shortLink,
                    memberType: res.memberType,
                    bfJoinCheck: Boolean(res.group.bfJoinCheck),
                    groupNotice: res.groupNotice || "",
                    bfResetQrcode: res.bfResetQrcode,
                    bfDisturb: res.bfDisturb, //免打扰状态
                    ...res.right,
                },
            ])[0];

            // 如果有设置群阅后即焚，则同步该信息
            if (info.bfGroupReadCancel) {
                eventCheduledCeletion.fnGroupMsgConfigRUD({
                    key: groupId,
                    value: info.groupMsgCancelTime,
                });
            }
            // console.log(info, '获取群详情 ---------》 1464',res)
            // 通讯
            eventBase.fnCommunicationSendMsg({
                operator: "groupUpdate",
                data: { type: "group", id: groupId, values: info },
            });
        }
    });
};
const fnIntoGroup = (groupId) => {
    // 进群就调用，获取最新的msgId
    return new Promise((resolve, reject) => {
        getGroupEventLatest({ groupId }, () => {}).then((lastInfo) => {
            if (lastInfo) {
                resolve(lastInfo);
                // console.log(
                //     "groupEventExecIdObj---1500: ----------->3分钟后进行比较",
                //     { groupEventExecIdObj, groupId, lastInfo }
                // );
                const keys = Object.keys(lastInfo);
                const keysArr = [
                    "updateMaxMsgId",
                    "unicastMaxMsgId",
                    "broadcastMaxMsgId",
                ];
                let curKey = null;
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (keysArr.includes(key)) {
                        curKey = keysArr.find((item) => item === key);
                        break;
                    }
                }
                let localId = null; // 本地数据库id
                let lastId = Number(lastInfo[curKey]); // 拉取的最大id
                switch (curKey) {
                    case "updateMaxMsgId":
                        localId = groupEventExecIdObj[groupId + "update"];
                        fnCompareMsgId({
                            localId,
                            type: "update",
                            lastId,
                            groupId,
                        });
                        break;
                    case "unicastMaxMsgId":
                        localId = groupEventExecIdObj[groupId + "unicast"];
                        fnCompareMsgId({
                            localId,
                            type: "unicast",
                            lastId,
                            groupId,
                        });
                        break;
                    case "broadcastMaxMsgId":
                        localId = groupEventExecIdObj[groupId + "broadcast"];
                        fnCompareMsgId({
                            localId,
                            type: "broadcast",
                            lastId,
                            groupId,
                        });
                        break;
                }
            }
        });
    });
};
function fnCompareMsgId({ localId, type, lastId, groupId }) {
    const eventType = { broadcast: 1, unicast: 2, update: 3 };
    // 如果拉取的最大id还是大于本地id,则请求补偿接口
    if (lastId > localId) {
        const params = {
            groupId: groupId,
            eventType: eventType[type],
            maxMsgId: lastId + 1,
            minMsgId: localId,
        };
        let index = 0;
        let timerGroupEvent = null;
        // console.log('补偿接口开始', {params})
        function groupEventList() {
            getGroupEventList(params).then(
                (res) => {
                    // console.log("存在丢失事件，补偿更新开始", { res, params });
                    if (res.commonResult.errCode == 200) {
                        // isCompensate这个字段表示已经补偿了
                        fnRnGroupEvent({
                            groupReqEventMsgDto: res.groupReqEventMsgDto,
                            groupUpdateEventMsgDto: res.groupUpdateEventMsgDto,
                        });
                    }
                    if (res.commonResult.errCode == 1098 && index < 3) {
                        // 返回1098状态码 则继续请求补偿，请求3次后则停止
                        index++;
                        clearTimeout(timerGroupEvent);
                        timerGroupEvent = setTimeout(() => {
                            groupEventList();
                        }, 500);
                    }
                    if (res.commonResult.errCode == 1099) {
                        // 服务端返回1099 则停止，服务端会推强制初始化
                        console.log(
                            "服务端返回1099 则停止，服务端会推强制初始化",
                            { res }
                        );
                        return;
                    }
                },
                (err) => {
                    console.log("补偿接口报错", { err });
                }
            );
        }

        groupEventList();
    }
}
/**
 * 群详情初始化
 */
const fnGroupDetailInit = (groupId) => {
    // console.log("fnGroupDetailInit >>>>>>>>>>>>>>>> 1494", groupId)
    getGroupEventLatest({ groupId }, () => {
        fnInitDelayedAdd(groupId);
    }).then((latestInfo) => {
        if (latestInfo) {
            // console.log('>>>>>>>>>>>>>>> 1659', {latestInfo,groupId})
            // 设置事件执行的最后的id信息
            groupEventExecIdObj[groupId + "broadcast"] = Number(
                latestInfo.broadcastMaxMsgId || 0
            );
            groupEventExecIdObj[groupId + "unicast"] =
                latestInfo.unicastMaxMsgId
                    ? Number(latestInfo.unicastMaxMsgId)
                    : 0;
            groupEventExecIdObj[groupId + "update"] = latestInfo.updateMaxMsgId
                ? Number(latestInfo.updateMaxMsgId)
                : 0;
            // console.log( groupEventExecIdObj[groupId + "unicast"])

            // 记录到本地
            groupEventExecIdObjToLocal();

            getGroupDetail({ groupId }, () => {
                fnInitDelayedAdd(groupId);
            }).then((res) => {
                // console.log(`[${groupId}]getGroupDetail--`,res)
                // 如果该群聊因违反相关规定，已被限制使用
                const { errCode } = res?.commonResult || {};
                  // 无感知未开启：返回1021
                  // 无感知已开启：返回12009
                 if (res === 1021 || res === 12009 || errCode === 1021 || errCode === 12009) {
                    // 通讯
                    eventBase.fnCommunicationSendMsg({
                        operator: "groupUpdate",
                        data: { type: "group", id: groupId, values: { id: groupId, isDisable: true } },
                    });

                    // 移除详情获取
                    groupInitDetailsGetList = groupInitDetailsGetList.filter(
                        (item) => item !== groupId
                    );

                    // 从队列移除
                    groupInitInterfaceGetueue =
                        groupInitInterfaceGetueue.filter(
                            (item) => item.id !== groupId
                        );

                    // 确认初始化完成
                    const initInfo = groupInitInfoList.find(
                        (item) => item.id === groupId
                    );

                    // 如果是推送过来的，则需要推送完成
                    if (initInfo) {
                        // 确认完成
                        receiveGroupEvent({
                            groupId,
                            receiptStatus: 3,
                            msgType: initInfo.msgType,
                            msgId: [initInfo.msgId],
                        });
                    }

                    // 清理初始化信息
                    groupInitInfoList = groupInitInfoList.filter(
                        (item) => item.id !== groupId
                    );
                    return;
                }

                if (res && res.group) {
                    const info = fnGroupDataFormat([
                        {
                            ...res.group,
                            // bfAddress: res.bfAddress,
                            bfAddress: true,
                            qrExpire: res.qrExpire,
                            qrUrl: res.qrUrl,
                            memberType: res.memberType,
                            bfJoinCheck: Boolean(res.group.bfJoinCheck),
                            groupNotice: res.groupNotice || "",
                            bfResetQrcode: res.bfResetQrcode,
                            ...res.right,
                        },
                    ])[0];

                    // 如果有设置群阅后即焚，则同步该信息
                    if (info.bfGroupReadCancel) {
                        eventCheduledCeletion.fnGroupMsgConfigRUD({
                            key: groupId,
                            value: info.groupMsgCancelTime,
                        });
                    }

                    // const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
                    // // 更新 MessageGroupList 缓存 (确保会话列表也存在)
                    // Cache(`${loginId}MessageGroupList`).then((list) => {
                    //     list = list || [];
                    //     const index = list.findIndex((item) => item.id === groupId && item.type === "group");
                    //     if (index === -1) {
                    //         // 如果会话列表不存在，构建一个新的会话项
                    //         const chatItem = {
                    //             id: groupId,
                    //             type: "group",
                    //             name: info.name,
                    //             pic: info.pic,
                    //             memberCount: info.memberCount,
                    //             time: Date.now(),
                    //             sendTime: Date.now(),
                    //             content: "加入群聊",
                    //             unreadCount: 0,
                    //             isTop: false,
                    //             isDisturb: false,
                    //         };

                    //         // 通知界面添加新会话
                    //         eventBase.fnCommunicationSendMsg({
                    //             operator: "msgNew",
                    //             operatorType: "groupJoin",
                    //             data: chatItem,
                    //         });
                    //     }
                    // });

                    setTimeout(() => {
                        // 通讯
                        eventBase.fnCommunicationSendMsg({
                            operator: "groupUpdate",
                            data: { type: "group", id: groupId, values: info },
                        });
                    }, 1000);

                    // 移除详情获取
                    groupInitDetailsGetList = groupInitDetailsGetList.filter(
                        (item) => item !== groupId
                    );

                    // 从队列移除
                    groupInitInterfaceGetueue =
                        groupInitInterfaceGetueue.filter(
                            (item) => item.id !== groupId
                        );

                    const pageCount = Math.ceil(info.memberCount / 1000);

                    // 群成员获取相关信息初始化
                    memberListObj = {
                        ...(memberListObj || {}),
                        [groupId]: {
                            reqRemainingTimes: pageCount,
                            memberCount: info.memberCount,
                            list: [],
                        },
                    };

                    // 添加群成员获取
                    groupInitMemberGetList.push({
                        id: groupId,
                        pageCount,
                        memberCount: info.memberCount,
                    });

                    const value = groupInitEvents[groupId + "broadcast"];
                    if (value && value.length > 0) {
                        const loginId = eventCommon.fnCommonInfoRU({
                            getId: "loginId",
                        });
                        fnGroupMsgEvent(value[0], loginId);
                    }

                    return;
                }

                // 如果该群已解散，则直接清理掉
                if (_.get(res, "commonResult.errCode") === 1023) {
                    // 移除详情获取
                    groupInitDetailsGetList = groupInitDetailsGetList.filter(
                        (item) => item !== groupId
                    );

                    // 从队列移除
                    groupInitInterfaceGetueue =
                        groupInitInterfaceGetueue.filter(
                            (item) => item.id !== groupId
                        );

                    // 确认初始化完成
                    const initInfo = groupInitInfoList.find(
                        (item) => item.id === groupId
                    );

                    // 如果是推送过来的，则需要推送完成
                    if (initInfo) {
                        // 确认完成
                        receiveGroupEvent({
                            groupId,
                            receiptStatus: 3,
                            msgType: initInfo.msgType,
                            msgId: [initInfo.msgId],
                        });
                    }

                    // 清理初始化信息
                    groupInitInfoList = groupInitInfoList.filter(
                        (item) => item.id !== groupId
                    );
                    return;
                }

                fnInitDelayedAdd(groupId);
            });
        } else {
            fnInitDelayedAdd(groupId);
        }
    });
};

/**
 * 获取群成员
 */
const fnMemberListGet = ({ id, pageNum }) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    getGroupMemberListV2(
        {
            groupId: id,
            pageSize: 1000,
            pageNum,
        },
        (err) => {
            console.log("接口异常", {
                groupId: id,
                pageSize: 1000,
                pageNum,
                err,
            });
            fnInitDelayedAdd(id);
        }
    ).then((res) => {
        // console.log(`[${id}]getGroupMemberListV2--`, res, {
        //     groupId: id,
        //     pageSize: 1000,
        //     pageNum,
        // })
        // console.log(res, 'getGroupMemberListV2 -----------> 1626')
        // 如果其他请求有异常，相关信息则已被清空，直接跳过处理
        if (memberListObj[id]) {
            // 剩余次数减1
            memberListObj[id].reqRemainingTimes =
                memberListObj[id].reqRemainingTimes - 1;

            if (res && res.members && res.members.length > 0) {
                // 更新列表
                memberListObj[id].list = [
                    ...memberListObj[id].list,
                    ...fnGroupMemberDataFormat(res.members),
                ];

                // 从队列移除
                groupInitInterfaceGetueue = groupInitInterfaceGetueue.filter(
                    (item) =>
                        item.id !== id ||
                        item.type !== "member" ||
                        item.pageNum !== pageNum
                );

                // 如果剩余次数不为0，则当前已操作已完成
                if (memberListObj[id].reqRemainingTimes !== 0) {
                    return;
                }

                // 记录到本地
                Cache(
                    `${loginId}_${id}_groupMemberList`,
                    memberListObj[id].list
                ).then(() => {
                    // 通知当前聊天窗口，群成员已更新
                    eventBase.fnCommunicationSendMsg({
                        operator: "memberListUpdate",
                        data: {
                            groupId: id,
                        },
                    });
                });

                // 清理缓存的数据
                delete memberListObj[id];

                // 确认初始化完成
                const initInfo = groupInitInfoList.find(
                    (item) => item.id === id
                );

                // 如果是推送过来的，则需要推送完成
                if (initInfo) {
                    // 确认完成
                    receiveGroupEvent({
                        groupId: id,
                        receiptStatus: 3,
                        msgType: initInfo.msgType,
                        msgId: [initInfo.msgId],
                    });
                }

                // 清理初始化信息
                groupInitInfoList = groupInitInfoList.filter(
                    (item) => item.id !== id
                );

                // 如果有阻塞的事件，则执行
                for (const type of ["broadcast", "unicast", "update"]) {
                    const value = _.cloneDeep(groupInitEvents[id + type]);

                    if (value) {
                        fnRnGroupEvent(
                            type === "update"
                                ? {
                                      groupUpdateEventMsgDto: value,
                                  }
                                : {
                                      groupReqEventMsgDto: value,
                                  },
                            true
                        );

                        // 清除阻塞的数据
                        delete groupInitEvents[id + type];
                    }
                }

                return;
            }

            // 添加延迟处理
            fnInitDelayedAdd(id);
        }
    });
};

// 群事件 最后执行的id 记录到本地
let timerGroupEventExecIdObjToLocal = null;

const groupEventExecIdObjToLocal = () => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    if (loginId) {
        Cache(`${loginId}-groupEventExecIdObj`, groupEventExecIdObj);
    }
};

const groupEventHandleMsg = (data) => {
    const customMsgId = generateUniqueId();
    const nowTime = Date.now();
    fnGroupAddMessageNotification({
        id: Number(data.targetId),
        chatType: 50,
        type: "group",
        content: data.commonResult.errMsg,
        customMsgId,
        MsgID: Number(customMsgId),
        msgId: Number(customMsgId),
        sendTime: nowTime,
        updateTime: nowTime,
        time: nowTime,
        pic: "",
        name: "",
        groupId: Number(data.targetId),
        messageProtocolId: data.messageProtocolId,
        readStatus: 0,
    });
};

/**
 * 群添加通知消息
 */
const fnGroupAddMessageNotification = (info, notificationType) => {
    const chatType = 50;

    let data = {
        id: info.groupId,
        time: info.updateTime,
        sendTime: info.sendTime,
        type: "group",
        targetId: 0,
        groupId: info.groupId,
        content: info.content,
        name: info.name,
        pic: info.pic,
        operator: "message",
        MsgID: "",
        chatType,
        msgType: chatType,
        notificationType,
        messageProtocolId: info.messageProtocolId,
    };

    data = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== "")
    );

    if (notificationType == "groupShutupAll") {
        data.bfShutup = info.bfShutup;
    }

    eventBase.fnCommunicationSendMsg({
        operator: "msgNew",
        operatorType: notificationType,
        data,
    });

    // 消息保存在本地
    eventBase.fnMsgAddToDB({
        id: info.groupId,
        ChatType: chatType,
        Content: "{}",
        MsgID: info.msgId,
        msgId: info.msgId,
        groupId: info.groupId,
        chatType,
        content: info.content,
        customMsgId: info.customMsgId,
        errorType: 0,
        msgType: chatType,
        sendTime: info.updateTime,
        source: 0,
        groupName: info.name,
        pic: info.pic,
    });
};

/**
 * 群事件补偿
 */
const fnEventReplenish = () => {
    // 如果已有三个补偿事件在执行，则暂停
    if (replenishingGroupEventKeyList.length >= 3) {
        return;
    }
    // console.log('groupEventObj >>>>>>>>>>>>>>> 1914', groupEventObj)
    for (const key of Object.keys(groupEventObj)) {
        // 如果到了执行时间，不在执行中
        const now = new Date().getTime();
        if (
            groupEventObj[key] &&
            now < groupEventObj[key].execTime &&
            !replenishingGroupEventKeyList.includes(key)
        ) {
            let { execIdList, events } = groupEventObj[key];

            // 补偿最大的id 参数，从后往前查看连贯性，只要有不连贯则为最大
            let maxMsgId = execIdList[execIdList.length - 1] + 1;
            for (let i = execIdList.length - 1; i >= 0; i--) {
                if (execIdList[i] === maxMsgId - 1) {
                    maxMsgId = execIdList[i];
                } else {
                    break;
                }
            }

            // 补偿最小的id 参数，从前往后查看连贯性
            let minMsgId = groupEventExecIdObj[key];
            for (const id of execIdList) {
                if (minMsgId + 1 === id) {
                    minMsgId = id;
                } else {
                    break;
                }
            }

            // 发现需要补偿的内容已经执行过，则清除补偿信息
            if (maxMsgId <= minMsgId) {
                delete groupEventObj[key];
            } else {
                ///////////////// 开始执行补偿

                // 添加补偿进行中
                replenishingGroupEventKeyList.push(key);

                // 获取最大消息id的信息
                const maxMsgInfo = events.find(
                    (item) => Number(item.commonMsgDto.msgId) === maxMsgId
                );

                const params = {
                    groupId: Number(
                        maxMsgInfo.commonMsgDto.groupBaseInfo.groupId
                    ),
                    eventType: maxMsgInfo.commonMsgDto.evenType,
                    maxMsgId,
                    minMsgId,
                };
                if (
                    JSON.stringify(params) ==
                    JSON.stringify(compensateParams[params.groupId])
                ) {
                    // 相同补偿参数，则不再补偿
                    return;
                }
                // 存储补偿参数
                compensateParams[params.groupId] = params;
                // console.log('补偿参数 >>>>>>>>>>>>> 2049', params)
                let index = 0;
                let timerGroupEvent = null;

                fnGroupEventList(params);
                // 补偿接口调用
                function fnGroupEventList(params) {
                    // 拉取补偿接口
                    getGroupEventList(params, () => {
                        /////////// 接口报错
                        // 1分钟之后再执行
                        if (groupEventObj[key]) {
                            groupEventObj[key].execTime =
                                new Date().getTime() + 1000 * 60;
                        }

                        // 移除进行中
                        replenishingGroupEventKeyList =
                            replenishingGroupEventKeyList.filter(
                                (item) => item !== key
                            );
                    }).then((res) => {
                        if (res.commonResult.errCode == 200) {
                            let isSuccess = false;
                            if (res) {
                                let list = [];
                                // console.log("res.groupReqEventMsgDto >>>>>>>>>>>> 1995", _.cloneDeep(res));
                                if (
                                    (key.includes("broadcast") ||
                                        key.includes("unicast")) &&
                                    res.groupReqEventMsgDto &&
                                    res.groupReqEventMsgDto.length > 0
                                ) {
                                    list = res.groupReqEventMsgDto;
                                } else if (
                                    key.includes("update") &&
                                    res.groupUpdateEventMsgDto &&
                                    res.groupUpdateEventMsgDto.length > 0
                                ) {
                                    list = res.groupUpdateEventMsgDto;
                                }

                                if (list.length > 0) {
                                    isSuccess = true;

                                    fnRnGroupEvent(
                                        key.includes("update")
                                            ? {
                                                  groupUpdateEventMsgDto: [
                                                      ...list,
                                                      ...events,
                                                  ],
                                              }
                                            : {
                                                  groupReqEventMsgDto: [
                                                      ...list,
                                                      ...events,
                                                  ],
                                              }
                                    );

                                    delete groupEventObj[key];
                                }
                            }

                            // 如果接口没有返回正确的数据 10秒再重新获取
                            if (!isSuccess) {
                                if (groupEventObj[key]) {
                                    groupEventObj[key].execTime =
                                        new Date().getTime() + 1000 * 10;
                                }
                            }

                            // 移除进行中
                            replenishingGroupEventKeyList =
                                replenishingGroupEventKeyList.filter(
                                    (item) => item !== key
                                );
                        }

                        if (res.commonResult.errCode == 1098 && index < 3) {
                            // 服务端返回1098，则重试，请求3次后则停止
                            index++;
                            clearTimeout(timerGroupEvent);
                            timerGroupEvent = setTimeout(() => {
                                fnGroupEventList(params);
                            }, 500);
                        }

                        if (res.commonResult.errCode == 1099) {
                            // 服务端返回1099，则停止，服务端会推强制初始化
                            return;
                        }
                    });
                }
            }
        }
    }
};

/**
 * 群清空
 */
const fnGroupClear = (groupId) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    // 清空群成员
    const cacheName = `${loginId}_${groupId}_groupMemberList`;
    Cache(cacheName, []);

    // 从群列表缓存中移除该群
    Cache(`${loginId}-GroupList`).then(groupList => {
        if (groupList && groupList.length > 0) {
            const hasGroup = groupList.some(item => item.id === groupId);
            if (hasGroup) {
                const updatedGroupList = groupList.filter(item => item.id !== groupId);
                Cache(`${loginId}-GroupList`, updatedGroupList);
            }
        }
    });

    // 清空 之前阻塞的补偿信息
    delete groupEventObj[groupId + "broadcast"];
    delete groupEventObj[groupId + "unicast"];
    delete groupEventObj[groupId + "update"];

    // 移除最后id
    delete groupEventExecIdObj[groupId + "broadcast"];
    delete groupEventExecIdObj[groupId + "unicast"];
    delete groupEventExecIdObj[groupId + "update"];

    // 到本地
    if (timerGroupEventExecIdObjToLocal) {
        clearTimeout(timerGroupEventExecIdObjToLocal);
    }

    timerGroupEventExecIdObjToLocal = setTimeout(
        groupEventExecIdObjToLocal,
        1000
    );
};

/**
 * 是否是加入群
 */
const fnIsJoinGroup = (item) => {
    // 邀请加入群 直接/同意
    if (
        item.groupReqStatus === 1 &&
        item.groupReqType === 1 &&
        item.commonMsgDto.msgType === 2
    ) {
        return true;
    }

    // 扫描加入群
    if (
        item.groupReqStatus === 1 &&
        item.groupReqType === 2 &&
        item.commonMsgDto.msgType === 2
    ) {
        return true;
    }

    // 名片加群
    if (
        item.groupReqStatus === 1 &&
        item.groupReqType === 15 &&
        item.commonMsgDto.msgType === 2
    ) {
        return true;
    }
    return false;
};

/**
 * 群成员数据格式化
 */
const fnGroupMemberDataFormat = (list) => {
    return list.map((item) => {
        const info = {
            id: longToNum(item.user.uid),
            type: item.type,
            nickName: item.user.nickName,
            icon: item.user.icon,
            identify: item.user.identify,
            depict: item.user.depict,
        };

        const name = _.get(item, "user.friendRelation.remarkName") || "";
        if (name !== "") {
            info.name = name;
        }
        const bfFriend = _.get(item, "user.friendRelation.bfFriend");
        if (bfFriend) {
            info.bfFriend = bfFriend;
        }
        const bfShow = _.get(item, "user.userOnOrOffline.bfShow");
        if (bfShow) {
            info.bfShow = bfShow;
        }
        const online = _.get(item, "user.userOnOrOffline.online");
        if (online) {
            info.online = online;
        }

        return info;
    });
};

/**
 * 群数据格式化
 */
const fnGroupDataFormat = (arr) => {
    return arr.map((item) => {
        return {
            id: longToNum(item.groupId),
            hostId: longToNum(item.hostId),
            name: item.name,
            pic: item.pic,
            groupAliasName: item.groupAliasName,
            memberCount: longToNum(item.memberCount),
            groupMsgCancelTime: item.groupMsgCancelTime || 30,
            hostId: Number(item.hostId),
            memberType: item.memberType,
            qrExpire: Number(item.qrExpire),
            qrUrl: item.qrUrl,
            bfShutup: Boolean(item.bfShutup),
            bfGroupReadCancel: Boolean(item.bfGroupReadCancel),
            bfJoinCheck: Boolean(item.bfJoinCheck),
            bfJoinFriend: Boolean(item.bfJoinFriend),
            shortLink: item.shortLink,
            // bfAddress: Boolean(item.bfAddress),
            bfAddress: true,
            groupNotice: item.groupNotice || "",
            bfPushNotice: item.bfPushNotice,
            bfSetAdmin: item.bfSetAdmin,
            bfResetQrcode: item.bfResetQrcode,
            bfUpdateData: item.bfUpdateData,
            bfDisturb: item.bfDisturb, //免打扰状态
        };
    });
};

/**
 * 群成员数据更新
 */
const fnGroupMemberDataUpdate = (memberInfoList, listNew) => {
    let ids = listNew.map((item) => item.id);
    let idAdd = ids;

    for (const i in memberInfoList) {
        if (ids.includes(memberInfoList[i].id)) {
            const index = ids.indexOf(memberInfoList[i].id);
            memberInfoList[i] = listNew[index];
            idAdd = idAdd.filter((item) => item !== memberInfoList[i].id);
        }
    }

    if (idAdd.length > 0) {
        memberInfoList = [
            ...memberInfoList,
            ...listNew.filter((item) => idAdd.includes(item.id)),
        ];
    }

    return memberInfoList;
};

/**
 * 群最后的执行id 同步
 */
const fnGroupEventExecIdObjGet = () => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    Cache(`${loginId}-groupEventExecIdObj`).then((res) => {
        if (res) {
            groupEventExecIdObj = res;
        }
    });
};

/**
 * 筛选入群消息并发送群邀请更新通知
 * 用于处理当前用户成功加入群聊的情况，通知群通知页面更新状态
 */
const fnCheckAndNotifyGroupInvitation = (data, loginId) => {
    // 获取群消息事件列表
    const groupReqEventMsgDto = data.groupReqEventMsgDto || [];

    if (groupReqEventMsgDto.length === 0) {
        return;
    }

    // 筛选符合条件的入群事件
    const validJoinEvents = groupReqEventMsgDto
        .filter((item) => {
            const { groupReqStatus, groupReqType, commonMsgDto, groupMember } = item;

            // 检查是否为入群事件 (groupReqType === 1 或 2 或 15)
            // 且状态为1（已同意/已加入）
            if (![1, 2, 15].includes(groupReqType) || groupReqStatus !== 1) {
                return false;
            }

            // 检查目标成员是否包含当前登录用户
            const isSelfJoined = groupMember && groupMember.some(
                (member) => Number(member.user.uid) === loginId
            );

            if (!isSelfJoined) {
                return false;
            }

            // 获取群ID
            const groupId = commonMsgDto?.groupBaseInfo?.groupId;
            if (!groupId) {
                return false;
            }

            return true;
        })
        .map((item) => {
            const { fromUid, receiveUid, groupReqStatus, groupReqType, commonMsgDto } = item;
            return {
                groupId: Number(commonMsgDto.groupBaseInfo.groupId),
                fromUid: Number(fromUid),
                receiveUid: Number(receiveUid),
                groupReqStatus,
                groupReqType
            };
        });

    // 如果没有符合条件的事件，直接返回
    if (validJoinEvents.length === 0) {
        return;
    }
    // 如果操作类型有效，发送一次群邀请更新通知
    eventBase.fnCommunicationSendMsg({
        operator: "groupInvitationUpdate",
        data: validJoinEvents
    });
};

/**
 * 群更新
 */
const fuGroupUpdate = ({ info, groups, chats }) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    const dataNew = {
        groups,
    };

    const index = groups.findIndex((item) => item.id === info.id);

    if (index === -1) {
        dataNew.groups.push(info);
    } else {
        dataNew.groups[index] = { ...dataNew.groups[index], ...info };
    }

    Cache(`${loginId}-GroupList`, groups);

    // 如果聊天信息不一致则更新聊天信息
    const chatIndex = chats.findIndex(
        (item) => item.id === info.id && item.type === "group"
    );

    if (chatIndex !== -1) {
        const updateInfo = objectComparisonUpdate(chats[chatIndex], info);
        if (updateInfo) {
            chats[chatIndex] = updateInfo;
            dataNew.chats = chats;
            Cache(
                `${loginId}MessageGroupList`,
                chats.filter((item) => item.type === "group")
            );
        }
    }

    return dataNew;
};

// 检查群是否初始化完成
async function fnCheckGroupMemberList(groupId) {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    const groupMemberList = await Cache(
        `${loginId}_${groupId}_groupMemberList`
    );

    // 同时也检查GroupList是否存在该群，如果不存在也需要初始化
    const groupList = await Cache(`${loginId}-GroupList`) || [];
    const inGroupList = groupList.some(item => item.id === groupId);

    if (groupMemberList && groupMemberList.length > 0 && inGroupList) {
        return true;
    }
    return false;
}

/**
 * 串型更新群成员
 */
const fnGroupMembersUpdateInSequence = async ({ groupIdList, id, name }) => {
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });
    const groupId = groupIdList[0];

    try {
        const groupMemberList = await Cache(
            `${loginId}_${groupId}_groupMemberList`
        );

        if (groupMemberList) {
            const index = groupMemberList.findIndex((item) => item.id === id);
            if (index !== -1) {
                groupMemberList[index].name = name;

                // 更新本地
                await Cache(
                    `${loginId}_${groupId}_groupMemberList`,
                    groupMemberList
                );
            }
        }
    } catch (err) {
        //
    }

    // 还有就继续更新
    if (groupIdList.length > 1) {
        await fnGroupMembersUpdateInSequence({
            groupIdList: groupIdList.slice(1),
            id,
            name,
        });
    }
};

/**
 * 是否保存到通讯录 设置
 */
const fnAddressSet = (info) => {
    const { id, bfAddress } = info;

    // 群
    GroupUpdate({
        op: 5,
        groupParam: { address: bfAddress, groupId: id },
    });
};

/**
 * 群 进群是否需要审核 设置
 */
const bfJoinCheckSet = (info) => {
    const { id, bfJoinCheck } = info;

    GroupUpdate({
        op: 6,
        groupParam: { joinCheck: bfJoinCheck, groupId: id },
    });
};

/**
 * 群 进群是否需要审核 设置
 */
const bfJoinFriendSet = (info) => {
    const { id, joinFriend } = info;

    GroupUpdate({
        op: 10,
        groupParam: { joinFriend, groupId: id },
    });
};

/**
 *群简介设置
 */
const fnNoticeSet = (info) => {
    const { id, notice, bfAll } = info;

    GroupUpdate({
        op: 12,
        groupParam: notice
            ? { notice, bfAll, groupId: id }
            : { groupId: id, bfAll },
    });
};

/**
 * 时间反复执行
 */
const fnTimer = () => {
    // 运行初始化
    fnRunInit();

    // 补偿
    fnEventReplenish();

    // 初始化延迟执行事件
    fnGroupInitDelayedList();
};

export default {
    fnRnGroupEvent,
    fnGroupEventExecIdObjGet,
    fnGroupMemberDataFormat,
    fnGroupDataFormat,
    fnGroupMemberDataUpdate,
    fnTimer,
    fnGroupAddMessageNotification,
    fuGroupUpdate,
    fnGroupMembersUpdateInSequence,
    fnGroupDetailInit,
    fnGroupDetailGet,
    fnAddressSet,
    bfJoinCheckSet,
    bfJoinFriendSet,
    fnNoticeSet,
    groupEventHandleMsg,
    fnIntoGroup,
};
