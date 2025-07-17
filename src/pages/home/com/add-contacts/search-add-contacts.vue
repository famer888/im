<template>
    <div class="search-add-contacts">
        <div class="add-tip" v-if="searchText" @click="searchContacts">
            <img class="icon" src="@/assets/images/headNav/search-icon.png" alt="" />
            <span> {{ $t('搜索') + searchText }} </span>
        </div>
        <div class="tabs" v-if="searchResult">
            <div class="tab-item" :class="{ 'tab-action': item.key === tabAction }" v-for="(item, key) in tabList"
                :key="key" @click="tabSelect(item)">
                {{ item.name }}
            </div>
        </div>
        <div class="contact-item" v-if="tabAction === 1 && searchResult?.targetUser" @click="handleClick(targetUserInfo)">
            <ComImage :src="targetUserInfo.icon" type="friend" class="icon" />
            <span class="name">{{ targetUserInfo.nickName }}</span>
        </div>
        <div class="contact-item" v-else-if="searchResult?.groupDetail" @click="handleClick(targetGroupInfo)">
            <ComImage :src="targetGroupInfo.pic" type="group" class="icon" />
            <span class="name">{{ targetGroupInfo.name }}</span>
        </div>
        <div v-else>无数据</div>
    </div>
</template>

<script>
import { groupOrUserDetail } from "@/api/imGroup.js";

import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
    name: "searchAddContacts",
    props: ['searchText'],
    data() {
        return {
            tabList: [
                { name: "群聊", key: 0 },
                { name: "陌生人", key: 1 },
            ],
            tabAction: 1,
            searchResult: null,
        }
    },
    computed: {
        targetGroupInfo() {
            return this.searchResult?.groupDetail?.groupBase || {}
        },
        targetUserInfo() {
            return this.searchResult?.targetUser?.userInfo || {}
        }
    },
    methods: {
        handleClick() {
            // const data = this.tabAction === 1 ?  this.searchResult?.targetUser :  this.searchResult?.groupDetail
            eventBase.fnCommunicationSendMsg({
                operator: "activeChange",
                data: { ...this.searchResult, comType: "addContact", groupOrUserType: this.tabAction },
            });
        },
        tabSelect(item) {
            this.tabAction = item.key;
        },
        searchContacts() {
            console.log("searchContacts-1-", this.searchText)
            if (!this.searchText) return;
            const fromUid = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });
            const pars = {
                fromUid,
                context: this.searchText,
            }
            console.log("searchContacts-1-", pars)
            groupOrUserDetail(pars).then(res => {
                console.log("groupOrUserDetail--", res)
                this.searchResult = res || {};
                this.tabAction = res?.groupOrUserType;
            }).catch(err => {
                console.log("groupOrUserDetail-2-", err)
            })
        }
    }
}

</script>

<style scoped lang="scss">
.add-tip {
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    border: 1px solid #e5e5e5;
    cursor: pointer;
    padding: 0 10px;
    border-radius: 4px;
    margin-top: 4px;

    .icon {
        height: 16px;
    }

    span {
        margin-left: 10px;
        font-size: 14px;
    }
}

.tabs {
    width: 100%;
    height: 26px;
    display: flex;
    align-items: center;
    overflow: auto;

    .tab-item {
        margin-right: 10px;
        cursor: pointer;
    }

    .tab-action {
        color: #429EFD;
    }
}

.contact-item {
    display: flex;
    align-items: center;
    margin-top: 10px;
    cursor: pointer;

    .icon {
        width: 40px;
        height: 40px;
        border-radius: 100%;
    }

    .name {
        font-size: 14px;
        margin-left: 10px;
    }
}
</style>