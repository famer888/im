<template>
    <div class="invite-friend-dialog">
        <div class="content">
            <div class="top">
                <div class="head">
                    <span class="title">邀请好友</span>
                    <img class="close" src="@/assets/images/common/close-icon.png" @click="$emit('close')" />
                </div>
                <ComSearch class="search" placeholder="搜索" :searchText="searchText" @onChange="searchChange"></ComSearch>
                <!-- <div class="form-link">
                    <span class="title">通过邀请链接加入群组</span>
                    <ComCheckbox></ComCheckbox>
                </div> -->
            </div>
            <ul class="friend-list">
                <li class="friend-item" :class="{ disable: item.isGroupMember || item.nickName === '账号已注销' }" v-for="(item, index) in friendList" :key="index" @click="selectFriend(item)">
                    <div class="left">
                        <ComImage type="friend" :src="item.pic" class="member-avatar" />
                        <span class="name">{{ item.name || item.nickName }}</span>
                    </div>
                    <ComCheckbox :value="getSelectState(item)"></ComCheckbox>
                </li>
            </ul>

            <div class="primaryBtn" @click="confirmInvite">完成</div>
        </div>
    </div>
</template>

<script>

import ComSearch from "../../com/search.vue";
import ComCheckbox from "@/components/Checkbox";
import { Cache } from "@/cache";
import eventCommon from "@/event/common";
import { GroupMember } from "@/api/imGroup.js";

export default {
    name: "inviteFriendJoinGroup",
    props: ["groupId", "memberInfoList"],
    components: { ComSearch, ComCheckbox },
    data() {
        return {
            contactList: [],
            friendList: [],
            selectFriends: [],
            timerSearch: null,
            searchText: "",
        }
    },
    mounted() {
        this.getFriendList()
    },
    methods: {
        confirmInvite() {
            const members = this.selectFriends.map(item => item.id)
            console.log("confirmInvite--", members, this.selectFriends)
            if (!members.length) {
                window.$toast('请选择邀请的好友')
                return;
            }
            const pra = {
                op: 0,
                groupId: this.groupId,
                members,
            }
            console.log("GroupMember--", pra)
            GroupMember(pra).then(res => {
                const { errCode } = res?.commonResult || {}
                if (errCode == 200) {
                    window.$toast('邀请成功')
                    this.selectFriends = [];
                    this.$emit("close");
                    // window.$confirm({
                    //     title: "邀请成功",
                    //     remark: op === 6 ? "加入黑名单后，你将不再接收到对方的任何消息" : "确认移除黑名单吗",
                    // })
                } else {
                    window.$toast('邀请失败')
                }
            })
        },
        getSelectState(info) {
            const isExist = this.selectFriends.find(item => item.id === info.id)
            return !!isExist
        },
        searchChange(data) {
            console.log("searchChange--", data)
            clearTimeout(this.timerSearch)
            if (!data) {
                this.searchText = "";
                this.friendList = this.contactList;
                return;
            }
            this.timerSearch = setTimeout(() => {
                this.searchWatch(data)
            }, 500)
        },
        searchWatch(value) {
            const searchValue = value.toLowerCase();
            this.friendList = this.contactList.filter(item =>
                (item?.name || "").toLowerCase().includes(searchValue)
                || (item?.nickName || "").toLowerCase().includes(searchValue)
            )
        },
        selectFriend(info) {
            if(info.isGroupMember) return;
            const isExist = this.selectFriends.find(item => item.id === info.id)
            if (isExist) {
                this.selectFriends = this.selectFriends.filter(item => item.id !== info.id)
            } else {
                this.selectFriends.push(info)
            }
            // this.$set(info, "isSelect", !info?.isSelect)
        },
        getFriendList() {
            const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });
            Cache(`${loginId}-ContactList`).then(res => {
                this.contactList = this.filterGroupMember(res, this.memberInfoList) ;
                this.friendList = this.contactList;
            })
        },
        // 过滤掉群成员
        filterGroupMember(friends, groupMembers) {
            let isFriendMore = friends.length > groupMembers.length
            let friendList = friends
            if (isFriendMore) {
                groupMembers.forEach(item => {
                    let index = friendList.findIndex(i => i.id === item.id)
                    if (index >= 0) {
                        friendList[index].isGroupMember = true;
                    }
                })
            } else {
                friendList.forEach((item, index) => {
                    const isExist = groupMembers.some(i => i.id === item.id)
                    if (isExist) {
                        friendList[index].isGroupMember = true;
                    }
                })
            }
            return friendList
        }
    }
}
</script>

<style lang="scss" scoped>
.invite-friend-dialog {
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

    .friend-list {
        width: 100%;
        height: 260px;
        margin: 0;
        padding: 0;
        overflow-y: auto;
    }

    .friend-item {
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
}
</style>
