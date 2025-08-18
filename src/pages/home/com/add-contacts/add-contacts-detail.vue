<template>
    <div class="add-contacts-detail">
        <!-- 联系人 -->
        <template v-if="info.groupOrUserType === 1">
            <ComImage :src="targetUserInfo.icon" type="friend" class="icon" />
            <span class="name">{{ targetUserInfo.nickName }}</span>
            <div class="primaryBtn" v-if="targetUserInfo.friendRelation?.bfFriend" @click="handleToFriendChat()">
                {{ $t("发送消息") }}
            </div>
            <div class="primaryBtn" v-else @click="showVerify(targetUserInfo)">
                添加
            </div>
        </template>
        <!-- 群聊 -->
        <template v-else>

            <ComImage :src="targetGroupInfo.pic" type="group" class="icon" />
            {{ targetGroupInfo }}
            <span class="name">{{ targetGroupInfo.name }}</span>
            <span class="member-count">共{{ targetGroupInfo.memberCount }}人</span>
            <div class="primaryBtn" v-if="targetGroupInfo.bfJoinFriend" @click="handleToChat(targetGroupInfo)">{{
                $t("发送消息") }}</div>
            <div class="primaryBtn" v-else @click="showVerify(targetGroupInfo)">加入群聊</div>
        </template>

        <addVerifyDialog v-if="verifierVisble" :defalutValue="verifyValue" @close="verifierVisble = false"
            @confirm="verifyConfirm" />
    </div>
</template>

<script>
//接口
import { contactsRelation } from "@/api/imContacation.js";

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
    props: ['info'],
    data() {
        return {
            verifierVisble: false,
            verifyValue: '',
            addInfo: {},
            loginInfo: {},
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
        }
    },
    mounted() {
        this.loginInfo = eventCommon.fnCommonInfoRU({
            getId: "loginInfo",
        });
    },
    methods: {
        /**
         * 到群聊天窗
         */
        handleToChat(info) {
            if(!info.groupId) {
              return window.$toast('群ID异常')
            }
            const data = {
                id: Number(info.groupId) ,
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
            console.log(info, this.loginInfo, this.info)


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
                    window.$toast('发送失败，请稍后尝试')
                }
                console.log('contactsRelation--', res, errCode)
            })
        },
        addGroup() {
            const pra = {
                groupId: Number(this.targetGroupInfo.groupId),
                msg: this.verifyValue,
                type: 0,
                op: 0,
                addToken: this.targetGroup.addToken
            }
            contactsRelation(pra)
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