<template>
    <div class="export-root">
        <div>
            <button @click="goback">返回: home</button>
        </div>
        <img class="export-bg" src="../../assets/images/file/export-bg.webp" />
    </div>
</template>

<script>
export default {
    data() {
        return {
            pageName: '导出页面'
        }
    },
    created() {
        let arr = [1, 3, 5, 7, 9]
        let ary = arr.map(item => {
            return item + 1
        })
        let sortArr = [...arr, ...ary].sort((a, b) => {return b - a})
        console.log(sortArr, 20000)
    },
    methods: {
        goback() {
            this.$router.push({path: '/home'})
        }
    }
}
</script>

<style scoped lang="scss">
.export-root{
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    .export-bg{
        width: 50%;
        height: 50%;
    }
}
</style>