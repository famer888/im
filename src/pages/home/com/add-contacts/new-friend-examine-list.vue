<template>
    <div class="new-friend-list-box">
        <ul class="new-friend-list">
            <li class="new-friend-item" v-for="(item, index) in listData" :key="index">
                <div class="left">
                    <ComImage :src="item.icon" type="friend" class="head-icon" />
                    <div class="info">
                        <div class="row1">
                            <span class="name">{{ item.userInfo?.nickName }}</span>
                            <span class="time">{{ chatTime(item.modifyTime) }}</span>
                        </div>
                        <div class="msg">{{ item.msg }}</div>
                    </div>
                </div>
                <div class="right">
                    <div class="primaryBtn small" v-if="type === 'unRecord'" @click="showVerify(item)">验证</div>
                    <div class="cancelBtn" v-else>已同意</div>
                </div>
            </li>
        </ul>

        <NewFriendVerify v-if="verifyVisible" :info="verifyInfo"></NewFriendVerify>
    </div>
</template>

<script>
import { chatTime } from "@/utils/base";
import NewFriendVerify from "./new-friend-verify";
export default {
    name: "newFriendExamine",
    props: ['listData', 'type'],
    components: { NewFriendVerify },
    data() {
        return {
            chatTime,
            verifyVisible: false,
            verifyInfo: {},
        }
    },
    methods: {
        showVerify(info) {
            this.verifyInfo = info;
            this.verifyVisible = true;
        }
    }
}
</script>

<style lang="scss" scoped>
.new-friend-list {
    background: #fff;
    border-radius: 4px;
    padding: 0 10px;
    box-sizing: border-box;
}

.new-friend-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 54px;
    border-bottom: 1px solid #f2f2f2;

    &:last-child {
        border: none;
    }

    .head-icon {
        width: 34px;
        height: 34px;
    }

    .left {
        display: flex;

        .info {
            margin-left: 10px;
        }
    }

    .row1 {
        display: flex;
        align-items: center;

        .name {
            font-size: 12px;
            color: #000;
        }

        .time {
            font-size: 12px;
            color: #B9BABE;
            margin-left: 12px;
        }
    }

    .msg {
        font-size: 12px;
        color: #B9BABE;
        margin-top: 4px;
    }

    .primaryBtn {
        width: 66px;
        height: 24px;
        padding: 0;
        line-height: 24px;
    }

    .cancelBtn {
        width: 66px;
        height: 24px;
        border: 1px solid #B9BABE;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #B9BABE;
        font-size: 14px;
        border-radius: 4px;
        cursor: default;
    }

}
</style>