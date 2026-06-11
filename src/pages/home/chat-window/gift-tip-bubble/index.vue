<template>
  <div v-if="visibleItems.length" class="gift-tip-bubble-layer">
    <transition-group name="gift-tip" tag="div" class="gift-tip-list">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="gift-tip-item"
        :class="{ leaving: item.leaving }"
      >
        <div class="gift-tip-content">
          <div class="gift-tip-text">
            <span class="gift-tip-name">{{ item.userName }}</span>
            <span class="gift-tip-action">{{ item.actionText }}</span>
          </div>
          <div class="gift-tip-reward">
            <div class="gift-tip-icon-wrap">
              <img
                v-if="item.iconUrl"
                class="gift-tip-icon"
                :src="item.iconUrl"
                alt=""
              />
              <span v-else class="gift-tip-coin">{{ item.coinLabel }}</span>
            </div>
            <span class="gift-tip-amount">{{ item.displayAmount }}</span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
const MAX_VISIBLE = 3;
const DISPLAY_MS = 3200;
const LEAVE_MS = 420;

let giftTipId = 0;

export default {
  name: "ComGiftTipBubble",
  props: {
    tips: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      visibleItems: [],
      timers: {},
    };
  },
  watch: {
    tips: {
      deep: true,
      handler(list) {
        const latest = list[list.length - 1];
        if (!latest) return;
        this.enqueue(latest);
      },
    },
  },
  beforeDestroy() {
    Object.values(this.timers).forEach((timerIds) => {
      clearTimeout(timerIds.leave);
      clearTimeout(timerIds.remove);
    });
    this.timers = {};
  },
  methods: {
    enqueue(tip) {
      const id = ++giftTipId;
      const item = {
        id,
        userName: tip.userName || String(tip.fromUid || ""),
        actionText: tip.actionText,
        iconUrl: tip.iconUrl,
        coinLabel: (tip.coinName || "C").slice(0, 1).toUpperCase(),
        displayAmount: tip.displayAmount,
        leaving: false,
      };

      this.visibleItems = [...this.visibleItems, item].slice(-MAX_VISIBLE);
      this.scheduleRemove(id);
    },
    scheduleRemove(id) {
      if (this.timers[id]) {
        clearTimeout(this.timers[id].leave);
        clearTimeout(this.timers[id].remove);
      }

      const leave = setTimeout(() => {
        const target = this.visibleItems.find((item) => item.id === id);
        if (target) target.leaving = true;
      }, DISPLAY_MS);

      const remove = setTimeout(() => {
        this.visibleItems = this.visibleItems.filter((item) => item.id !== id);
        delete this.timers[id];
      }, DISPLAY_MS + LEAVE_MS);

      this.timers[id] = { leave, remove };
    },
  },
};
</script>

<style scoped lang="scss">
.gift-tip-bubble-layer {
  position: absolute;
  right: 16px;
  bottom: 120px;
  z-index: 20;
  pointer-events: none;
  width: 220px;
}

.gift-tip-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.gift-tip-item {
  animation: gift-tip-enter 0.55s cubic-bezier(0.22, 1.12, 0.36, 1) both;
  transform-origin: right center;

  &.leaving {
    animation: gift-tip-leave 0.42s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
}

.gift-tip-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 168px;
  max-width: 220px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(38, 38, 38, 0.82);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
}

.gift-tip-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-right: 10px;
}

.gift-tip-name {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-tip-action {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-tip-reward {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.gift-tip-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffd76a 0%, #f2b01e 100%);
}

.gift-tip-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gift-tip-coin {
  color: #8a5a00;
  font-size: 14px;
  font-weight: 700;
}

.gift-tip-amount {
  margin-left: 6px;
  color: #ffd76a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.gift-tip-enter-active,
.gift-tip-leave-active,
.gift-tip-move {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.gift-tip-enter {
  opacity: 0;
  transform: translateX(120%);
}

.gift-tip-leave-to {
  opacity: 0;
  transform: translateX(40px) translateY(-16px);
}

@keyframes gift-tip-enter {
  0% {
    opacity: 0;
    transform: translateX(120%) scale(0.92);
  }
  65% {
    opacity: 1;
    transform: translateX(-6px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes gift-tip-leave {
  0% {
    opacity: 1;
    transform: translateX(0) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(24px) translateY(-18px) scale(0.92);
  }
}
</style>
