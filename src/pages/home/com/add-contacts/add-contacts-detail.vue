<template>
    <div class="add-contacts-detail">
        <!-- 联系人 -->
        <template v-if="info.groupOrUserType === 1">
            <ComImage :src="targetUserInfo.icon" type="friend" class="icon" />
            <span class="name">{{ targetUserInfo.nickName }}</span>
            <div class="primaryBtn" @click="showVerify(targetUserInfo)">
                添加
            </div>
        </template>
        <!-- 群聊 -->
        <template v-else>
            <ComImage :src="targetUserInfo.pic" type="group" class="icon" />
            <span class="name">放大范德萨</span>
            <span class="member-count">共{{ targetGroupInfo.memberCount }}人</span>
            <div class="primaryBtn" @click="showVerify(targetGroupInfo)">
                加入群聊
            </div>
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
            return this.info?.groupDetail?.groupBase || {}
        },
        targetUserInfo() {
            return this.info?.targetUser?.userInfo || {}
        },
        targetUser() {
            return this.info?.targetUser || {}
        },
        targetGroup() {
            return this.info?.groupDetail || {}
        }
    },
    mounted() {
        this.loginInfo = eventCommon.fnCommonInfoRU({
            getId: "loginInfo",
        });
        console.log('addContactsDetail--', this.info)
    },
    methods: {
        showVerify(info) {
            console.log(info, this.loginInfo, this.info)


            this.verifyValue = '我是' + this.loginInfo?.name || '';
            this.verifierVisble = true;
            this.addInfo = info;

        },
        verifyConfirm(msg) {
            console.log('verifyConfirm--', msg)
            this.verifyValue = msg
            if(this.info.groupOrUserType == 1) {
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
                console.log('contactsRelation--', res)
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