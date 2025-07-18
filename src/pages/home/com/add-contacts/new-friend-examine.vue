<template>
    <div class="new-friend-examine">
        <div class="title">新的朋友</div>
        <div class="list-title">待处理</div>
        <newFriendExamineList :listData="unRecordList" type="unRecord"></newFriendExamineList>
        <div class="list-title">近期请求</div>
        <newFriendExamineList :listData="recordList"></newFriendExamineList>
    </div>
</template>

<script>
import newFriendExamineList from "./new-friend-examine-list";
import { getContactsApplyList } from "@/api/imContacation.js";
export default {
    name: "newFriendExamine",
    components: { newFriendExamineList },
    data() {
        return {
            recordList: [],
            unRecordList: [],
        }
    },
    mounted() {
        this.getList()
    },
    methods: {
        getList() {
            getContactsApplyList().then(res => {
                this.recordList = res?.recordList || [];
                this.unRecordList = res?.unRecordList || [];
                console.log('getContactsApplyList--', res)
            })
        }
    }
}
</script>

<style scoped lang="scss">
.new-friend-examine {
    width: 100%;
    height: 100%;
    background: #F6F6F6;
    margin-top: 20px;
    overflow-y: auto;

    .title {
        font-size: 14px;
        color: #000;
        padding: 20px;
        box-sizing: border-box;
        background: #fff;
    }

    .list-title {
        font-size: 14px;
        color: #B9BABE;
        margin: 20px 0;
        padding: 0 10px;
        box-sizing: border-box;
    }
}
</style>