<template>
    <div class="search-add-contacts">
        <div class="add-tip" v-if="searchText && !searchResult" @click="searchContacts">
            <div class="left">
                <img class="icon-search" src="@/assets/images/headNav/search-blue.png" alt="" />
                <span> {{ $t('搜索') + searchText }} </span>
            </div>
            <img class="arrow" src="@/assets/images/headNav/arrow-right.png" alt="" />
        </div>
        <div class="search-result">
            <div class="tabs" v-if="searchResult">
                <div class="tab-item" :class="{ 'tab-action': item.key === tabAction }" v-for="(item, key) in tabList"
                    :key="key" @click="tabSelect(item)">
                    {{ item.name }}
                </div>
            </div>
            <div class="contact-item" v-if="tabAction === 1 && searchResult?.targetUser"
                @click="handleClick(targetUserInfo)">
                <ComImage :src="targetUserInfo.icon" type="friend" class="icon" />
                <span class="name">{{ targetUserInfo.nickName }}</span>
            </div>
            <div class="contact-item" v-else-if="searchResult?.groupDetail" @click="handleClick(targetGroupInfo)">
                <ComImage :src="targetGroupInfo.pic" type="group" class="icon" />
                <span class="name">{{ targetGroupInfo.name }}</span>
            </div>
            <div class="search-no-data" v-else-if="searchResultNone">
                <img class="icon-no-data" src="@/assets/images/common/search-no-data.png" alt="" />
                <span class="tip">搜索无结果</span>
            </div>
        </div>
    </div>
</template>

<script>
import { groupOrUserDetail } from "@/api/imGroup.js";

import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
    name: "searchAddContacts",
    props: ['searchText', 'searchAddContactsIng'],
    data() {
        return {
            tabList: [
                { name: "群聊", key: 0 },
                { name: "陌生人", key: 1 },
            ],
            tabAction: 1,
            searchResult: null,
            searchResultNone: false,
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
    beforeDestroy() {
        this.$emit("update:searchAddContactsIng", false)
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
            this.$emit("update:searchAddContactsIng", true)
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
                if (!res?.groupDetail && !res?.targetUser) {
                    this.searchResultNone = true
                } else {
                    this.searchResult = res || {};
                    this.tabAction = res?.groupOrUserType;
                }
            }).catch(err => {
                this.searchResultNone = true
                console.log("groupOrUserDetail-2-", err)
            })
        }
    }
}

</script>

<style scoped lang="scss">

.add-tip {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #e5e5e5;
    cursor: pointer;
    padding: 16px;
    border-radius: 4px;
    margin-top: 4px;

    .left {
        display: flex;
        align-items: center;
    }

    .icon-search {
        height: 24px;
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

.search-no-data {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 50px;

    .icon-no-data {
        margin-top: 20px;
    }

    .tip {
        font-size: 14px;
        color: #B9BABE;
        margin-top: 18px;
    }
}
</style>