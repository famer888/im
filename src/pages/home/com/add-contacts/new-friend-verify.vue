<template>
    <div class="new-friend-verify">
        <div class="head-title">新的朋友</div>
        <div class="content">
            <div class="info-head">
                <ComImage :src="userInfo.icon" type="friend" class="head-icon" />
                <div class="info">
                    <span class="name">{{ userInfo.nickName }}</span>
                    <p class="source">对方通过搜索添加</p>
                </div>
            </div>
            <div class="info-middle">
                <div class="info-item">
                    <span class="title">ID号</span>
                    <span class="value">{{ userInfo.identify }}</span>
                </div>
                <div class="info-item">
                    <span class="title">性别</span>
                    <span class="value">{{['保密', '男', '女'][userInfo.gender]}}</span>
                </div>
                <div class="info-item">
                    <span class="title">个性签名</span>
                    <span class="value">{{userInfo.depict || '对方什么都没写'}}</span>
                </div>
            </div>
            <div class="info-msg">
                <div class="tip">系统提示：请求添加好友</div>
                <p class="msg">{{ info.msg }}</p>
            </div>
            <div class="footer">
                <div class="primaryBtn blacklist-btn">加入黑名单</div>
                <div class="primaryBtn">通过验证</div>
            </div>
        </div>
    </div>
</template>

<script>
import { groupOrUserDetail } from "@/api/imGroup.js";
import eventCommon from "@/event/common";

export default {
    name: "newFriendVerify",
    props: ['info'],
    data() {
        return {
            userDetail: {},
        }
    },
    computed: {
        userInfo() {
            return this.info?.userInfo || {};
        }
    },
    mounted() {
        console.log(this.info)
    },
    methods: {
      
    }
}
</script>

<style scoped lang="scss">
.new-friend-verify {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    top: 20px;
    z-index: 9;
    background: #F6F6F6;

    .head-title {
        font-size: 14px;
        color: #000;
        padding: 20px;
        box-sizing: border-box;
        background: #fff;
    }

    .content {
        padding: 20px;
        background: #F6F6F6;

    }


    .info-head,
    .info-middle,
    .info-msg {
        background: #fff;
        border-radius: 6px;
        margin-bottom: 10px;
        padding: 10px;
        box-sizing: border-box;
    }

    .info-head {
        display: flex;
        align-items: center;

        .head-icon {
            width: 68px;
            height: 68px;
        }

        .info {
            margin-left: 10px;

            .name {
                font-size: 14px;
                color: #000;
            }

            .source {
                font-size: 12px;
                color: #B9BABE;
                margin-top: 12px;
            }
        }
    }

    .info-middle {
        padding: 0 10px;

        .info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #F2F2F2;
            padding: 10px 0;
            box-sizing: border-box;

            &:last-child {
                border-bottom: none;
            }

            .title {
                font-size: 14px;
                color: #000;
            }

            .value {
                font-size: 14px;
                color: #787878;
            }
        }
    }

    .info-msg {
        .tip {
            font-size: 12px;
            color: #979797;
        }

        .msg {
            border-top: 1px solid #F2F2F2;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 14px;
            color: #000;
        }

    }

    .footer {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 16px;
    }

    .blacklist-btn {
        background: #FB2826;
        border: none;
        margin-right: 10px;
    }

    .primaryBtn {
        width: 256px;
        height: 48px;
        line-height: 48px;
        border-radius: 6px;
    }


}
</style>