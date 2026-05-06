// 导出 Cannon 压力测试工具
export { start, stop, install } from './cannon';

// 会话列表生成工具
// export { generateMessageUserList } from './conversations';

// 性能基准测试工具
export { default as benchmark } from './benchmark';

// 私聊发送诊断器（仅 OneToOneMessage friend 路径）
export { default as oneToOneSendDiag } from './oneToOneSendDiag';

// 如果需要直接执行会话列表生成，取消下面的注释
// const { generateMessageUserList } = require('./conversations');
// generateMessageUserList();
