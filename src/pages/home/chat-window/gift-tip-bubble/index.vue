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
            <img
              class="gift-tip-icon"
              :src="giftRewardCoinIcon"
              alt=""
            />
            <span class="gift-tip-amount">{{ item.displayAmount }}</span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import giftRewardCoinIcon from "@/assets/images/gift-reward-coin.svg";

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
      giftRewardCoinIcon,
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
  bottom: 200px;
  z-index: 200;
  pointer-events: none;
}

.gift-tip-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.gift-tip-item {
  animation: gift-tip-enter 0.55s cubic-bezier(0.22, 1.12, 0.36, 1) both;
  transform-origin: right center;

  &.leaving {
    animation: gift-tip-leave 0.42s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
}

.gift-tip-content {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: 280px;
  height: 34px;
  padding: 4px 12px;
  border-radius: 100px;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.gift-tip-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  flex: 0 1 auto;
  min-width: 0;
  height: 26px;
  gap: 0;
  overflow: hidden;
}

.gift-tip-reward {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}

.gift-tip-name {
  color: rgba(255, 255, 255, 1);
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  height: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-tip-action {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  height: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-tip-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.gift-tip-amount {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 1);
  font-size: 18px;
  font-weight: 700;
  font-style: italic;
  line-height: 18px;
  height: 18px;
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
