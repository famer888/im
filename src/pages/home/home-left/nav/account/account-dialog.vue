<template>
  <div class="comAccountDialog" @click.stop>
    <div class="head">
      <picture>
        <ComImage
          v-if="loginInfo.icon !== undefined"
          :src="loginInfo.icon"
          type="friend"
        />
      </picture>
      <h2>
        {{ loginInfo.name }}
      </h2>
    </div>
    <p class="nickName">
      <span> {{ $t("昵称") }}: </span>
      <input
        v-if="isNeckNameEdit"
        v-model="nickName"
        ref="editInput"
        type="text"
        :placeholder="$t('请输入内容')"
        @blur="handleNameUpdate"
      />
      <i v-else>{{ nickName }}</i>
      <img
        v-if="!isNeckNameEdit"
        src="@/assets/images/message/edit-icon.png"
        @click.stop="handleSetEdit"
      />
    </p>
    <p>
      <span>{{ $t("性别") }}:</span>{{ $t("保密") }}
    </p>
    <div class="exportDb">
      <input
        v-model="password"
        type="password"
        maxlength="4"
        :placeholder="$t('请输入导出密码')"
      />
      <button
        :class="{ disable: password.length !== 4 }"
        @click.stop="handleExportDb"
      >
        {{ $t("导出保存本地") }}
      </button>
      <div>
        <span>!</span>
        <div>
          <p>1.{{ $t("导出密码用于载入使用，如不符则档案无法导入成功") }}</p>
          <p>2.{{ $t("密码为4位数字") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Cache } from "@/cache";
// api
import { updateUserInfo, getUserInfo } from "@/api/imBase";

// 工具
import { outFile } from "@/platformHelper";

// 事件
import eventCommon from "@/event/common";

export default {
  data() {
    return {
      loginInfo: {}, // 登录信息
      nickName: "", // 昵称
      password: "", // 密码
      isNeckNameEdit: false, // 匿名编辑中
    };
  },
  mounted() {
    // 登录信息
    this.loginInfo = eventCommon.fnCommonInfoRU({
      getId: "loginInfo",
    });

    // 昵称
    this.nickName = this.loginInfo.name;
    this.handleGetUserInfo();
  },
  methods: {
    handleSetEdit() {
      this.isNeckNameEdit = true;
      setTimeout(() => {
        this.$refs["editInput"].focus();
      }, 100);
    },
    async handleGetUserInfo() {
      const resLogin = await getUserInfo();
      if (resLogin && resLogin.userInfo) {
        const { nickName, icon } = resLogin.userInfo;

        const loginInfo = eventCommon.fnCommonInfoRU({
          getId: "loginInfo",
        });

        if (loginInfo.name !== nickName || loginInfo.icon !== icon) {
          // 如果头像变更则同步到导航
          if (loginInfo.icon !== icon) {
            this.$emit("changeIcon", icon);
          }

          this.loginInfo = {
            ...loginInfo,
            name: nickName,
            icon,
          };

          this.nickName = nickName;

          // 更新登录信息
          eventCommon.fnCommonInfoRU({
            infoMerge: {
              loginInfo: this.loginInfo,
            },
          });

          this.handleAccountUpdate();
        }
      }
    },
    /**
     * 名称更新
     */
    handleNameUpdate() {
      // 如果为则重置
      if (this.nickName === "") {
        this.nickName = this.loginInfo.name;
        return;
      }

      if (this.loginInfo.name === this.nickName) {
        this.isNeckNameEdit = false;
        return;
      }

      // 更新
      updateUserInfo({
        userParam: {
          nickName: this.nickName,
        },
        ops: [2],
      })
        .then((rt) => {
          if (rt.commonResult.errCode == 200) {
            this.loginInfo.name = this.nickName;
            // 更新登录信息
            eventCommon.fnCommonInfoRU({
              infoMerge: {
                loginInfo: this.loginInfo,
              },
            });

            // 成功提示
            window.$toast(this.$t("修改成功"));
          } else {
            window.$toast(rt.commonResult.errMsg || this.$t("修改失败"));
          }
          this.isNeckNameEdit = false;
          this.handleAccountUpdate();
        })
        .catch(() => {
          window.$toast(this.$t("修改失败"));
          this.isNeckNameEdit = false;
        });
    },
    /**
     * 导出数据库
     */
    handleExportDb() {
      if (this.password.length !== 4) {
        return;
      }

      if (/^[0-9]+$/.test(this.password)) {
        // 导出
        outFile(this.password);
      } else {
        // 密码错误
        window.$toast(this.$t("密码错误，必须为4位数字"));
      }
    },
    /**
     * 更新账户
     */
    handleAccountUpdate() {
      Cache("login-account-list").then(async (res) => {
        Cache(
          "login-account-list",
          res.map((item) => {
            return item.id === this.loginInfo.id
              ? {
                  ...item,
                  name: this.nickName,
                  icon: this.loginInfo.icon,
                }
              : item;
          })
        );
      });
    },
  },
};
</script>
<style scoped lang="scss">
.comAccountDialog {
  padding: 40px;
  width: 350px;
  height: 265px;
  background-color: #fff;
  text-align: left;

  > .head {
    height: 76px;
    border-bottom: 1px solid #eee;
    display: flex;
    margin-bottom: 10px;

    > picture {
      display: block;
      height: 55px;
      width: 55px;
      border-radius: 50%;
      margin-right: 10px;

      > img {
        display: block;
        height: 55px;
        width: 55px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    > h2 {
      width: 205px;
      height: 55px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis; 
      line-height: 55px;
      font-size: 16px;
      color: #333;
    }
  }

  .nickName{
    display: flex;
    i{
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  > p {
    height: 30px;
    line-height: 30px;
    color: #333;
    font-size: 14px;
    display: flex;
    align-items: center;
    
    > span {
      width: 37px;
      font-size: 14px;
      color: #666;
      display: inline-block;
      margin-right: 5px;
    }

    > img {
      display: block;
      height: 15px;
      margin-left: 5px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
  > .exportDb {
    display: flex;
    align-items: center;
    height: 20px;
    margin-top: 10px;

    > input {
      padding: 0 10px;
      border: 1px solid #3369fe !important;
      border-radius: 4px;
      height: 22px;
      width: 110px;
      text-align: center;
      box-sizing: border-box;
      margin-right: 10px;
      &::-webkit-input-placeholder {
        font-size: 12px;
        color: #999;
      }
    }

    > button {
      padding: 0 13px;
      display: inline-block;
      height: 22px;
      line-height: 22px;
      font-size: 12px;
      border-radius: 4px;
      border: 0;
      background-color: #3369fe;
      color: #fff;
      cursor: pointer;

      &.disable {
        opacity: 0.5;
        cursor: default;
      }
    }

    > div {
      margin-left: 5px;
      border: 1px solid #3369fe;
      width: 16px;
      height: 16px;
      line-height: 16px;
      text-align: center;
      border-radius: 50%;
      cursor: pointer;
      position: relative;

      &:hover {
        > div {
          display: block;
        }
      }

      > span {
        color: #3369fe;
        font-size: 12px;
        display: block;
      }

      > div {
        position: absolute;
        left: 0;
        bottom: 22px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        box-shadow: 0 2px 2px 0 rgb(0 0 0 / 14%),
          0 3px 1px -2px rgb(0 0 0 / 20%), 0 1px 5px 0 rgb(0 0 0 / 12%);
        line-height: 20px;
        padding: 10px;
        text-align: left;
        background: #fff;
        display: none;

        > p {
          white-space: nowrap;
          color: #3369fe;
          font-size: 12px;
        }
      }
    }
  }
}
</style>