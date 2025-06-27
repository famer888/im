<template>
  <div class="comUpVersion">
    <div>
      <img src="@/assets/images/common/renew-icon.png" />
      <h2>{{ $t("发现新版本") }} {{ info.version }}</h2>
      <section>
        <span>{{ info.title }}</span>
        <div>{{ info.content }}</div>
      </section>
      <div>
        <div v-if="info.flag != 2" @click="handleClose">
          {{ $t("稍后更新") }}
        </div>
        <a target="_blank" :href="info.url" style="width: 100%">
          {{ $t("立即升級") }}
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import dayjs from "dayjs";

// 事件
import eventCommon from "@/event/common";

export default {
  props: ["info"],
  computed: {
    contentList() {
      let arr = [];
      if (info.content) {
        arr = info.content.split("，");
      }
      return arr;
    },
  },
  methods: {
    handleClose() {
      eventCommon.fnConfigRU({
        infoMerge: { upVersionDay: dayjs().format("YYYY-MM-DD") },
      });

      this.$emit("close");
    },
  },
};
</script>
<style scoped lang="scss">
.comUpVersion {
  position: fixed;
  z-index: 9000;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba($color: #000000, $alpha: 0.2);

  > div {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 400px;
    height: 320px;
    background-image: url("../assets/images/common/renew-back.png");
    background-size: 100% 100%;
    display: flex;
    flex-direction: column;

    > img {
      position: absolute;
      left: 50%;
      top: 0;
      transform: translate(-50%, -40%);
      z-index: 1;
    }

    > h2 {
      padding-top: 70px;
      font-weight: 600;
      font-size: 18px;
      z-index: 2;
      margin: 0;
    }

    > section {
      width: 100%;
      height: calc(100% - 170px);
      overflow: auto;
      z-index: 2;
      text-align: left;
      padding: 0 30px;
      box-sizing: border-box;

      > span {
        font-size: 14px;
        color: rgb(102, 102, 102);
        display: block;
        text-align: left;
        box-sizing: border-box;
        margin-top: 16px;
        margin-left: -6px;
      }

      > div {
        margin-top: 4px;
        color: rgb(102, 102, 102);
        white-space: pre-wrap;
      }
    }

    > div {
      display: flex;
      align-items: center;
      width: 100%;
      margin-top: 10px;
      padding: 0 24px;
      position: absolute;
      left: 0;
      bottom: 24px;

      > div,
      > a {
        width: 100%;
        border: 1px solid rgb(223, 223, 223);
        height: 44px;
        margin-right: 10px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: rgb(123, 123, 123);
        font-weight: bold;
        cursor: pointer;

        &:hover {
          background-color: #f8f8f8;
        }
      }

      > a {
        background-color: #3369fe;
        border: 1px solid #3369fe;
        color: #fff;

        &:hover {
          background-color: #3369fe;
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
