
import { getChannelUsers, getChannelManages, getHistoryDomain, isChannelLink } from "@/api/imChannel";
import { groupQrCode, groupQrUrlFromShortLink, queryGroupLink } from "@/api/imGroup";
import sharePromise from "./sharePromise";
import eventBase from "@/event/base";
import eventCommon from "@/event/common";

class InviteLink {
  link = '';
  // 1. group 2. channel
  type = '';
  constructor({ link, fallback }) {
    this.link = link;
    this.fallback = fallback || this.fallback;
  }
  async getInviteLinkType() {
    const { data, code } = await sharePromise({ tag: 'getInviteLink', ttl: 86400000, method: getHistoryDomain, args: {}});
    if (code === 200) {
      const target = data.find(x => {
        return [x.currentDomain, ...x.historyDomainList].some(cx => {
          return new URL(this.link).host === new URL(cx).host
        });
      });
      return Number(target?.type || 0);
    } else {
      return 0;
    }
  }
  async getGroupLinkFromShortLink() {
    // 已经是长链无需转化，直接返回
    if(['qrCode', 'IdCode'].some(x => this.link.includes(x))) {
      return this.link;
    }
    const data = await groupQrUrlFromShortLink({ shortLink: this.link });
    if (data?.commonResult?.errCode === 200) {
      return data.qrUrl || '';
    } else {
      throw new Error('获取群链接失败：' + data?.commonResult?.errMsg);
    }
  }
  translateGroupLink(qrUrl) {
    const { qrCode, imQrCodeType, IdCode, fromUid } = Object.fromEntries(new URL(qrUrl).searchParams);
    return { qrCode, imQrCodeType, IdCode, fromUid, qrUrl };
  }
  async getGroupInfoByLink({ qrCode, IdCode, groupId }) {
    const data = await queryGroupLink({ qrCode, IdCode, groupId });
    // 禁用toast 根据app写的提示语
    if(data === 1021){
      const globalConfig = eventCommon.fnGlobalConfigGet();
      let isSilentDisabled = globalConfig.group?.disableUnperceived;

      if (isSilentDisabled) {
        window.$toast("请联系客服#00001");
      }
    }
    if (data?.commonResult?.errCode === 200) {
      return data;
    } else {
      throw new Error('获取群信息失败：' + data?.commonResult?.errMsg);
    }
  }
  redirectGroup(groupInfo) {
    // GroupDetailFromQrCodeResp → 格式化为下游需要的结构
    // 从 groupBase 中提取群基本信息
    const groupBase = groupInfo?.groupBase || {};
    const formatted = {
      id: Number(groupBase.groupId),
      name: groupBase.name,
      pic: groupBase.pic,
      hostId: Number(groupBase.hostId),
      memberCount: Number(groupBase.memberCount),
      bfJoinCheck: groupBase.bfJoinCheck,
      bfJoinFriend: groupBase.bfJoinFriend,
      bfShutup: groupBase.bfShutup,
      bfGroupReadCancel: groupBase.bfGroupReadCancel,
      groupMsgCancelTime: groupBase.groupMsgCancelTime,
      groupAliasName: groupBase.groupAliasName,
      addToken: groupInfo.addToken,
      bfMember: groupInfo.bfMember,
      remark: groupBase.notice,
    };

    if (groupInfo?.bfMember) {
      // 已加入 → 直接跳转聊天窗口
      eventBase.fnCommunicationSendMsg({
        operator: "activeChange",
        data: {
          ...formatted,
          type: "group",
          comType: "chat",
          showTip: true,
        },
      });
    } else {
      // 未加入 → 打开加入弹窗
      eventBase.fnCommunicationSendMsg({
        operator: 'openGroupDialog',
        data: { values: formatted },
      });
    }
  }
  async getChannelInfoByLink() {
    const { data } = await isChannelLink({ link: this.link });
    return data;
  }
  redirectChannel(info) {
    if (!info) {
      return window.$toast(data?.msg || '此频道已失效或过期');
    }
    // 公开频道或已加入 → 直接跳转聊天窗口
    if (!info.linkType || info.memberType) {
      eventBase.fnCommunicationSendMsg({
        operator: 'activeChange',
        data: {
          ...info,
          id: info.channelId,
          name: info.channelName,
          type: 'channel',
          showTip: true,
          comType: 'detailsChannel',
        },
      });
    } else {
      // 私密频道 → 打开加入弹窗
      eventBase.fnCommunicationSendMsg({
        operator: 'openChannelDialog',
        data: { values: info },
      });
    }
  }
  // 普通链接直接打开
  redirectNormal() {
    window.open(this.link);
  }

  fallback(error) {
    console.log('邀请连接解析失败：' + error.message || err);
    this.type === 1 && window.$toast('邀请连接解析失败：' + error.message || err);
    window.open(this.link);
  }
  // pipeline第一个方法入参为空，出-》入链式调用
  async pipeline(tasks) {
    let result;
    for (const task of tasks) {
      result = await task.call(this, result);
    }
    return result;
  }
  // 外部调用方法，如果你要用其他，构造自己的pipeline即可
  async redirect() {
    try {
      const linkType = this.type = await this.getInviteLinkType();
      const pipeline = [
        [this.redirectNormal],
        [this.getGroupLinkFromShortLink, this.translateGroupLink, this.getGroupInfoByLink, this.redirectGroup],
        [this.getChannelInfoByLink, this.redirectChannel],
      ][linkType];
      return this.pipeline(pipeline);
    } catch(error) {
      return this.fallback(error);
    }
  }
}

export default InviteLink;
