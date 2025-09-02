/**
 *功能：群组接口
 *作者：long
 *时间：2022年10月01日 16:28:44
 *版本：v1.3.0
 * */
import { getUrl, baseUrl } from "./base/unit";

// 获取群列表
export const getGroupContactList = (data, errCallback) =>
    getUrl(
        {
            type: "GroupContactList",
            url: `${baseUrl()}/group/groupContactList`,
            data,
        },
        errCallback
    );
// 获取群详情
export const getGroupDetail = (data, errCallback) =>
    getUrl(
        {
            type: "GroupDetail",
            url: `${baseUrl()}/group/groupDetail`,
            data,
        },
        errCallback
    );
// 获取群成员列表
export const getGroupMemberList = (data, errCallback) =>
    getUrl(
        {
            type: "GroupMemberList",
            url: `${baseUrl()}/group/groupMemberList`,
            data,
        },
        errCallback
    );
// 获取群成员列表
export const getGroupMemberListV2 = (data, errCallback) =>
    getUrl(
        {
            type: "GroupMemberList",
            protoType: "group",
            url: `${baseUrl()}/group/groupMemberListV2`,
            data,
        },
        errCallback
    );
// 获取最新事件消息ID接口
export const getGroupEventLatest = (data, errCallback) =>
    getUrl(
        {
            type: "GroupEventLatest",
            protoType: "group_message",
            url: `${baseUrl()}/group/groupEventLatest`,
            data,
        },
        errCallback
    );

// 新增删除群
export const GroupMember = (data) =>
    getUrl({
        type: "GroupMember",
        url: `${baseUrl()}/group/groupMember`,
        data,
    });
// 修改群设置
export const GroupUpdate = (data) =>
    getUrl({
        type: "GroupUpdate",
        url: `${baseUrl()}/group/groupUpdate`,
        data,
    });
// 获取群消息列表
export const getGroupReqList = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupReqList`,
        data,
    });
// 获取群消息列表
export const getGroupReqListV2 = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupReqListV2`,
        data,
    });
// 编辑群聊
export const groupMsgReceipt = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupMsgReceipt`,
        data,
    });
// 审核
export const groupCheckJoin = (data) =>
    getUrl({
        type: "GroupCheckJoin",
        url: `${baseUrl()}/group/groupCheckJoin`,
        data,
    });
// 入群邀请审核
export const GroupUserCheckJoin = (data) =>
    getUrl({
        type: "GroupUserCheckJoin",
        url: `${baseUrl()}/group/groupUserCheckJoin`,
        data,
    });
// 删除群申请记录
// export const DelGroupReqRecord = (data) =>
//     getUrl({
//         type: "DelGroupReqRecord",
//         url: `${baseUrl()}/group/delGroupReqRecord`,
//         data,
//     });

// 绑定机器人
export const groupBindBot = (data) => {
    return getUrl({
        type: "WebGroupBindBot",
        url: `${baseUrl()}/group/groupBindBot`,
        data,
    });
};
// 移除群管理
export const groupRemoveAdmin = (data) => {
    return getUrl({
        type: "GroupRemoveAdmin",
        url: `${baseUrl()}/group/groupRemoveAdmin`,
        data,
    });
};
// 通过群别名查群详情或通讯号查用户详情
export const groupOrUserDetail = (data) => {
    return getUrl({
        type: "GroupOrUser",
        url: `${baseUrl()}/group/groupOrUserDetail`,
        data,
    });
};
// 加入群聊
export const groupJoin = (data) => {
    return getUrl({
        protoType: "group",
        type: "GroupJoin",
        url: `${baseUrl()}/group/groupJoin`,
        data,
    });
};

// 获取群二维码
export const groupQrCode = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupQrCode",
        url: `${baseUrl()}/group/groupQrCode`,
        data,
    });

// 获取和好友共同群信息
export const getfriendCommonGroupList = (data) =>
    getUrl({
        type: "FriendCommonGroupList",
        url: `${baseUrl()}/group/friendCommonGroupList`,
        data,
    });

// 获取补偿信息
export const getGroupEventList = (data, errCallback) =>
    getUrl(
        {
            protoType: "group_message",
            type: "GroupEvent",
            url: `${baseUrl()}/group/groupEventList`,
            data,
        },
        errCallback
    );

// 群成员在线状态
export const groupMemberOnLineStatusList = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupMemberOnLineStatusList",
        url: `${baseUrl()}/group/groupMemberOnLineStatusList`,
        data,
    });

// 强制群初始化接口
export const groupEventForceInit = (data, errCallback) =>
    getUrl(
        {
            protoType: "group_message",
            type: "GroupEventForceInit",
            url: `${baseUrl()}/group/groupEventForceInit`,
            data,
        },
        errCallback
    );

// 查询群链接
export const queryGroupLink = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupDetailFromQrCode",
        url: `${baseUrl()}/group/groupDetailFromQrCode`,
        data,
    });
    
// 群别名查询群
export const groupSearch = (data) =>
    getUrl({
        type: "GroupOrUser",
        url: `${baseUrl()}/group/groupSearch`,
        data,
    });

// 解散群聊
export const disableGroup = (data) =>
    getUrl({
        protoType: "group",
        type: "DisableGroup",
        url: `${baseUrl()}/group/disableGroup`,
        data,
    });

// 退出群聊
export const groupExit = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupExit",
        url: `${baseUrl()}/group/groupExit`,
        data,
    });
