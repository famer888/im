// 日志收集系统
import { ipcRenderer } from "@/platform";

export const initLogCollectSystem = () => {
    console.$collect = function (message, meta) {
        ipcRenderer.send('renderer-log', 'info', message, meta)
    };
    console.$collectError = function (message, meta) {
        ipcRenderer.send('renderer-log', 'error', message, meta)
    };
    
    watchAllJsError()
}

// 监听全局 JavaScript 错误
const watchAllJsError = () => {
    window.addEventListener('error', (event) => {
        console.$collectError(['监听到错误:', event.message, '错误文件名', event.filename, '错误列号：', event.lineno])
    });
    window.addEventListener('unhandledrejection', (event) => {
        console.$collectError(['监听到Promise错误:', event.reason])
    });
    const originalConsoleError = console.error;
    console.error = function(...args) {
       console.$collectError(args)
         originalConsoleError.apply(console, args);
    }
}
