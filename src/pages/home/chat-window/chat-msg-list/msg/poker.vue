<template>
  <div class="comMsgPoker" @click.right="(e) => $emit('rightClick', e)">
    <slot></slot>
    <div class="content">
      <img v-if="resultSrc" :src="resultSrc" @error="handleImageError" />
      <p v-else-if="imageError" class="error-message"> [{{receivedResult || "扑克牌结果异常"}}]</p>
      <img v-else :src="animationSrc" />
    </div>
  </div>
</template>
  <script>
export default {
  props: ['msgInfo', 'chatContent'],
  data() {
    return {
      resultSrc: '',
      imageError: false,
      animationSrc: require('@/assets/images/game/start.gif'),
    }
  },
  computed: {
    receivedResult() {
      const content = this.msgInfo?.content || '||'
      return content.split('||')[0]
    },
    isSeeAnimation() {
      const content = this.msgInfo?.content || ''
      return content.split('|SEE|')[1]
    },
  },
  watch: {
    receivedResult() {
      this.setResult()
    },
  },
  mounted() {
    this.seeAnimation(1).then(() => {
      this.seeAnimation(2)
    })
    this.setResult()
  },
  methods: {
    // 观看动画，type 1：开场动画 2：加载中动画，3：结束动画
    // 观看结束时返回type值
    seeAnimation(type) {
      return new Promise((resolve) => {
        clearTimeout(this.timerAnimation)
        if (type === 1) {
          this.animationSrc = require('@/assets/images/game/start.gif')
          this.timerAnimation = setTimeout(() => {
            resolve(type)
          }, 700)
        } else if (type === 2) {
          this.animationSrc = require('@/assets/images/game/wait.gif')
          resolve(type)
        } else if (type === 3) {
          this.animationSrc = require('@/assets/images/game/end.gif')
          this.timerAnimation = setTimeout(() => {
            resolve(type)
          }, 1200)
        }
      })
    },
    handleImageError() {
      this.imageError = true
    },
    // 记录动画已经观看过
    recordSeeAnimationEnd() {
      const { customMsgId } = this.msgInfo
      const { type, id } = this.chatContent
      // console.log("updateAnimationSee-1-", id, type, customMsgId)
      if (!id || !type || !customMsgId) return
      const params = {
        id,
        type,
        list: [
          {
            customMsgId,
            updated: { content: this.msgInfo.content + '|SEE|1' },
          },
        ],
      }
      // console.log("updateAnimationSee-", this.isSeeAnimation, params)
      window.$db.updateMsgProperty(params)
    },
    async setResult() {
      if (!this.receivedResult) return
      this.imageError = false
      try {
        // console.log("setResult---", this.receivedResult)
        const resultSrc = require(`@/assets/images/game/${this.receivedResult}.png`)
        if (resultSrc) {
          if (!this.isSeeAnimation) {
            await this.seeAnimation(1)
            await this.seeAnimation(3)
            this.recordSeeAnimationEnd()
          }
          this.resultSrc = resultSrc
        }
      } catch (error) {
        // console.log("setResult--7-")
        this.handleImageError()
      }
    },
  },
}
</script>
  <style scoped lang="scss">
.comMsgPoker {
  position: relative;
  padding: 10px 75px 15px 10px;
  border-radius: 10px;
  border-top-left-radius: 0;
  // background: rgb(243, 243, 243);
  > .content {
    height: 120px;

    > img {
      display: block;
      height: 120px;
    }
  }
}
</style>