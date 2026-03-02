<template>
    <div class="add-contacts-detail">
        <!-- 联系人 -->
        <template v-if="info.groupOrUserType === 1">
            <ComImage :src="targetUserInfo.icon" type="friend" class="icon" />
            <span class="name">{{ targetUserInfo.nickName }}</span>
            <template v-if="!isOwn">
                <div class="primaryBtn" v-if="isFriend" @click="handleToFriendChat()">
                    {{ $t("发送消息") }}
                </div>
                <div class="primaryBtn" v-else @click="showVerify(targetUserInfo)">
                    添加
                </div>
            </template>
        </template>
        <!-- 群聊 -->
        <template v-else>
            <ComImage :src="targetGroupInfo.pic" type="group" class="icon" />
            <span class="name">{{ targetGroupInfo.name }}</span>
            <span class="member-count">共{{ targetGroupInfo.memberCount }}人</span>
            <div class="primaryBtn" v-if="isGroupMember" @click="handleToChat(targetGroupInfo)">{{ $t("发送消息") }}</div>
            <div class="primaryBtn" v-else @click="addGroup()">加入群聊</div>
        </template>

        <addVerifyDialog v-if="verifierVisble" :defalutValue="verifyValue" @close="verifierVisble = false"
            @confirm="verifyConfirm" />
    </div>
</template>

<script>
//接口
import { contactsRelation } from "@/api/imContacation.js";
import { groupJoin } from "@/api/imGroup";

//组件
import addVerifyDialog from "./add-verify-dialog";

// 事件
import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
    name: "addContactsDetail",
    components: {
        addVerifyDialog
    },
    props: ['info', 'groupList'],
    data() {
        return {
            verifierVisble: false,
            verifyValue: '',
            addInfo: {},
            loginInfo: {},
            isFriendDeleted: false, // 标记好友是否被删除
        }
    },
    computed: {
        targetGroupInfo() {
            return this.info?.groupBase || {}
        },
        targetUserInfo() {
            return this.info?.userInfo || {}
        },
        targetUser() {
            return this.info || {}
        },
        targetGroup() {
            return this.info || {}
        },
        isOwn() {
            return this.targetUserInfo?.uid == this.loginInfo?.id
        },
        isFriend() {
            // 如果好友被删除，返回 false
            if (this.isFriendDeleted) {
                return false;
            }
            return this.targetUserInfo.friendRelation?.bfFriend;
        },
        isGroupMember() {
           const groupId = Number(this.targetGroupInfo?.groupId)
           const list = this.groupList || []
           if(groupId && list.length) {
             return list.some(item => item.id === groupId)
           } else {
             return false
           }
        }
    },
    watch: {
        // 监听 info 变化，重置状态
        info: {
            handler(newVal) {
                // 重置好友删除状态
                this.isFriendDeleted = false;
            },
            immediate: false
        }
    },
    mounted() {
        this.loginInfo = eventCommon.fnCommonInfoRU({
            getId: "loginInfo",
        });
        // 监听好友删除事件，以便在好友被删除时更新状态
        eventBase.fnCommunicationMonitoring(
            "addContactsDetail",
            ["deleteFriend"],
            this.handleNotification
        );
    },
    beforeDestroy() {
        // 移除事件监听
        eventBase.fnCommunicationMonitoring("addContactsDetail", null, null);
    },
    methods: {
        handleNotification(info, operator, operatorType) {
            if (operator === "deleteFriend") {
                // 当好友被删除时，检查是否是当前显示的联系人
                const targetUid = Number(this.targetUserInfo?.uid);
                if (targetUid && info.id === targetUid) {
                    this.isFriendDeleted = true;
                }
            }
        },
        /**
         * 到群聊天窗
         */
        handleToChat(info) {
            if(!info.groupId) {
              return window.$toast('群ID异常')
            }
            const data = {
                id: Number(info.groupId),
                pic: info.pic || "",
                name: info.name || info.nickName,
                type: "group",
                comType: "chat",
            };

            // console.log('>>>>>>>>>>>>>>>>> 99 detail/group data', data)
            eventBase.fnCommunicationSendMsg({
                operator: "activeChange",
                data,
            });
        },
        /**
         * 到好友聊天窗
         */
        handleToFriendChat() {
            const { uid, nickName, icon, friendRelation } = this.targetUserInfo;
            eventBase.fnCommunicationSendMsg({
                operator: "activeChange",
                data: {
                    id: Number(uid),
                    name: friendRelation?.remarkName || nickName,
                    pic: icon,
                    type: "friend",
                    comType: "chat",
                },
            });
        },
        showVerify(info) {
            // console.log(info, this.loginInfo, this.info)
            this.verifyValue = '我是' + this.loginInfo?.name || '';
            this.verifierVisble = true;
            this.addInfo = info;

        },
        verifyConfirm(msg) {
            console.log('verifyConfirm--', msg)
            this.verifyValue = msg
            if (this.info.groupOrUserType == 1) {
                this.addFriend()
            } else {
                this.addGroup()
            }
        },
        addFriend() {
            const pra = {
                targetUid: Number(this.targetUserInfo.uid),
                msg: this.verifyValue,
                type: 0,
                op: 0,
                addToken: this.targetUser.addToken
            }
            console.log("contactsRelation--", pra)
            contactsRelation(pra).then(res => {
                const { errCode } = res?.commonResult || {}
                if (errCode == 200) {
                    window.$toast('已向对方发送添加申请')
                    this.verifierVisble = false;
                } else {
                    window.$toast(res?.errorDesc || '发送失败，请稍后尝试')
                }
                console.log('contactsRelation--', res, errCode)
            })
        },
        addGroup() {
            groupJoin({
                groupId: Number(this.targetGroupInfo.groupId),
                reqType: 15,
                addToken: this.targetGroup.addToken,
                msg: "申请加入群聊",
            }).then((res) => {
                const { errMsg, errCode } = res?.commonResult || {};
                if (errCode != 200) {
                    window.$toast(errMsg || res?.errorDesc || this.$t("加入群聊失败"));
                } else {
                    if (this.targetGroupInfo.bfJoinCheck) {
                        // 入群需要验证
                        window.$toast(this.$t("已向群主发送申请，等待群主审核"));
                    } else {
                        window.$toast(this.$t("加入群聊成功"));
                        setTimeout(() => {
                           this.$emit("close");
                           this.handleToChat(this.targetGroupInfo);
                        }, 500)
                    }
                }
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.add-contacts-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 96px;

    .icon {
        width: 108px;
        height: 108px;
        border-radius: 100%;
    }

    .name {
        font-size: 24px;
        color: #000;
        margin-top: 16px;
    }

    .primaryBtn {
        width: 256px;
        margin-top: 20px;
    }

    .member-count {
        font-size: 12px;
        color: #979797;
        margin-top: 6px;
        background: #f6f6f6;
        padding: 4px 10px;
        border-radius: 99px;
        min-width: 60px;
        text-align: center;
    }
}
</style>
