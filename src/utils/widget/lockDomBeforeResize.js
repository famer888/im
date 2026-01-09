import { ipcRenderer } from "electron";

// 一般来说不推荐直接操作dom
// 但这个二栏自适应突变宽度三栏自适应，宽度变化从长变短，突变过快会导致闪烁
// 这里写个锁死dom宽度的函数，delay为300ms的自动移除
// 我是没别的办法了，有兴趣的可以试试
let timer = null;
let lastType = 'none';
export const lockDomBeforeResize = async(visible, manually) => {
  // console.log('[debug]', lastType, manually, visible);
  if (lastType === 'outer' && manually && !visible) {
    const dom = document.querySelector('.messageContent .chatContent');
    const offsetWidth = dom?.offsetWidth;
    if (offsetWidth + 333 !== screen.availWidth) {
      const container = document.querySelector('.messageContent > div');
      container && container.setAttribute('style', `width: 100vw`);
      dom && dom.setAttribute('style', `width: ${offsetWidth}px; padding-right: 256px;`);
    }
  }
  const cleanup = viewportWidthSizeObserver((width, lastWidth) => {
    console.log('[debug]', lastWidth, width);
    if (lastWidth - width > 250) {
      timer = setTimeout(() => {
        removeAttribute();
        clearTimeout(timer);
        timer = null;
        cleanup();
      }, 300);
    } else {
      cleanup();
    }
  });
  const type = lastType = await ipcRenderer.invoke('toggleSideBar', visible);
  return type;
}

const removeAttribute = () => {
  const dom = document.querySelector('.messageContent .chatContent');
  const container = document.querySelector('.messageContent > div');
  dom && dom.removeAttribute('style');
  container && container.removeAttribute('style');
}

const viewportWidthSizeObserver = (cb) => {
  // 使用 ResizeObserver 监听页面宽度变化（比 MutationObserver 更适合且性能更好）
  let lastWidth = document.documentElement.clientWidth;

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const currentWidth = entry.contentRect.width;
      // console.log('[debug]', currentWidth, lastWidth);
      // 只在宽度实际变化时触发回调
      if (currentWidth !== lastWidth) {
        cb(currentWidth, lastWidth);
        lastWidth = currentWidth;
      }
    }
  });

  // 监听 document.documentElement (html 元素) 的尺寸变化
  resizeObserver.observe(document.documentElement);

  // 返回清理函数，用于取消监听
  return () => {
    resizeObserver.disconnect();
  };
}
