import { ipcMain, screen } from "electron";

let lastWidth = 600;
let isTogglingSidebar = false;
let normalWidth = 0; // 持续追踪非最大化时的窗口宽度
let sidebarOpenType = 'none'; // sidebar 打开时的类型：'none' | 'outer' | 'inner'
let pendingAdjustOnUnmaximize = 0; // 取消最大化时需要调整的宽度

export const initToggleSideBar = (mainWindow) => {
    let pendingWidthAfterUnmaximize = 0; // 取消最大化后要设置的宽度
    // 初始化 normalWidth
    normalWidth = mainWindow.getBounds().width;

    mainWindow.on("unmaximize", function () {
        // 取消最大化时，应用累积的宽度调整（只有 outer 相关的操作会产生调整）
        if (pendingAdjustOnUnmaximize !== 0) {
            const baseWidth = normalWidth > 0 ? normalWidth : mainWindow.getBounds().width;
            pendingWidthAfterUnmaximize = Math.max(baseWidth + pendingAdjustOnUnmaximize, 400);
        }
        // inner 保持 inner，不转换为 outer
        pendingAdjustOnUnmaximize = 0;
    });

    mainWindow.on('will-resize', (event, newBounds) => {
        // 拦截 Windows 恢复动作，强制设置我们的宽度
        if (pendingWidthAfterUnmaximize > 0 && mainWindow) {
            event.preventDefault();
            const targetWidth = pendingWidthAfterUnmaximize;
            mainWindow.setBounds({
                x: newBounds.x,
                y: newBounds.y,
                width: targetWidth,
                height: newBounds.height
            });
            // 更新 normalWidth 为设置后的宽度
            normalWidth = targetWidth;
            pendingWidthAfterUnmaximize = 0;
            return;
        }
        // 持续追踪非最大化时的宽度
        if (!mainWindow.isMaximized()) {
            normalWidth = newBounds.width;
        }
    });

    ipcMain.handle("toggleSideBar", async (event, visible) => {
        let type = 'none';

        try {
            if (!mainWindow) {
                return type;
            }

            isTogglingSidebar = true; // 设置标志，表示正在执行 toggle 操作
            const isMaximized = mainWindow.isMaximized();
            const bounds = mainWindow.getBounds();

            if (visible) {
                // 显示侧边栏
                if (!isMaximized) {
                    lastWidth = bounds.width; // 存储当前宽度
                    // 如果没有最大化，增加256px
                    const newWidth = Math.min(bounds.width + 256, screen.getPrimaryDisplay().workAreaSize.width);
                    mainWindow.setSize(newWidth, bounds.height);
                    sidebarOpenType = 'outer';
                    type = 'outer';
                } else {
                    // 最大化时不改变窗口大小，sidebar 在内部显示
                    // inner 不需要调整宽度，取消最大化后保持 inner
                    sidebarOpenType = 'inner';
                    type = 'inner';
                }
            } else {
                // 隐藏侧边栏
                if (!isMaximized) {
                    // 非最大化且之前是 outer：当前宽度 - 256
                    if (sidebarOpenType === 'outer') {
                        const newWidth = Math.max(bounds.width - 256, 400);
                        mainWindow.setSize(newWidth, bounds.height);
                    }
                    // inner 关闭时不改变窗口大小
                } else {
                    // 最大化时关闭，只有 outer 需要调整
                    if (sidebarOpenType === 'outer') {
                        // outer 在最大化时关闭，取消最大化时需要 -256
                        pendingAdjustOnUnmaximize -= 256;
                    }
                    // inner 关闭不需要调整（窗口大小本来就没变）
                }
                sidebarOpenType = 'none';
                type = 'none';
            }
        } catch (error) {
            type = 'none';
        }

        // 统一在函数尾部重置标志
        isTogglingSidebar = false;
        return type;
    });
};

export const getIsTogglingSidebar = () => isTogglingSidebar;

