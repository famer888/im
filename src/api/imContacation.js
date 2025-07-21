/**
 *功能：联系人接口
 *作者：long
 *时间：2022年10月01日 16:28:44
 *版本：v1.3.0
 * */
import { getUrl, baseUrl } from "./base/unit";

// 获取好友列表
export const getContactsList = (data, errCallback) =>
    getUrl(
        {
            type: "ContactsList",
            url: `${baseUrl()}/contacts/contactsList`,
            data,
        },
        errCallback
    );
// 获取联系人详情
export const getContactsDetail = (data) =>
    getUrl({
        type: "ContactsDetail",
        url: `${baseUrl()}/contacts/contactsDetail`,
        data,
    });
// 获取联系人申请列表
export const getContactsApplyList = (data) =>
    getUrl({
        type: "ContactsApplyList",
        url: `${baseUrl()}/contacts/contactsApplyList`,
        data,
    });
// 更新联系人关系 （申请添加好友）
export const contactsRelation = (data) =>
    getUrl({
        type: "ContactsRelation",
        url: `${baseUrl()}/contacts/contactsRelation`,
        data,
    });
// 处理联系人申请  （同意/拒绝）
export const updateContactsApply = (data) =>
    getUrl({
        type: "UpdateContactsApply",
        url: `${baseUrl()}/contacts/updateContactsApply`,
        data,
    });
// 加入黑名单
export const updateBlackContacts = (data) =>
    getUrl({
        type: "UpdateBlackContacts",
        url: `${baseUrl()}/contacts/updateBlackContacts`,
        data,
    });
