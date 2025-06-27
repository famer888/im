const Local = (name, value, time) => {
    let date = Date.parse(new Date()) / 1000;
    if (value === null) {
        localStorage.removeItem(name);
    } else if (value != undefined) {
        if (time) {
            localStorage.setItem(
                name,
                JSON.stringify({ value, time: date + time })
            );
        } else {
            localStorage.setItem(name, JSON.stringify({ value }));
        }
    } else {
        const v = localStorage.getItem(name);
        if (v) {
            if (JSON.parse(v).time) {
                if (JSON.parse(v).time - date > 0) {
                    return JSON.parse(v).value;
                } else {
                    localStorage.removeItem(name);
                    return undefined;
                }
            } else return JSON.parse(v).value;
        } else return undefined;
    }
};

const Session = (name, value, time) => {
    let date = Date.parse(new Date()) / 1000;
    if (value === null) {
        sessionStorage.removeItem(name);
    } else if (value != undefined) {
        if (time) {
            sessionStorage.setItem(
                name,
                JSON.stringify({ value, time: date + time })
            );
        } else {
            sessionStorage.setItem(name, JSON.stringify({ value }));
        }
    } else {
        const v = sessionStorage.getItem(name);
        if (v) {
            if (JSON.parse(v).time) {
                if (JSON.parse(v).time - date > 0) {
                    return JSON.parse(v).value;
                } else {
                    sessionStorage.removeItem(name);
                    return undefined;
                }
            } else return JSON.parse(v).value;
        } else return undefined;
    }
};

const createHash = (hashLength) => {
    // 默认长度 24
    return Array.from(Array(Number(hashLength) || 24), () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join("");
};

/**
 * 获取当前环境类型
 * 返回 test：测试环境，uat：预发, prod：正式
 */
const getEnvType =() => {
    const env = process.env.VUE_APP_ENV;
    console.log("getEnvType--", env)
    return env || ""
}

export { Local, createHash, Session, getEnvType };
