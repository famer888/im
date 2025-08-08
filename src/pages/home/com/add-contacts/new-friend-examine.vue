<template>
    <div class="new-friend-examine">
        <div class="title">新的朋友</div>
        <div v-if="loadState === 1" class="loading">loading..</div>
        <div v-else-if="loadState === 2" class="loading">数据获取失败</div>
        <div v-else-if="loadState === 3" class="loading">
            <img class="icon-no-data" src="@/assets/images/common/search-no-data.png" />
            <div>无数据</div>
        </div>
        <template v-else>
            <div class="list-title">待处理</div>
            <newFriendExamineList :listData="unRecordList" type="unRecord" @reloadData="getList"></newFriendExamineList>
            <div class="list-title">近期请求</div>
            <newFriendExamineList :listData="recordList" @reloadData="getList"></newFriendExamineList>
        </template>
    </div>
</template>

<script>
import newFriendExamineList from "./new-friend-examine-list";
import { getContactsApplyList } from "@/api/imContacation.js";

// 事件
import eventBase from "@/event/base";

export default {
    name: "newFriendExamine",
    components: { newFriendExamineList },
    data() {
        return {
            recordList: [],
            unRecordList: [],
            loadState: 1, //0：成功，1：加载中，2：加载失败，3：空的
        }
    },
    mounted() {
        this.getList()
        this.handleEventMonitor()
    },
    methods: {
        /**
        * 事件监听
        */
        handleEventMonitor() {
            eventBase.fnCommunicationMonitoring(
                "newFriend",
                [
                    "newFriendReq", // 好友信息更新
                ],
                this.eventHandling
            );
        },
        /**
        * 处理事件
        */
        eventHandling(info, operator, operatorType) {
            console.log({ info, operator, operatorType }, "newFriend --------> 220");
            switch (operator) {
                case "newFriendReq":
                    this.getList()
                    break;
                default:
            }
        },
        getList() {
            getContactsApplyList().then(res => {
                const { errCode } = res?.commonResult || {}
                if (errCode != 200) {
                    this.loadState = 2;
                    return;
                }
                this.recordList = res?.recordList || [];
                this.unRecordList = res?.unRecordList || [];
                if (this.recordList.length || this.unRecordList.length) {
                    this.loadState = 0
                } else {
                    this.loadState = 3
                }
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

.loading {
    text-align: center;
    margin-top: 100px;
}
</style>