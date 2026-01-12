<template>
  <div class="overlay" v-if="showOverlay">
    <!-- 左上角标签：duration 优先于 extension -->
    <div class="top-left-tag" v-if="formattedDuration || extension">
      {{ formattedDuration || extension }}
    </div>

    <!-- 透明遮罩层 -->
    <div class="mask" v-if="loading"></div>

    <!-- Loading 状态：居中按钮区域 -->
    <div class="center-control" v-if="loading">
      <!-- 进度环或旋转环 -->
      <div class="progress-ring" :class="{ spinning: !hasPercent }">
        <svg viewBox="0 0 48 48">
          <!-- 背景圆环 -->
          <circle
            class="ring-bg"
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke-width="3"
          />
          <!-- 进度圆环 -->
          <circle
            class="ring-progress"
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke-width="3"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
      </div>
      <!-- 播放三角形 icon -->
      <div class="play-icon"></div>
    </div>

    <!-- Status 状态：错误/过期提示 -->
    <div class="status-overlay" v-if="showStatus">
      <div class="status-content">
        <!-- 过期 icon -->
        <svg v-if="isExpired" class="status-icon" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.5 0C17.8513 5.15406e-07 23 5.14873 23 11.5C23 17.8513 17.8513 23 11.5 23C5.14873 23 5.15422e-07 17.8513 0 11.5C0 5.14873 5.14873 0 11.5 0ZM11.3057 16.9385C10.825 16.9387 10.4346 17.3288 10.4346 17.8096C10.4347 18.2902 10.8251 18.6795 11.3057 18.6797C11.7863 18.6795 12.1756 18.2902 12.1758 17.8096C12.1758 17.3288 11.7864 16.9387 11.3057 16.9385ZM11.3047 4.5C10.5839 4.50042 9.99923 5.08479 9.99902 5.80566L10.4346 14.5127L10.4385 14.6025C10.4833 15.0412 10.8543 15.3835 11.3047 15.3838C11.7553 15.3838 12.126 15.0413 12.1709 14.6025L12.1758 14.5127L12.6113 5.80566C12.6111 5.08453 12.0259 4.5 11.3047 4.5Z" fill="#979797"/>
        </svg>
        <!-- 无法加载 icon -->
        <svg v-else class="status-icon status-icon-error" width="28" height="21" viewBox="0 0 28 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M27.6255 1.02656C27.3697 0.75341 27.016 0.59281 26.642 0.579958L15.9353 0.163452L15.1244 1.93098L16.2391 5.25602L14.2235 9.03852L15.0449 12.0836L17.0777 14.6964L20.0255 12.0052C20.164 11.8797 20.3463 11.8137 20.533 11.8214C20.6255 11.8248 20.7164 11.8464 20.8005 11.885C20.8846 11.9236 20.9602 11.9785 21.023 12.0465L24.8128 16.0985C24.907 16.1998 24.9691 16.3267 24.9912 16.4632C25.0133 16.5998 24.9945 16.7398 24.9371 16.8657C24.8775 16.9915 24.7823 17.097 24.6633 17.1692C24.5442 17.2414 24.4066 17.277 24.2675 17.2717L13.8818 16.8702L13.3638 18.3403L13.9266 19.6668L25.8653 20.1242C26.2394 20.1385 26.6041 20.0049 26.8803 19.7522C27.0166 19.6284 27.1267 19.4787 27.2044 19.3118C27.282 19.1449 27.3256 18.9642 27.3325 18.7802L27.9986 2.03003C28.0069 1.84642 27.9782 1.66302 27.9142 1.49074C27.8501 1.31847 27.7521 1.16085 27.6258 1.02726L27.6255 1.02656ZM19.9534 8.70812C19.5404 8.68703 19.143 8.54429 18.811 8.29785C18.4789 8.05141 18.2272 7.71229 18.0875 7.32315C17.9477 6.934 17.9262 6.51222 18.0256 6.11086C18.1249 5.70951 18.3408 5.3465 18.646 5.06752C18.9512 4.78854 19.332 4.60605 19.7407 4.543C20.1493 4.47995 20.5675 4.53917 20.9425 4.71319C21.3176 4.88722 21.6328 5.16828 21.8486 5.52102C22.0643 5.87376 22.1709 6.28242 22.1549 6.69559C22.1428 6.9724 22.0762 7.2441 21.959 7.49514C21.8418 7.74618 21.6761 7.97162 21.4716 8.15856C21.2671 8.3455 21.0278 8.49027 20.7673 8.58457C20.5067 8.67887 20.2302 8.72086 19.9534 8.70812ZM12.2568 18.3637L12.6155 16.8223L4.18322 17.3952C4.04404 17.4054 3.90494 17.3744 3.78334 17.3059C3.66175 17.2374 3.56307 17.1345 3.49966 17.0102C3.43774 16.8863 3.4142 16.7468 3.43203 16.6094C3.44986 16.4721 3.50826 16.3432 3.59976 16.2392L9.84734 9.14808C9.9124 9.07507 9.99178 9.01624 10.0805 8.97522C10.1693 8.9342 10.2656 8.91189 10.3633 8.90965C10.4611 8.90742 10.5583 8.92532 10.6488 8.96224C10.7394 8.99917 10.8213 9.05432 10.8897 9.12427L12.9813 11.2803L12.08 8.98042L13.6673 5.01382L12.2046 1.83753L12.815 0L1.31493 0.784361C1.13073 0.795577 0.950563 0.843099 0.784796 0.924193C0.619029 1.00529 0.47093 1.11835 0.349016 1.25689C0.227102 1.39542 0.133779 1.5567 0.0744157 1.73143C0.0150519 1.90616 -0.00918178 2.0909 0.00310836 2.27503L1.16967 19.0014C1.18196 19.1845 1.23074 19.3633 1.31314 19.5273C1.39555 19.6913 1.50992 19.8371 1.64953 19.9562C1.93393 20.1989 2.30161 20.3213 2.6747 20.2975L12.9431 19.5975L12.2561 18.3626L12.2568 18.3637Z" fill="#999999"/>
        </svg>
        <span class="status-text">{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Overlay',
  props: ['loading', 'percent', 'status', 'duration', 'extension'],
  computed: {
    showOverlay() {
      return this.loading || this.showStatus;
    },
    showStatus() {
      return this.status && this.status !== 'success';
    },
    isExpired() {
      // 判断是否为过期状态（包含"过期"或"清理"关键词）
      return this.status && (this.status.includes('过期') || this.status.includes('清理'));
    },
    hasPercent() {
      return this.percent !== undefined && this.percent !== null;
    },
    circumference() {
      return 2 * Math.PI * 21;
    },
    progressOffset() {
      if (!this.hasPercent) return 0;
      const p = Math.min(100, Math.max(0, this.percent));
      return this.circumference * (1 - p / 100);
    },
    formattedDuration() {
      console.log('>>> duration', this.duration);
      if (this.duration === undefined || this.duration === null) return null;
      const seconds = Math.floor(Number(this.duration));
      if (isNaN(seconds) || seconds < 0) return null;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped lang="scss">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  margin: 8px;
  border-radius: 10px;
  overflow: hidden;
}

/* 左上角标签 */
.top-left-tag {
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9999px;
  line-height: 1.2;
  z-index: 12;
}

/* 透明遮罩 75% 透明度 */
.mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 11;
}

/* 中央控制区域 */
.center-control {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  z-index: 13;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 进度环容器 */
.progress-ring {
  position: absolute;
  width: 48px;
  height: 48px;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    stroke: rgba(255, 255, 255, 0.3);
  }

  .ring-progress {
    stroke: #fff;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.2s ease;
  }

  /* 无 percent 时旋转动画 */
  &.spinning {
    animation: spin 1.2s linear infinite;

    .ring-progress {
      stroke-dasharray: 40 92;
      stroke-dashoffset: 0;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 播放三角形 icon */
.play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 14px;
  border-color: transparent transparent transparent #fff;
  margin-left: 3px;
  z-index: 14;
}

/* Status 错误/过期状态 */
.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon-error {
  width: 28px;
  height: 21px;
}

.status-text {
  color: #fff;
  font-size: 12px;
  text-align: center;
  line-height: 1.4;
  max-width: 140px;
  word-break: break-all;
}
</style>
