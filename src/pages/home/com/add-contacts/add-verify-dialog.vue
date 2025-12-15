<template>
    <div class="add-verify-dialog">
        <div class="content">
            <div class="head">
                <span>添加验证</span>
                <img class="close" src="@/assets/images/common/close-icon.png" @click="$emit('close')" />
            </div>
            <textarea class="input" v-model="verifyValue" :placeholder="placeholder" rows="3"  maxlength="20"></textarea>
            <div class="primaryBtn" @click="confirm">完成</div>
        </div>
    </div>
</template>

<script>
export default {
    name: "addVerifyDialog",
    props: ['placeholder', 'defalutValue'],
    data() {
        return {
            verifyValue: this.defalutValue || ""
        }
    },
    watch: {
        verifyValue(v) {
            if(v.length > 20) {
                let val = v.slice(0, 20);
                const lastCode = val.charCodeAt(val.length - 1);
                if (lastCode >= 0xD800 && lastCode <= 0xDBFF) {
                    val = val.slice(0, -1);
                }
                this.verifyValue = val;
            }
        }
    },
    methods: {
        confirm() {
            this.$emit("confirm", this.verifyValue)
        }
    }
}
</script>

<style lang="scss" scoped>
.add-verify-dialog {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    background: rgba($color: #000000, $alpha: 0.2);
    display: flex;
    align-items: center;
    justify-content: center;

    .content {
        width: 300px;
        border-radius: 6px;
        background: #ffffff;
        padding: 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;

        .head {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #787878;
            font-size: 16px;
        }

        .close {
            cursor: pointer;
        }

        .input {
            height: 100px;
            background: #F5F6FA;
            border-radius: 2px;
            margin-top: 26px;
            padding: 8px;
            color: #000;
        }

        .primaryBtn {
            height: 32px;
            margin-top: 32px;
        }
    }
}
</style>