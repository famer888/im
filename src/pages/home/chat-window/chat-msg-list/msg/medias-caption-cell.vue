<template>
  <ComMsgImage
    :msgInfo="item"
    :chatContent="chatContent"
    :externalPendding="slotGate"
    @rightClick="(v) => $emit('rightClick', v)"
    @transfer-attempt="onTransferAttempt"
  />
</template>

<script>
import ComMsgImage from "./image.vue";

export default {
  name: "MediasCaptionCell",
  components: { ComMsgImage },
  props: {
    item: { type: Object, required: true },
    chatContent: { type: Object, required: true },
    /** () => Promise<releaseFn>，与 medias-caption 中队列一致 */
    acquireSlot: { type: Function, required: true },
  },
  data() {
    return {
      slotGate: null,
      _resolveGate: null,
      _release: null,
    };
  },
  created() {
    this.slotGate = new Promise((resolve) => {
      this._resolveGate = resolve;
    });
  },
  async mounted() {
    if (this.hasLocalPath(this.item)) {
      this._resolveGate();
      return;
    }
    try {
      this._release = await this.acquireSlot();
    } finally {
      this._resolveGate();
    }
  },
  beforeDestroy() {
    this.releaseHeldSlot();
  },
  watch: {
    item: {
      deep: true,
      handler: "onItemDeepChange",
    },
  },
  methods: {
    /** 多图父消息：以顶层是否存在 local_i / thumb_i 判断该槽是否已写入（与 medias-caption 约定一致） */
    hasLocalPath(msg) {
      if (!msg) return false;
      const i = msg.mediaSlotIndex;
      if (i != null && i >= 0) {
        const lk = `local_${i}`;
        const tk = `thumb_${i}`;
        if (Object.prototype.hasOwnProperty.call(msg, lk)) return true;
        if (Object.prototype.hasOwnProperty.call(msg, tk)) return true;
        return false;
      }
      return !!(msg.local || msg.localThumbUrl);
    },
    releaseHeldSlot() {
      if (!this._release) return;
      const r = this._release;
      this._release = null;
      r();
    },
    onItemDeepChange() {
      if (!this._release) return;
      if (this.hasLocalPath(this.item)) {
        this.releaseHeldSlot();
      }
    },
    onTransferAttempt({ started }) {
      if (!this._release) return;
      if (!started) {
        this.releaseHeldSlot();
      }
    },
  },
};
</script>
