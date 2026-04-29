<template>
    <div
        :class="{ comMsgImage: true, bg: msgInfo.quoteMessage !== undefined }"
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
        <div class="content" :style="containerStyle">
            <!-- <slot name="timeStatus" v-if="!hasError"></slot> -->
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
                        v-if="displayUrl"
                        :key="imageRenderKey"
                        :src="displayUrl"
                        class="picture"
                        @error="handleImageError"
                        @load="handleImageLoad"
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
import { remote, ipcRenderer, toLocalResourceUrl } from "@/platform";
import Overlay from './overlay.vue';
import progress from "@/utils/progress";

// 工具
import { getFileSuffix, isMac, stripChatContentMetaSuffix } from "@/utils/base";
import { checkImageLoad, checkLocalFileExists, isErrorLocalValue } from "@/utils/fileTools";
import { getFileOssUrls, getNewFileDownUrl } from "@/utils/trendsDomain/manageOssDownUpload";
import { getOssFirstNormalUrl } from "@/utils/trendsDomain/manageOssDownUpload";

// 事件
import eventFile from "@/event/file";
import eventCommon from "@/event/common";
import eventBase from "@/event/base";

export default {
    props: ["msgInfo", "chatContent", "externalPendding"],
    components: {
        Overlay,
    },
    computed: {
        containerStyle() {
            if (this.displayUrl) {
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
            if (isErrorLocalValue(local) && !this.isUsableLocalValue(localThumbUrl)) {
                return local;
            }
            if (isErrorLocalValue(localThumbUrl) && !this.isUsableLocalValue(local)) {
                return localThumbUrl;
            }
            return null;
        },
        /**
         * 是否有错误状态
         */
        hasError() {
            return ['downloadError', 'decryptionError'].includes(this.status);
        },
        localCandidates() {
            const { local, localThumbUrl, chatType } = this.msgInfo || {};
            const candidates = [];
            if (localThumbUrl) {
                candidates.push(localThumbUrl);
            }
            if (local && chatType !== 3) {
                candidates.push(local);
            }
            return [...new Set(candidates)].filter((value) => {
                return this.isUsableLocalValue(value) && !this.failedLocalValues.includes(value);
            });
        },
        displayUrl() {
            return this.localCandidates
                .map((value) => this.getDisplayUrl(value))
                .find(Boolean) || "";
        },
    },
    data() {
        const task = progress.getTask(this.msgInfo);
        return {
            noticeArr: [],
            imgSrc: "",
            isSuccess: true,
            localSrc: "",
            failedLocalValues: [],
            percent: this.msgInfo?.percent ?? task?.percent ?? 0,
            loading: (this.msgInfo?.percent ?? 0) >= 100 ? false : task?.loading ?? false,
            downloadInFlight: false,
            imageRenderKey: 0,
            _progressTaskId: task?.taskId || null,
            downloadInFlightTimer: null,
        };
    },
    async created() {
        this.bindVideoThumbPropertyUpdate();
        if (this.externalPendding) {
            await this.externalPendding;
        }
        const hadLocal = this.hasLocalValue();
        let started = false;
        if (!hadLocal) {
            // 无 local 时视频仍有 isVideo 遮罩；图/动图需显式 loading，否则网格里空白
            if (this.msgInfo.chatType !== 3) {
                this.loading = true;
            }
            started = await this.handleFileDownload("default");
            if (!started && this.msgInfo.chatType !== 3) {
                this.loading = false;
            }
            if (this.externalPendding) {
                this.$emit("transfer-attempt", { started });
            }
        }
        if (this.loading) {
            this.initProgressBar();
        }
    },
    beforeDestroy() {
        // 移除监听，避免内存泄漏
        if (this._onProgress && this._progressTaskId) {
            progress.unsubscribe(this._progressTaskId, this._onProgress);
        }
        this.clearDownloadInFlightTimer();
        if (this._videoThumbUpdateMonitorKey) {
            eventBase.fnCommunicationMonitoring(this._videoThumbUpdateMonitorKey, null);
        }
    },
    watch: {
      ['msgInfo.percent'](value) {
        if (value >= 100) {
          this.loading = false;
          this.percent = value;
          this.downloadInFlight = false;
          this.clearDownloadInFlightTimer();
          this.retryImageAfterDownload();
        }
      },
      ['msgInfo.local']() {
        if (this.hasLocalValue()) {
            this.downloadInFlight = false;
            this.clearDownloadInFlightTimer();
        }
      },
      ['msgInfo.localThumbUrl']() {
        if (this.hasLocalValue()) {
            this.downloadInFlight = false;
            this.clearDownloadInFlightTimer();
        }
      },
      status(value) {
        if (value) {
            this.downloadInFlight = false;
            this.clearDownloadInFlightTimer();
        }
      },
    },
    methods: {
        bindVideoThumbPropertyUpdate() {
            if (this.msgInfo?.chatType !== 3) {
                return;
            }
            const { customMsgId, MsgID, mediaSlotIndex } = this.msgInfo || {};
            const slotKey =
                mediaSlotIndex !== undefined && mediaSlotIndex !== null && mediaSlotIndex !== ""
                    ? `thumb_${mediaSlotIndex}`
                    : "localThumbUrl";
            this._videoThumbUpdateMonitorKey = `videoThumbUpdate-${customMsgId || MsgID}-${mediaSlotIndex ?? "single"}-${this._uid}`;
            eventBase.fnCommunicationMonitoring(
                this._videoThumbUpdateMonitorKey,
                ["msgListPropertyUpdate"],
                (data = {}) => {
                    const packets = Array.isArray(data)
                        ? data.map((message) => message.data).filter(Boolean)
                        : [data];
                    const item = packets
                        .flatMap((packet) => packet.list || [])
                        .find((info) => info.customMsgId === customMsgId);
                    const updated = item?.updated || {};
                    const updatedThumb = updated[slotKey] || updated.localThumbUrl;

                    if (!updatedThumb) {
                        return;
                    }

                    this.loading = false;
                    this.downloadInFlight = false;
                    this.clearDownloadInFlightTimer();
                    this.$nextTick(() => {
                        setTimeout(() => this.retryImageAfterDownload([updatedThumb]), 0);
                    });
                }
            );
        },
        /**
         * 初始化进度条监听
         */
        initProgressBar() {
            progress.init(this.msgInfo);
            const nextTaskId = progress.getTask(this.msgInfo)?.taskId;
            if (!nextTaskId) {
                return;
            }
            if (this._onProgress && this._progressTaskId) {
                progress.unsubscribe(this._progressTaskId, this._onProgress);
            }
            this._progressTaskId = nextTaskId;
            this._onProgress = (percent) => {
                this.loading = true;
                this.percent = percent;
                if (this.percent >= 100) {
                    this.loading = false;
                    this.downloadInFlight = false;
                    this.clearDownloadInFlightTimer();
                    this.retryImageAfterDownload();
                    progress.complete(this.msgInfo);
                }
            };
            progress.subscribe(nextTaskId, this._onProgress);
        },
        clearDownloadInFlightTimer() {
            if (this.downloadInFlightTimer) {
                clearTimeout(this.downloadInFlightTimer);
                this.downloadInFlightTimer = null;
            }
        },
        startDownloadInFlightTimer() {
            this.clearDownloadInFlightTimer();
            this.downloadInFlightTimer = setTimeout(() => {
                this.downloadInFlight = false;
                this.downloadInFlightTimer = null;
            }, 50000);
        },
        macFixImagePath(url) {
            url = url || '';
            if (url.startsWith('app://./')) {
                const relativePath = url.replace('app://./', '');
                const absolutePath = `/${relativePath}`;
                return `local-resource://${absolutePath}`;
            }
            else if (!url.startsWith('local-resource://') && !url.startsWith('file://')) {
                if (url.startsWith('/')) {
                    return `local-resource://${url}`;
                }
            }
            else if (url.startsWith('file://')) {
                return url.replace(/^file:\/\//, 'local-resource://');
            }
            return url;
        },
        hasLocalValue() {
            const { local, localThumbUrl } = this.msgInfo || {};
            return !!(this.isUsableLocalValue(local) || this.isUsableLocalValue(localThumbUrl));
        },
        isUsableLocalValue(value) {
            return !!value && !isErrorLocalValue(value);
        },
        getDisplayUrl(value) {
            if (!this.isUsableLocalValue(value)) {
                return "";
            }
            if(isMac) {
              return this.macFixImagePath(value)
            }
            return toLocalResourceUrl(value)
        },
        getLocalCandidates() {
            return this.localCandidates;
        },
        getCurrentLocalValue() {
            return this.getLocalCandidates()[0] || "";
        },
        getUrl() {
            return this.displayUrl;
        },
        retryImageAfterDownload(extraValues = []) {
            const values = [this.msgInfo?.localThumbUrl, this.msgInfo?.local, ...extraValues].filter(Boolean);
            if (values.length) {
                this.failedLocalValues = this.failedLocalValues.filter((value) => !values.includes(value));
            }
            // 同一路径重下后 local 字段不会变，强制重挂 img 触发 Chromium 重新读文件。
            this.imageRenderKey += 1;
        },
        async hasLoadableLocalImage() {
            const urls = this.getLocalCandidates().map((value) => this.getDisplayUrl(value)).filter(Boolean);
            for (const url of urls) {
                if (!(await checkLocalFileExists(url))) {
                    continue;
                }
                if (await checkImageLoad(url)) {
                    return true;
                }
            }
            return false;
        },
        handleImageLoad() {
            this.isSuccess = true;
            this.loading = false;
            this.downloadInFlight = false;
            this.clearDownloadInFlightTimer();
        },
        async handleImageError() {
            this.isSuccess = false;
            if (this.hasError || this.loading) {
                return false;
            }
            const failedValue = this.getCurrentLocalValue();
            if (failedValue && !this.failedLocalValues.includes(failedValue)) {
                this.failedLocalValues = [...this.failedLocalValues, failedValue];
            }
            if (await this.hasLoadableLocalImage()) {
                this.loading = false;
                return false;
            }
            if (this.hasError || this.loading) {
                return false;
            }
            return this.handleFileDownload("image-error");
        },
        // 本地文件不存在了，重新触发下载
        retriggerDownloadWhenFailed() {
            const localUrl = this.getUrl();
            if (!this.loading && localUrl && localUrl.indexOf('http') !== 0) {
                this.loading = true;
            }
        },
        /**
         * 打开文件
         */
        handleOpenFile() {
          if (this.loading) return;
          const { chatType } = this.msgInfo || {};
          chatType === 3 && this.initProgressBar();
          const taskId = chatType === 3 ? progress.getTask(this.msgInfo)?.taskId : null;
          this._onProgress && !this.msgInfo?.percent && this._onProgress(0);
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
                return false;
            }
            if (this.downloadInFlight) {
                return false;
            }
            this.downloadInFlight = true;
            this.startDownloadInFlightTimer();
            const loginId = eventCommon.fnCommonInfoRU({
                getId: "loginId",
            });

            const { content, chatType, MsgID, fileKey, customMsgId } = this.msgInfo;
            // 本地文件不存在了，重新触发下载
            if (this.msgInfo?.msgType !== 17) {
                this.retriggerDownloadWhenFailed();
            }
            // 文件路径（剥离 || 后 thumb、size、宽高 等元数据，与历史单图逻辑一致）
            let fileUrl = content ? stripChatContentMetaSuffix(content) : "";
            if (chatType === 3) {
                const tail = content?.split("*P")[1];
                fileUrl = tail ? stripChatContentMetaSuffix(tail) : "";
            }
            if (!fileUrl && this.msgInfo.thumbUrl) {
                fileUrl = stripChatContentMetaSuffix(this.msgInfo.thumbUrl);
            }
            if (!fileUrl) {
                this.downloadInFlight = false;
                this.clearDownloadInFlightTimer();
                return false;
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
            let trendsFileUrl = "";
            try {
                trendsFileUrl = await getOssFirstNormalUrl(fileUrl);
            } catch (e) {
                this.downloadInFlight = false;
                this.clearDownloadInFlightTimer();
                return false;
            }

            const isPreviewDownload = [1, 9].includes(chatType);
            if (isPreviewDownload) {
                this.initProgressBar();
            }

            const downloadRequestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const downloadParams = {
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
                mediaSlotIndex: this.msgInfo.mediaSlotIndex,
                isOpen: false,
                timeout: 5000,
                fileSize: this.msgInfo.size || this.msgInfo.fileSize || 0,
                taskId: isPreviewDownload ? this.taskId : null,
                downloadRequestId,
            };
            eventFile.fnMediaDownloadRequestRegister(downloadParams);
            ipcRenderer.send("fileDownload", downloadParams);
            return true;
        },
        /**
         * 错误提示获取
         */
        handleErrorTipsGet() {
            const { chatType } = this.msgInfo;
            const fileUrl = this.status;

            // 错误类型也是记录在地址上
            switch (fileUrl) {
                case "downloadError": {
                    // 下载报错
                    if (chatType === 3) {
                        return this.$t("视频已过期");
                    }
                    return this.$t("图片已过期");
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
            return stripChatContentMetaSuffix(content);
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
    padding-bottom: 25px;
    // > .content ::v-deep .comTimeStatusLabel {
    //   right: 8px;
    //   bottom: 8px;
    //   z-index: 11;
    //   background: rgba(0, 0, 0, 0.25);
    //   border-radius: 9999px;
    //   padding: 2px 6px;
    //   > span {
    //     color: white;
    //   }
    // }

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
          height: 100%;
          border-radius: 6px;
          overflow: hidden;
          text-align: center;
          width: fit-content;
          background: #bababa;
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
