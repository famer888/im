<template>
    <div
        :class="{ comMsgImage: true, bg: msgInfo.quoteMessage !== undefined }"
        :style="containerStyle"
        @click.right="
            (e) =>
                $emit('rightClick', {
                    e,
                    info: msgInfo,
                    imgErrorText:
                        !msgInfo.local && !msgInfo.localThumbUrl
                            ? 'loading'
                            : handleErrorTipsGet(),
            })">
        <slot></slot>
        <div class="content" :style="contentStyle">
            <slot name="timeStatus" v-if="!hasError"></slot>
            <Overlay :loading="loading" :duration="msgInfo.duration" :percent="percent" :status="status" :isVideo="msgInfo.chatType === 3" @click="handleOpenFile" />
            <template v-if="msgInfo.local || msgInfo.localThumbUrl">
                <i v-if="handleErrorTipsGet()">
                    <!-- {{ handleErrorTipsGet() }} -->
                </i>
                <div class="picture-container" v-else>
                    <!-- <img
                        v-if="msgInfo.chatType === 3"
                        src="@/assets/images/message/vedios-icon.png"
                        class="btnPay"
                        @click="handleOpenFile"
                    /> -->
                    <img
                        :src="
                          getUrl()
                        "
                        class="picture"
                        @error="handleFileDownload()"
                        @load="isSuccess = true"
                        @click="handleOpenFile"
                    />
                    <!-- <img
                        v-else
                        src="@/assets/images/file/icon_fail_picture_big.png"
                        class="picture fail-img"
                        @click="handleOpenFile"
                    /> -->
                </div>
            </template>
            <!-- <i v-else class="file-loading">
                <img
                    class="file-img"
                    src="@/assets/images/file/file-loading.gif"
                />
            </i> -->
        </div>
    </div>
</template>
<script>
import { remote, ipcRenderer } from "@/platform";
import Overlay from './overlay.vue';
import progress from "@/utils/progress";

// 工具
import { getFileSuffix, isMac } from "@/utils/base";
import { getFileOssUrls, getNewFileDownUrl } from "@/utils/trendsDomain/manageOssDownUpload";
import { getOssFirstNormalUrl } from "@/utils/trendsDomain/manageOssDownUpload";

// 事件
import eventFile from "@/event/file";
import eventCommon from "@/event/common";

export default {
    props: ["msgInfo", "chatContent"],
    components: {
        Overlay,
    },
    computed: {
        containerStyle() {
            const { width, height } = this.msgInfo;
            if (width && height) {
                return {
                    minWidth: 'unset',
                };
            }
            return {};
        },
        contentStyle() {
            const { width, height } = this.msgInfo;
            if (width && height) {
                return {
                    aspectRatio: `${width} / ${height}`,
                };
            }
            return {};
        },
        taskId() {
            return progress.getTask(this.msgInfo)?.taskId;
        },
        /**
         * 合并监听 local 和 localThumbUrl
         */
        status() {
            const { local, localThumbUrl } = this.msgInfo;
            return local || localThumbUrl;
        },
        /**
         * 是否有错误状态
         */
        hasError() {
            return ['downloadError', 'decryptionError'].includes(this.status);
        },

    },
    data() {
        const task = progress.getTask(this.msgInfo);
        return {
            noticeArr: [],
            imgSrc: "",
            isSuccess: true,
            localSrc: "",
            percent: this.msgInfo?.percent ?? task?.percent ?? 0,
            loading: this.msgInfo?.percent >= 100 ? false : task?.loading ?? false,
        };
    },
    created() {
        // 图片文件下载
        const { local, localThumbUrl } = this.msgInfo;
        if (!(local || localThumbUrl)) {
            // 下载文件
            this.handleFileDownload("default");
        }
        // this.handleFileDownload("default");

        // 如果正在进度更新，初始化上传进度监听
        // console.log('>>> loading', this.loading);
        if (this.loading) {
            this.initProgressBar();
        }
    },
    beforeDestroy() {
        // 移除监听，避免内存泄漏
        if (this._onProgress) {
            progress.unsubscribe(this.taskId, this._onProgress);
        }
    },
    watch: {
      ['msgInfo.percent'](value) {
        if (value >= 100) {
          console.log('>>> msgInfo.percent', value);
          this.loading = false;
          this.percent = value;
        }
      }
    },
    methods: {
        /**
         * 初始化进度条监听
         */
        initProgressBar() {
            progress.init(this.msgInfo);
            this._onProgress = (percent) => {
                // console.log('>>> onProgress', percent);
                this.loading = true;
                this.percent = percent;
                if (this.percent === 100) {
                    this.loading = false;
                }
            };
            progress.subscribe(this.taskId, this._onProgress);
        },
        // 处理mac本地地址异常
        macFixImagePath(url) {
            // 1. 处理 app://./ 协议：替换为 file:// 并修正路径
            if (url.startsWith('app://./')) {
                const relativePath = url.replace('app://./', '');
                const absolutePath = `/${relativePath}`; // 假设目标是根目录下的路径
                return `file://${absolutePath}`;
            }
            // 2. 如果不是 file:// 开头，则自动添加 file://（适用于本地绝对路径）
            else if (!url.startsWith('file://')) {
                // 检查是否是绝对路径（如 /Users/... 或 C:\...）
                if (url.startsWith('/')) {
                    return `file://${url}`;
                }
            }
            // 3. 其他情况（如已经是 file:// 或 http://），直接返回
            return url;
        },
        getUrl() {
            let url = this.msgInfo.localThumbUrl  || this.msgInfo.local
            if(isMac) {
              url = this.macFixImagePath(url)
            }
            return url
        },
        /**
         * 打开文件
         */
        handleOpenFile() {
          const { chatType } = this.msgInfo || {};
          const taskId = chatType === 3 ? progress.getTask(this.msgInfo)?.taskId : null;
          taskId && this.initProgressBar();
          eventFile.fnOperatorFile({
              taskId,
              id: this.chatContent.id,
              type: this.chatContent.type,
              info: this.msgInfo.local && this.msgInfo.local.indexOf('http') === 0 ? {...this.msgInfo, local: null} : this.msgInfo,
          });
        },
        /**
         * 下载文件
         */
        async handleFileDownload(status) {
            if (status == "error") {
                this.isSuccess = false;
                this.imgSrc = require("@/assets/images/file/icon_fail_picture_big.png");
                return;
            }
            const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });

            const { content, chatType, MsgID, fileKey, customMsgId } = this.msgInfo;

            // 文件路径
            let fileUrl = content ? content.split("||")[0] : "";
            if (chatType === 3) {
                fileUrl = content?.split("*P")[1];
            }
            if( !fileUrl && this.msgInfo.thumbUrl ){
                fileUrl = this.msgInfo.thumbUrl
            }

            // 如果是不需要解密的图片，直接用网图
            if (!fileKey && chatType !== 3) {
                // console.log('>>> fileUrl', customMsgId, document.getElementById(`${customMsgId}`), fileUrl);
                // const params = {
                //     customMsgId,
                //     fileLocalPath: fileUrl,
                //     chatType,
                // };

                // if ( this.chatContent.type === "group") {
                //     params.groupId = this.chatContent.id;
                // } else if (this.chatContent.type === "channel") {
                //      params.channelId = this.chatContent.id;
                // } else {
                //     params.userId = this.chatContent.id;
                // }

                // eventFile.fnDownloadFileInfoUpdate(params);
                // return;
            }

            // 后缀名
            const suffix = getFileSuffix(chatType, fileUrl);

            // 文件名
            const fileName = fileUrl.slice(fileUrl.lastIndexOf("/") + 1) + suffix;

            // 优先使用动态域名
            const trendsFileUrl = await getOssFirstNormalUrl(fileUrl)

            // 初始化进度条
            chatType === 1 && this.initProgressBar();

            // 文件下载
            ipcRenderer.send("fileDownload", {
                fileUrl,
                trendsFileUrl,
                fileName,
                uid: loginId,
                channelId: this.chatContent.type === "channel"
                        ? this.chatContent.id
                        : null,
                userId:
                    this.chatContent.type === "friend"
                        ? this.chatContent.id
                        : null,
                groupId:
                    this.chatContent.type === "group"
                        ? this.chatContent.id
                        : null,
                windowId: remote.getCurrentWindow().getMediaSourceId(),
                msgId: MsgID,
                fileKey,
                chatType,
                customMsgId,
                isOpen: false,
                timeout: 5000,
                fileSize: this.msgInfo.size || this.msgInfo.fileSize || 0,
                taskId: chatType === 1 ? this.taskId : null,
            });
        },
        /**
         * 错误提示获取
         */
        handleErrorTipsGet() {
            const { local, localThumbUrl, chatType } = this.msgInfo;
            const fileUrl = local || localThumbUrl;

            // 错误类型也是记录在地址上
            switch (fileUrl) {
                case "downloadError": {
                    // 下载报错
                    if (chatType === 3) {
                        return this.$t("视频文件已过期");
                    }
                    return this.$t("图片文件已过期");
                }
                case "decryptionError": {
                    // 解密报错
                    if (chatType === 3) {
                        return this.$t("视频文件解密失败");
                    }
                    return this.$t("图片文件解密失败");
                }
                default: {
                    // 正常的url
                }
            }

            return null;
        },
        //
        handleContent(content) {
            let contents = content.split("||");
            return contents[0];
        },
        handleSuffix(msgInfo) {
            if (msgInfo.chatType == 3) {
                if (msgInfo.local && [".mp4", "WebM", ".Ogg"].includes(msgInfo.local.slice(-4))) {
                    return msgInfo.localThumbUrl
                } else {
                    return msgInfo.local || msgInfo.localThumbUrl
                }
            }
            return msgInfo.local || msgInfo.localThumbUrl
        }
    },
};
</script>
<style scoped lang="scss">
.comMsgImage {
    position: relative;
    max-width: 400px;
    min-width: 120px;
    cursor: pointer;
    > .content ::v-deep .comTimeStatusLabel {
      right: 8px;
      bottom: 8px;
      z-index: 11;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 9999px;
      padding: 2px 6px;
      > span {
        color: white;
      }
    }

    &.bg {
        background: #fff;
        border: 1px solid #f2efef;
        padding: 10px 10px;
        border-radius: 10px;
    }

    &:hover {
        opacity: 0.8;
    }

    > .content {
        height: 150px;
        width: fit-content;
        position: relative;
        background: white;
        padding: 4px;
        border-radius: 10px;
        overflow: hidden;
        min-width: 120px;
        .picture-container {
          background: #333;
          height: 100%;
          border-radius: 6px;
          overflow: hidden;
          text-align: center;
        }
        > .btnPay {
            position: absolute;
            top: 75px;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 1px solid #fff;
            border-radius: 50%;
            width: 40px;
        }

        .picture {
            height: 150px;
            display: inline-block;
            -webkit-user-drag: unset;

        }

        > i {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 0 15px;
            // background: #fdebeb;
            width: 150px;
            line-height: 25px;
            border-radius: 5px;
        }
    }
    .file-loading {
        display: flex;
        width: 150px;
        height: 150px;
        justify-content: center;
        align-items: center;
        background-color: #f2efef;
        img {
            width: 100px;
            height: 100px;
        }
    }
}
</style>
