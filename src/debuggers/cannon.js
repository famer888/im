import { IDS, messagesSchema } from "./schema";
import { fnMsgAdd } from "@/event/msg";

// 当前登录id为572083
let currentIndex = 0;
let sentCount = 0;
let maxCount = 0;
let timer = null;
let msgIdCounter = 10000; // 自增的 msgId 计数器
let customMsgIdCounter = Date.now(); // 自增的 customMsgId 计数器
let specialUid = null; // 特殊 uid，有 1/4 概率被选中

// 伪装成ws消息给渲染进程发送消息，轮流给IDS每个用户发送消息
const generateMessage = () => {
  // 使用messageSchema生成消息，friendId, id来源为UIDS，注意登录账号为572083，sender为对方，也就是被遍历的uids
  // chatType为0，msgType为0，content为随机字符串
  // tableName为常规私聊的tableName命名方式

  // 如果设置了特殊 uid，1/4 概率选择它，3/4 概率从列表中轮流选择
  let userId;
  if (specialUid && Math.random() < 0.25) {
    userId = specialUid;
  } else {
    userId = IDS[currentIndex % IDS.length];
  }
  currentIndex++;

  // 使用自增 ID 确保唯一性
  const msgId = msgIdCounter++;
  const customMsgId = `${customMsgIdCounter++}`;
  const sendTime = Date.now();

  // 生成随机字符串内容
  const randomStrings = [
    "你好", "在吗", "最近怎么样", "吃饭了吗", "今天天气不错",
    "周末有空吗", "一起玩游戏", "有时间聊聊", "最近在忙什么",
    "Hello", "How are you", "What's up", "Good morning", "Good night"
  ];
  const contentText = randomStrings[Math.floor(Math.random() * randomStrings.length)];

  // 直接返回解密后的格式，跳过所有解密流程
  const message = {
    msg: {
      chatType: 0,
      msgType: 0,
      ChatType: 0,
      MsgID: msgId,
      msgId: msgId,
      UserID: userId,
      sendUid: userId,
      receiveUid: 572083,
      friendId: userId,
      id: userId,
      contentMd5: Math.random().toString(36).substring(2, 34),
      customMsgId: customMsgId,
      sendTime: sendTime,
      sentOverTime: sendTime,
      isSelf: false,
      links: [],
      sendUser: {
        uid: userId,
        nickName: `User${userId}`,
        identify: Math.random().toString(36).substring(2, 12),
        createTime: sendTime - (Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
        userType: 1
      },
      tableName: `572083-message.man${userId}`
    },
    contentStr: contentText, // 直接传递解密后的文本
    fileKey: null,
    type: "friend"
  };

  return message;
}

const sendToWebsocket = () => {
  // 注意这里不是要你使用websocket发送哦，而是直接调用分发函数即可，跳过解码流程
  const { msg, contentStr, fileKey, type } = generateMessage();

  // 直接调用 fnMsgAdd，完全跳过 websocket 解码、解密和限流流程
  fnMsgAdd({ msg, contentStr, fileKey, type });

  if (sentCount % 10000 === 0) {
    console.log(`[Cannon] 已发送 ${sentCount} 条消息`);
  }

  // 计数
  counter();
}

export const install = () => {
  // 这里的install是install的UI层，需要你在docuement.body下添加开始结束两个按钮，fixed在右下角置顶
  // 开始按钮点击后调用start函数，结束按钮点击后调用stop函数
  // 样式直接使用string写在这里就行，不要单独写css文件，不换行，我不关心

  // 检查是否已经安装
  if (document.getElementById('cannon-control-panel')) {
    console.warn('[Cannon] UI 已经安装');
    return;
  }

  // 创建控制面板容器
  const panel = document.createElement('div');
  panel.id = 'cannon-control-panel';
  panel.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;background:#fff;border:2px solid #333;border-radius:8px;padding:15px;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-family:Arial,sans-serif;min-width:280px;';

  // 创建标题（作为拖拽手柄）
  const title = document.createElement('div');
  title.textContent = '🔫 Cannon 压力测试';
  title.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:12px;color:#333;text-align:center;cursor:move;user-select:none;padding:4px;margin:-4px -4px 12px -4px;border-radius:4px;transition:background 0.2s;';
  title.onmouseover = () => title.style.background = '#f0f0f0';
  title.onmouseout = () => title.style.background = 'transparent';

  // 拖拽功能
  let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
  title.onmousedown = (e) => { if (e.button !== 0) return; isDragging = true; dragOffsetX = e.clientX - panel.getBoundingClientRect().left; dragOffsetY = e.clientY - panel.getBoundingClientRect().top; panel.style.transition = 'none'; e.preventDefault(); };
  document.addEventListener('mousemove', (e) => { if (!isDragging) return; const x = e.clientX - dragOffsetX, y = e.clientY - dragOffsetY; const maxX = window.innerWidth - panel.offsetWidth, maxY = window.innerHeight - panel.offsetHeight; panel.style.left = Math.max(0, Math.min(x, maxX)) + 'px'; panel.style.top = Math.max(0, Math.min(y, maxY)) + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto'; });
  document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; panel.style.transition = ''; } });
  panel.appendChild(title);

  // 创建状态显示
  const statusDiv = document.createElement('div');
  statusDiv.id = 'cannon-status';
  statusDiv.textContent = '状态: 未启动';
  statusDiv.style.cssText = 'font-size:13px;color:#666;margin-bottom:10px;padding:8px;background:#f5f5f5;border-radius:4px;text-align:center;';
  panel.appendChild(statusDiv);

  // 创建数量输入
  const countLabel = document.createElement('div');
  countLabel.textContent = '消息数量:';
  countLabel.style.cssText = 'font-size:12px;color:#555;margin-bottom:4px;margin-top:8px;';
  panel.appendChild(countLabel);

  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.value = '1000000';
  countInput.placeholder = '消息数量';
  countInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px;';
  panel.appendChild(countInput);

  // 创建特殊 uid 输入
  const specialUidLabel = document.createElement('div');
  specialUidLabel.textContent = '特殊 UID (1/4概率):';
  specialUidLabel.style.cssText = 'font-size:12px;color:#555;margin-bottom:4px;';
  panel.appendChild(specialUidLabel);

  const specialUidInput = document.createElement('input');
  specialUidInput.type = 'number';
  specialUidInput.placeholder = '留空则不设置';
  specialUidInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px;';
  panel.appendChild(specialUidInput);

  // 创建间隔输入
  const intervalLabel = document.createElement('div');
  intervalLabel.textContent = '间隔时间(ms):';
  intervalLabel.style.cssText = 'font-size:12px;color:#555;margin-bottom:4px;';
  panel.appendChild(intervalLabel);

  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.value = '80';
  intervalInput.placeholder = '间隔时间(ms)';
  intervalInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:12px;';
  panel.appendChild(intervalInput);

  // 创建按钮容器
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:8px;';

  // 创建开始按钮
  const startBtn = document.createElement('button');
  startBtn.textContent = '▶️ 开始';
  startBtn.style.cssText = 'flex:1;padding:10px;background:#4CAF50;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;transition:background 0.3s;';
  startBtn.onmouseover = () => startBtn.style.background = '#45a049';
  startBtn.onmouseout = () => startBtn.style.background = '#4CAF50';
  startBtn.onclick = () => {
    const count = parseInt(countInput.value) || 1000000;
    const interval = parseInt(intervalInput.value) || 0;
    const uid = parseInt(specialUidInput.value) || null;
    start({ count, interval, specialUid: uid });
    statusDiv.textContent = `状态: 运行中 (0/${count})`;
    statusDiv.style.color = '#4CAF50';
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    startBtn.style.cursor = 'not-allowed';
    stopBtn.disabled = false;
    stopBtn.style.opacity = '1';
    stopBtn.style.cursor = 'pointer';

    // 更新进度显示
    const updateProgress = setInterval(() => {
      if (!timer) {
        clearInterval(updateProgress);
        statusDiv.textContent = `状态: 已完成 (${sentCount}/${count})`;
        statusDiv.style.color = '#2196F3';
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
        stopBtn.disabled = true;
        stopBtn.style.opacity = '0.5';
        stopBtn.style.cursor = 'not-allowed';
      } else {
        statusDiv.textContent = `状态: 运行中 (${sentCount}/${count})`;
      }
    }, 200);
  };
  btnContainer.appendChild(startBtn);

  // 创建停止按钮
  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹️ 停止';
  stopBtn.style.cssText = 'flex:1;padding:10px;background:#f44336;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;transition:background 0.3s;opacity:0.5;';
  stopBtn.disabled = true;
  stopBtn.style.cursor = 'not-allowed';
  stopBtn.onmouseover = () => { if (!stopBtn.disabled) stopBtn.style.background = '#da190b'; };
  stopBtn.onmouseout = () => { if (!stopBtn.disabled) stopBtn.style.background = '#f44336'; };
  stopBtn.onclick = () => {
    stop();
    statusDiv.textContent = `状态: 已停止 (${sentCount})`;
    statusDiv.style.color = '#ff9800';
    startBtn.disabled = false;
    startBtn.style.opacity = '1';
    startBtn.style.cursor = 'pointer';
    stopBtn.disabled = true;
    stopBtn.style.opacity = '0.5';
    stopBtn.style.cursor = 'not-allowed';
  };
  btnContainer.appendChild(stopBtn);

  panel.appendChild(btnContainer);

  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✖';
  closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;width:24px;height:24px;border:none;background:#f44336;color:#fff;border-radius:50%;font-size:12px;cursor:pointer;line-height:1;padding:0;';
  closeBtn.onclick = () => {
    if (timer) {
      if (confirm('正在运行中，确定要关闭吗？')) {
        stop();
        document.body.removeChild(panel);
      }
    } else {
      document.body.removeChild(panel);
    }
  };
  panel.appendChild(closeBtn);

  // 添加到页面
  document.body.appendChild(panel);

  console.log('[Cannon] UI 已安装');
}

export const start = (options) => {
  // options.count
  // options.interval
  // options.specialUid
  if (timer) {
    console.warn('[Cannon] 已经在运行中，请先停止');
    return;
  }

  const { count = 1000000, interval = 80, specialUid: uid = null } = options || {};
  maxCount = count;
  sentCount = 0;
  currentIndex = 0;
  specialUid = uid;
  // 重置 ID 计数器，确保每次开始都是新的唯一 ID
  msgIdCounter = 10000;
  customMsgIdCounter = Date.now();

  const specialInfo = specialUid ? `, 特殊UID=${specialUid}(1/4概率)` : '';
  console.log(`[Cannon] 开始发送消息：总数=${count}, 间隔=${interval}ms${specialInfo}`);

  // 如果 interval 为 0，直接循环发送所有消息
  if (interval === 0) {
    for (let i = 0; i < count; i++) {
      sendToWebsocket();
    }
    console.log(`[Cannon] 已完成，共发送 ${sentCount} 条消息`);
  } else {
    // 立即发送第一条
    sendToWebsocket();

    // 设置定时器继续发送
    if (sentCount < maxCount) {
      timer = setInterval(() => {
        sendToWebsocket();
      }, interval);
    }
  }
}

export const stop = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log(`[Cannon] 已停止，共发送 ${sentCount} 条消息`);
  } else {
    console.log('[Cannon] 未在运行中');
  }
}

const counter = () => {
  // 这里需要一个发送条数计算，到上限了自己停止
  sentCount++;

  if (sentCount >= maxCount) {
    console.log(`[Cannon] 已达到上限 ${maxCount} 条，自动停止`);
    stop();
  }
}
