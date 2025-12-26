<template>
  <div class="comFileIn">
    <div>
      <picture @click.stop="$emit('close')">
        <img src="@/assets/images/common/close-icon.png" />
      </picture>
      <img class="icon" src="@/assets/images/login/dock.png" alt="" />
      <div class="txt">{{ $t("请输入导出密码") }}</div>
      <input v-model="key" type="password" maxlength="4" />
      <label for="file-in">
        <div class="primaryBtn mini" :class="!key && 'hui'" @click="fileChange">
          {{ $t("确定") }}
        </div>
        <input id="file-in" class="hidden" type="file" @change="fileChange" />
      </label>
    </div>
  </div>
</template>

<script>
import { inFileFun } from "@/platformHelper";
import BDBase from "@/database/queue";
import i18n from "@/assets/lang/i18n";

export default {
  data() {
    return {
      key: "",
    };
  },
  methods: {
    async fileChange(e) {
      if (e.target.files) {
        const data = await inFileFun(e.target.files[0], this.key);
        document.getElementById("file-in").value = "";
        if (data) {
          const { uid, history } = data;

          const db = new BDBase(Number(uid));

          if (uid && history) {

            for (const key of Object.keys(history)) {
              db.addDB(key, history[key]);
            }

            setTimeout(() => {
              window.$toast(i18n.t("导入成功"));
            }, 5000);
          }
        } else {
          window.$toast(i18n.t("密码或文件错误"));
        }
      }
    },
    sure(e) {
      if (!this.key) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.comFileIn {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  > div {
    text-align: center;
    padding: 10px 16px;
    border-radius: 8px;
    width: 200px;
    background: #fff;
    position: relative;

    > picture {
      position: absolute;
      top: 0;
      right: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }

    > img {
      display: block;
      margin: 10px auto 5px;
      width: 70px;
    }

    .txt {
      color: #3369fe;
      font-size: 12px;
    }

    input {
      margin: 10px auto 15px;
      padding: 0 10px;
      width: 60%;
      height: 24px;
      border-radius: 4px;
      text-align: center;
      font-size: 20px;
      border: 1px solid #3369fe !important;
    }
  }

  .hui {
    opacity: 0.5;
  }

  .hidden {
    display: none;
  }
}
</style>
