/**
 * 全局IME修复插件
 *
 * 1. 使用事件委托 (Event Delegation) 替代全局 Mixin + querySelectorAll。
 * 2. 统一管理 composition 状态，解决 Mac 输入法丢字/卡死问题。
 * 3. 兼容 contenteditable 元素。
 */

const ImeFixPlugin = {
    install(Vue) {
        // 防止服务端渲染报错（虽然 Electron 是客户端）
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        // 避免重复安装
        if (window.__IME_FIX_INSTALLED__) return;
        window.__IME_FIX_INSTALLED__ = true;

        const triggerInput = (el) => {
            // 使用标准 Event 构造函数，兼容性更好
            const event = new Event('input', { bubbles: true, cancelable: true });
            el.dispatchEvent(event);
        };

        // 获取真实的输入目标（兼容 contenteditable 的子元素点击/输入）
        const getInputTarget = (target) => {
            if (!target) return null;
            // 如果是文本节点，取其父元素
            let el = target.nodeType === 3 ? target.parentNode : target;
            // 兼容所有 contenteditable 写法 (包括 contenteditable="", contenteditable="true", contenteditable="plaintext-only")
            if (el.closest) {
                return el.closest('input, textarea, [contenteditable]');
            }
            return null;
        };

        // 1. 监听 compositionstart (捕获阶段)
        document.addEventListener('compositionstart', (e) => {
            const target = getInputTarget(e.target);
            if (target) {
                target.composing = true;
            }
        }, true);

        // 2. 监听 compositionend (捕获阶段)
        document.addEventListener('compositionend', (e) => {
            const target = getInputTarget(e.target);
            if (target) {
                // 无论之前状态如何，强制标记结束并触发 input
                target.composing = false;
                triggerInput(target);
            }
        }, true);

        // 3. 监听 blur (捕获阶段，因为 blur 不冒泡)
        // 这是修复 Mac 输入法卡死/只能输空格的关键
        document.addEventListener('blur', (e) => {
            const target = getInputTarget(e.target);
            if (target) {
                // 如果在失焦时 Vue 认为还在 composing（输入法未正常结束），则强制重置
                if (target.composing) {
                    target.composing = false;
                    triggerInput(target);
                }
            }
        }, true);
    }
};

export default ImeFixPlugin;
