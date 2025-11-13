<template>
    <div class="search-specified-chat">
        <div class="head-spec">
            <div class="title">搜索消息的范围</div>
            <div class="chat-info">
                <ComImage class="img-head" :src="info?.pic" :type="info.type" />
                <span class="name nowrap">{{ info.name }}</span>
            </div>
            <div class="title" >找到{{ searchMessage.length || 0 }}条消息</div>
        </div>
        <ul class="msg-list-box" v-if="this.searchText">
            <li class="msg-list-item" v-for="(item, index) in searchMessage" :key="'searchMsg' + index"
                @click="linkTo(item)">
                <ComImage class="img-head" :src="item.pic" :type="item.type" />
                <div class="info">
                    <span class="name nowrap">{{ item.name }}</span>
                    <div class="msg nowrap" v-if="item.content" v-html="getWordKeyHtml(item.content)"></div>
                </div>
                <span class="time"> {{ dayjs(+item.sendTime).format("HH:mm") }}</span>
            </li>
        </ul>

        <div class="search-tip" v-if="!this.searchText">
            <img class="icon-tip" src="@/assets/images/common/search-data.png" />
            <span class="tip-msg">搜索消息</span>
        </div>
        <div class="search-tip" v-else-if="this.searchText && !this.searchMessage.length">
            <img class="icon-tip" src="@/assets/images/common/search-no-data.png" />
            <span class="tip-msg">搜索无结果</span>
        </div>

    </div>
</template>

<script>
import dayjs from "dayjs";
import eventCommon from "@/event/common";
import eventBase from "@/event/base";
export default {
    name: "searchSpecifiedChat",
    props: ["info", "searchText"],
    data() {
        return {
            searchMessage: [],
            loginInfo: {},
        }
    },
    watch: {
        searchText() {
            this.searchMsg()
        }
    },
    mounted() {
        // 登录信息
        this.loginInfo = eventCommon.fnCommonInfoRU({
            getId: "loginInfo",
        });
    },
    methods: {
        dayjs,
        getWordKeyHtml(content) {
            return content.replace(
                this.searchText,
                `<span class="highlight">${this.searchText}</span>`
            );
        },
        sortList(arr) {
            // 排序：最新的时间（sendTime更大）排在前面
          return  arr.sort((a, b) => {
            // 用 b 的时间戳减去 a 的时间戳，结果为正则 b 排在前，实现倒序
            return  Number(b.sendTime) - Number(a.sendTime);
            });
        },
        searchMsg() {
            const { id, type, name } = this.info || {};
            const searchText = this.searchText;
            const isGroup = type === 'group';
            // console.log('handleSearchMessageSingle--', searchText, id, type, name, this.loginInfo)
            if (!searchText || !id || !type) return;
            window.$db.searchTable({ id, type, searchText }).then(res => {
                let result = res.list || [];
                result = this.sortList(result)
                const formatResult = result.map((n) => {
                    const { id, name, icon } = this.loginInfo
                    const isOwn = n.sendUid === id
                    const sendUser = (isGroup ? n.sendMember?.user : n.sendUser) || {}
                    return {
                        id,
                        type,
                        name: isOwn ? name : sendUser?.name || sendUser?.nickName,
                        customMsgId: n.customMsgId,
                        MsgID: n.MsgID,
                        content: n.content,
                        sendTime: n.sendTime,
                        isMessage: true,
                        pic: (isOwn ? icon : sendUser?.icon) || ""
                    };
                })
                this.searchMessage = formatResult;
            })
        },
        /**
         * 移动至搜索的位置
         */
        linkTo(value) {
            let data = {
                ...this.info,
                searchMsgInfo: null,
                customMsgId: value.customMsgId,
                sendTime: value.sendTime,
            };

            eventBase.fnCommunicationSendMsg({
                operator: "chatMsgListSearchScrollTo",
                data: { ...data, comType: "chat" },
            });
        },
    }

}
</script>

<style lang="scss" scoped>
.search-specified-chat {
    position: relative;
    overflow-y: auto;
    height: 100%;
}

.head-spec {
    width: 100%;

    .title {
        width: 100%;
        font-size: 12px;
        color: #5C6873;
        padding: 6px 20px;
        background: #EFF0F4;
    }

    .chat-info {
        display: flex;
        align-items: center;
        padding: 10px;

        .img-head {
            width: 24px;
            height: 24px;
            border-radius: 99px;
        }

        .name {
            margin-left: 10px;
            font-size: 12px;
            color: #000;
        }
    }
}

.msg-list-box {
    width: 100%;
    padding: 0;
    margin: 0;
    overflow: hidden;
}

.msg-list-item {
    display: flex;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;

    .img-head {
        width: 40px;
        height: 40px;
        border-radius: 99px;
    }

    .info {
        flex: 1;
        padding: 0 10px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .name {

        font-size: 14px;
        color: #000;
    }

    .msg {
        font-size: 12px;
        color: #B9BABE;

        span {
            font-size: 12px;
            color: #535ebe;
        }
    }

    .time {
        font-size: 12px;
        color: #B9BABE;
    }
}

.search-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    margin-top: 20px;

    .tip-msg {
        margin-top: 12px;
    }
}

.nowrap {
    white-space: nowrap;
    /* 强制文本不换行 */
    overflow: hidden;
    /* 隐藏溢出部分 */
    text-overflow: ellipsis;
    /* 溢出时显示省略号 */
    display: block;
    /* 确保块级元素（若原本是行内元素需添加） */
}
</style>

<style>
.highlight {
    font-size: 12px;
    color: #178aff;
}
</style>
