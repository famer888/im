import VueRouter from "vue-router";

const router = new VueRouter({
    mode: "hash",
    routes: [
        {
            path: "/login",
            component: () => import("@/pages/login/index.vue"),
        },
        {
            path: "/home",
            component: () => import("@/pages/home/index.vue"),
        },
        {
            path: "/exportPage",
            component: () => import("@/pages/exportPage/index.vue")
        }
    ],
});

export default router;
