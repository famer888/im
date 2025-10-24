<template>
    <div class="select-member-dialog">
        <div class="content">
            <div class="top">
                <div class="head">
                    <span class="title">{{title}}</span>
                    <img class="close" src="@/assets/images/common/close-icon.png" @click="$emit('close')" />
                </div>
                <ComSearch class="search" placeholder="搜索" :searchText="searchText" @onChange="searchChange"></ComSearch>
            </div>
            <ul class="member-list">
                <li class="member-item"
                    :class="{ disable: item.type < 1 || (memberType > 0 && item.type === 1) }"
                    v-for="(item, index) in memberInfoList" :key="index" @click="selectMember(item)"
                >
                    <div class="left">
                        <ComImage type="member" :src="item.icon" class="member-avatar" />
                        <span class="name">{{ item.name || item.nickName }}</span>
                    </div>
                    <div class="right">
                        <template>
                            <div class="tag-item" v-if="item.type === 0">群主</div>
                            <div class="tag-item orange" v-else-if="item.type === 1">管理</div>
                        </template>
                        <ComCheckbox :value="getSelectState(item)"></ComCheckbox>
                    </div>
                </li>
            </ul>

            <div class="primaryBtn" @click="confirmInvite">完成</div>
        </div>
    </div>
</template>

<script>
import ComSearch from "@/pages/home/com/search.vue";
import ComCheckbox from "@/components/Checkbox";

export default {
    name: "inviteMemberJoinGroup",
    props: ["memberList", "title", "memberType"],
    components: { ComSearch, ComCheckbox },
    data() {
        return {
            memberInfoList: [],
            selectMembers: [],
            timerSearch: null,
            searchText: "",
        }
    },
    mounted() {
        this.memberInfoList = this.memberList
    },
    methods: {
        confirmInvite() {
           this.$emit("confirm", this.selectMembers)
        },
        getSelectState(info) {
            const isExist = this.selectMembers.find(item => item.id === info.id)
            return !!isExist
        },
        searchChange(data) {
            clearTimeout(this.timerSearch)
            if (!data) {
                this.searchText = "";
                this.memberInfoList = this.memberList;
                return;
            }
            this.timerSearch = setTimeout(() => {
                this.searchWatch(data)
            }, 500)
        },
        searchWatch(value) {
            this.memberInfoList = this.memberList.filter(item =>
                (item?.name || "").includes(value)
                || (item?.nickName || "").includes(value)
                || (item?.identify || "").includes(value)
            )
        },
        selectMember(info) {
            if(info.type < 1 || (this.memberType > 0 && info.type === 1)) return;
            const isExist = this.selectMembers.find(item => item.id === info.id)
            if (isExist) {
                this.selectMembers = this.selectMembers.filter(item => item.id !== info.id)
            } else {
                this.selectMembers.push(info)
            }
        },
    }
}
</script>

<style lang="scss" scoped>
.select-member-dialog {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    background: rgba($color: #000000, $alpha: 0.2);

    .content {
        background: #fff;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 8px;
        width: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .close {
        cursor: pointer;
    }

    .top {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border-bottom: 1px solid #f2f2f2;
    }

    .head {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
            font-size: 16px;
            color: #787878;
        }
    }

    .search {
        margin-top: 10px;
    }

    .form-link {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            font-size: 14px;
            color: #178AFF;
        }
    }

    .member-list {
        width: 100%;
        height: 260px;
        margin: 0;
        padding: 0;
        overflow-y: auto;
    }

    .member-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        box-sizing: border-box;
        cursor: pointer;

        .left {
            display: flex;
            align-items: center;
        }

        .right {
           display: flex;
           align-items: center;
        }

        .member-avatar {
            width: 38px;
            height: 38px;
            border-radius: 99px;
        }

        .name {
            font-size: 14px;
            color: #494949;
            margin-left: 10px;
        }
    }

    .disable {
        opacity: 0.5;
        pointer-events: none;
    }

    .primaryBtn {
        width: 206px;
        height: 32px;
        margin: 16px 0;
    }

    .tag-item {
        width: 38px;
        height: 20px;
        border-radius: 99px;
        font-size: 12px;
        color: #fff;
        background: #3369FE;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
    }
    .tag-item.orange {
        background: #FB9203;
    }
}
</style>
