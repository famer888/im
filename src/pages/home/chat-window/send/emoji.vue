<template>
  <div class="comEmoj" @click.stop>
    <div>
      <div @click.stop="type = 0" :class="type == 0 && 'active'">
        <img src="@/assets/images/chat/emoj-icon.png" />
      </div>
      <div
        v-if="!definedHidden"
        @click="type = 1"
        :class="type == 1 && 'active'"
      >
        <img src="@/assets/images/chat/own-icon.png" />
      </div>
    </div>
    <ul v-if="type == 0">
      <li
        v-for="(item, index) in emojis"
        :key="index"
        @click.stop="choice(1, item.value, item.key)"
      >
        <img :src="require('/public/images/emoji/' + item.value + '.png')" />
      </li>
    </ul>
    <ul v-else class="imgList">
      <li
        v-for="(item, index) in imgs"
        :key="index"
        @click.stop="choice(item.type, item.expressionIcon)"
      >
        <img :src="item.expressionIcon" />
      </li>
    </ul>
    <img src="@/assets/images/chat/jiantou-icon.png" />
  </div>
</template>
<script>
import { emojiObj } from "/public/emoji";
import touzi from "@/assets/images/message/touz_6.jpg";
import poker from "@/assets/images/message/poker.png";

export default {
  props: ["definedHidden", "chatType"],
  data() {
    return {
      type: 0,
      imgs: this.chatType === 'channel' ? []: [
      { expressionIcon: touzi, type: 2 },
      // { expressionIcon: poker, type: 3 },
    ],
      emojis: [],
    };
  },
  computed: {
    num() {
      return (arr, num) => {
        return Math.ceil(arr.length / num);
      };
    },
  },
  mounted() {
    this.initEmojiPicker();
  },
  methods: {
    initEmojiPicker() {
      this.emojis = this.emojis.slice(0, 77);
      this.length = parseInt(this.emojis.length / 45);
      this.emojis = Object.keys(emojiObj).map((key) => ({
        key,
        value: emojiObj[key],
      }));
    },
    /**
     * 1: emoji  2: 自定义图片
     */
    choice(type, value, key) {
      let values = type == 1 ? require("/public/images/emoji/" + value + ".png") : "1";
      this.$emit("choice", { type, value: values, key });
    },
  },
};
</script>
<style scoped lang="scss">
.comEmoj {
  position: absolute;
  width: 300px;
  height: 400px;
  background-color: #fff;
  box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border: 1px solid #cccccc;
  bottom: 50px;
  left: -60px;
  z-index: 10;

  > div {
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    padding: 5px 10px;

    > div {
      cursor: pointer;
      margin-right: 10px;
      padding: 4px 8px;
      border-radius: 17px;
      height: 32px;

      &.active {
        background: #f4f6f9;
      }
    }
  }

  > ul {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;

    &.imgList {
      > li {
        width: 80px;
        height: 80px;

        > img {
          width: 50px;
        }
      }
    }

    > li {
      width: 41px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        opacity: 0.8;
      }

      > img {
        display: block;
        width: 23px;
      }
    }
  }

  > img {
    position: absolute;
    bottom: -24px;
    left: 60px;
  }
}
</style>
