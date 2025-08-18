<template>
    <div class="search-add-contacts">
        <!-- 点击搜索 -->
        <div class="add-tip" v-if="searchText && !searchResult" @click="searchContacts">
            <div class="left">
                <img class="icon-search" src="@/assets/images/headNav/search-blue.png" alt="" />
                <span> {{ $t('搜索') + searchText }} </span>
            </div>
            <img class="arrow" src="@/assets/images/headNav/arrow-right.png" alt="" />
        </div>
        <div class="search-result">
            <!-- 导航 -->
            <div class="tabs" v-if="searchResult">
                <div class="tab-item" :class="{ 'tab-action': item.key === tabAction }" v-for="(item, key) in tabList"
                    :key="key" @click="tabSelect(item)">
                    {{ item.name }}
                </div>
            </div>
            <!-- 联系人搜索结果 -->
            <template v-if="tabAction === 1 && searchResult?.length">
                <div class="contact-item" v-for="item in searchResult"
                    @click="handleClick(item)">
                    <ComImage :src="item.userInfo.icon" type="friend" class="icon" />
                    <span class="name">{{ item.userInfo.nickName }}</span>
                </div>
            </template>
            <!-- 群聊搜索结果 -->
            <div class="contact-item" v-else-if="searchResult?.groupDetail" @click="handleClick(searchResult?.groupDetail)">
                <ComImage :src="targetGroupInfo.pic" type="group" class="icon" />
                <span class="name">{{ targetGroupInfo.name }}</span>
            </div>
            <!-- 无数据 -->
            <div class="search-no-data" v-else-if="searchResultNone">
                <img class="icon-no-data" src="@/assets/images/common/search-no-data.png" alt="" />
                <span class="tip">搜索无结果</span>
            </div>
        </div>
    </div>
</template>

<script>
import { groupSearch } from "@/api/imGroup.js";
import { findContactsList } from "@/api/imContacation.js";

import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
    name: "searchAddContacts",
    props: ['searchText', 'searchAddContactsIng'],
    data() {
        return {
            tabList: [
                { name: "群聊", key: 0 },
                { name: "联系人", key: 1 },
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
    },
    beforeDestroy() {
        this.$emit("update:searchAddContactsIng", false)
    },
    methods: {
        handleClick(info) {
            console.log(info)
            eventBase.fnCommunicationSendMsg({
                operator: "activeChange",
                data: { ...info, comType: "addContact", groupOrUserType: this.tabAction },
            });
        },
        tabSelect(item) {
            this.tabAction = item.key;
        },
        async searchContacts() {
            console.log("searchContacts-1-", this.searchText)
            if (!this.searchText) return;
            const searchValue = this.searchText.replace(/@/g, '').trim(); // 去掉@和前后空格
            this.$emit("update:searchAddContactsIng", true)
            const fromUid = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });

            try {
                // 搜索群
                const pars = {
                    fromUid,
                    context: searchValue,
                }
                console.log("searchContacts-1-", pars)
                const res = await groupSearch(pars)
                if(res?.groupDetail) {
                    this.searchResult = res || {};
                    this.tabAction = 0;
                    return
                }

                // 搜索联系人
                const cPars = {
                    phoneNum: searchValue,
                    findType: 1
                }
                const { detailList = [] } = await findContactsList(cPars) || {};
                if(detailList?.length) {
                    console.log('findContactsList--', detailList)
                    this.searchResult = detailList;
                    this.tabAction = 1;
                }

                // 无结果
                this.searchResultNone = true
            } catch (error) {
                // 搜索异常
                this.searchResultNone = true
                console.error(error)
                window.$toast("搜索异常");
            }

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