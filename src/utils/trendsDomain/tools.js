const os = require("os");

export const isTestEnv = process.env.VUE_APP_PACKNAME === "68-new-test" 

// 节流
export function throttle(func, wait) {  
    let lastTime = 0; // 这是一个闭包内的变量，它将在多次调用之间保持其值  
    return function(...args) {  
        const now = Date.now(); // 获取当前时间  
        if (now - lastTime >= wait) { // 检查是否已经过了指定的时间间隔  
            lastTime = now; // 更新上次调用时间  
            return func(...args); // 执行目标函数  
        }  
    };  
}

export function getCurrentTimestamp13Digits() {  
    // 获取当前时间的毫秒数  
    let timestamp = Date.now();  
    // 将毫秒数转换为字符串，并在前面补0以达到13位  
    // 注意：这实际上并没有增加时间精度，只是改变了表示方式  
    return timestamp.toString().padStart(13, '0');  
}  

// 判断时间是否过期，
export function isPastTimestamp(timestamp, diff = 0) {  
    const now = Date.now()- diff;  
    return now > timestamp;  
}  


export const getMacAddress = () => {
    // return 'e9:fb:1c:c5:9f:468'
    const interfaces = os.networkInterfaces();
    let result = "";
    if (interfaces?.WLAN?.length) {
        let item = interfaces.WLAN[0];
        result = item.mac;
    } else {
        for (const key in interfaces) {
            const networkInterface = interfaces[key];
            for (const item of networkInterface) {
                if (!item.internal && item.mac !== "00:00:00:00:00:00") {
                    result = item.mac;
                }
            }
        }
    }

    return result;
};

export function sortObjectByKeys(obj) {  
    return Object.keys(obj)  
      .sort() // 对键进行排序  
      .reduce((result, key) => {  
        result[key] = obj[key]; // 将排序后的键和原对象中的值组合成新对象  
        return result;  
      }, {}); // 初始化reduce的累加器为一个新对象  
  } 

export function getUrlDomain(urlString) {  
    try {
        const url = new URL(urlString);  
        return url.origin || ""; 
    } catch (error) {
        return ""
    }
}  

export function getFirstPathSegment(urlString) {  
    const url = new URL(urlString);  
    // 去除路径开头的'/'，然后使用'/'分割路径，并取第一个元素  
    const segments = url.pathname.slice(1).split('/');  
    if (segments.length > 0) {  
        return segments[0];  
    }  
    return null; // 如果没有路径段，则返回null或其他适当的值  
} 
