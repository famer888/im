
// 状态位运算常量
const STATUS = {
  SEND: 0,           // 发送
  SUCCESS: 1,        // 成功
  FAILED: 2,         // 失败
  RENDER_SUCCESS: 4, // 渲染了成功图标
  RENDER_FAILED: 8,  // 渲染了失败图标
}

class Marks extends Map {
  // 先入先出，最大长度可配置，超过则删除最早的
  maxSize = 30
  constructor(maxSize = 30) {
    super()
    this.maxSize = maxSize
  }
  set(key, value) {
    // 如果 key 已存在，先删除再添加，以保持插入顺序
    if (this.has(key)) {
      this.delete(key)
    }

    // 如果已达到最大容量，删除最早的条目
    if (this.size >= this.maxSize) {
      const firstKey = this.keys().next().value
      this.delete(firstKey)
    }

    return super.set(key, value)
  }
}

class Benchmark {
  marks = {
    // 保留注释
    // 前两个为drain massassLog的位置，保存耗时的文本即可
    getMsgList: new Marks(3),
    addDB: new Marks(3),
    reconnect: new Marks(3),

    // map key为MsgId, value的key值为所有能导致发送消息失败的函数，值为执行次数
    // 是否发送(无需排除网络问题)，是否收到服务器的确认，是否有渲染(成功或失败），所有导致发送消息失败的函数执行次数，渲染挂载次数，导致重渲染的函数: []
    // sendLog.set(msgId, { sended: boolean, recieved: boolean, success: boolean, failed: boolean, fnMsgSendFail: excute counts, mounted: counts, })
    // success和failed改为status，使用位运算叠加：发送：0，成功1， 失败2，渲染了成功图标：4，渲染了失败图标：8
    sendLog: new Marks(20),
    // profile: {}
  }

  constructor() {
    this._registerDevToolsHook()
  }

  // ==================== getMsgList / addDB 耗时记录 ====================

  /**
   * 记录 getMsgList 耗时文本
   * @param {string} id 任务ID
   * @param {string} text 耗时文本
   */
  recordGetMsgList(id, text) {
    this.marks.getMsgList.set(id, text)
  }

  /**
   * 记录 addDB 耗时文本
   * @param {string} id 任务ID
   * @param {string} text 耗时文本
   */
  recordAddDB(id, text) {
    this.marks.addDB.set(id, text)
  }

  // ==================== 重连记录 ====================
  _reconnectTimes = []  // 存储重连时间戳

  /**
   * 记录一次重连，返回5分钟内重连次数
   * @returns {number} 5分钟内重连次数
   */
  recordReconnect() {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000

    // 清理超过5分钟的记录
    this._reconnectTimes = this._reconnectTimes.filter(t => t > fiveMinutesAgo)

    // 添加当前重连时间
    this._reconnectTimes.push(now)

    const count = this._reconnectTimes.length
    this.marks.reconnect.set(`reconnect-${now}`, `重连次数(5分钟内): ${count}`)

    return count
  }

  /**
   * 获取5分钟内重连次数
   * @returns {number}
   */
  getReconnectCount() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    this._reconnectTimes = this._reconnectTimes.filter(t => t > fiveMinutesAgo)
    return this._reconnectTimes.length
  }

  // ==================== sendLog 相关方法 ====================
  // status 位运算：发送0，成功1，失败2，渲染成功图标4，渲染失败图标8

  /**
   * 初始化消息发送日志（发送时调用）
   * @param {string} msgId
   */
  initSendLog(msgId) {
    this.marks.sendLog.set(msgId, {
      sended: true,
      recieved: false,
      status: STATUS.SEND,  // 位运算状态
      fnMsgSendFail: {},    // { fnName: count }
      mounted: 0,
      rerenderFns: [],      // 导致重渲染的函数
      sendTime: Date.now()
    })
  }

  getSendLogForRightMenu(msgId, customMsgId) {
    const log = this.marks.sendLog.get(customMsgId)
    if (!log) {
      return `${customMsgId}: ${msgId || '-'} | 无记录`
    }

    const sent = log.sended ? '√' : 'X'
    const recieved = log.recieved ? '√' : 'X'
    const Rsent = (log.status & STATUS.RENDER_SUCCESS) ? '√' : 'X'
    const Rfailed = (log.status & STATUS.RENDER_FAILED) ? '√' : 'X'
    const failNames = Object.keys(log.fnMsgSendFail).join('-') || 'none'

    return `${customMsgId}: ${log.MsgId || msgId || '-'} | sent${sent} | recieved${recieved} | Rsent${Rsent} | Rfailed${Rfailed} | mount:${log.mounted} | references:${failNames}`
  }

  /**
   * 标记收到服务器确认
   * @param {string} msgId
   */
  markRecieved(msgId) {
    const log = this.marks.sendLog.get(msgId)
    if (log) {
      log.recieved = true
      log.recieveTime = Date.now()
    }
  }

  /**
   * 标记成功（位运算叠加 1）
   * @param {string} msgId
   */
  markSuccess(msgId) {
    const log = this.marks.sendLog.get(msgId)
    if (log) {
      log.status |= STATUS.SUCCESS
    }
  }

  /**
   * 标记失败（位运算叠加 2），记录失败函数
   * @param {string} msgId
   * @param {string} fnName 导致失败的函数名
   */
  markFailed(msgId, fnName) {
    const log = this.marks.sendLog.get(msgId)
    if (log) {
      log.status |= STATUS.FAILED
      if (fnName) {
        log.fnMsgSendFail[fnName] = (log.fnMsgSendFail[fnName] || 0) + 1
      }
    }
  }

  /**
   * 标记渲染了成功图标（位运算叠加 4）
   * @param {string} customMsgId
   * @param {string|number} MsgId 服务器返回的 MsgID
   */
  markRenderSuccess(customMsgId, MsgId) {
    const log = this.marks.sendLog.get(customMsgId)
    if (log) {
      log.status |= STATUS.RENDER_SUCCESS
      if (MsgId) log.MsgId = MsgId
    }
  }

  /**
   * 标记渲染了失败图标（位运算叠加 8）
   * @param {string} customMsgId
   * @param {string|number} MsgId 服务器返回的 MsgID
   */
  markRenderFailed(customMsgId, MsgId) {
    const log = this.marks.sendLog.get(customMsgId)
    if (log) {
      log.status |= STATUS.RENDER_FAILED
      if (MsgId) log.MsgId = MsgId
    }
  }

  /**
   * 记录渲染挂载次数
   * @param {string} customMsgId
   * @param {string|number} MsgId 服务器返回的 MsgID
   */
  markMounted(customMsgId, MsgId) {
    const log = this.marks.sendLog.get(customMsgId)
    if (log) {
      log.mounted++
      if (MsgId) log.MsgId = MsgId
    }
  }

  /**
   * 消息渲染时调用，处理挂载和渲染状态
   * @param {object} msgInfo - { isSelf, customMsgId, MsgID, readStatus }
   */
  onMsgRender(msgInfo) {
    if (!msgInfo.isSelf || !msgInfo.customMsgId) return

    // 仅在 readStatus 为 -1（发送中）时记录挂载
    if (msgInfo.readStatus === -1) {
      this.markMounted(msgInfo.customMsgId, msgInfo.MsgID)
    }

    // 根据 readStatus 标记渲染了哪种图标
    if (msgInfo.readStatus === 0) {
      this.markRenderFailed(msgInfo.customMsgId, msgInfo.MsgID)
    } else if (msgInfo.readStatus === 1 || msgInfo.readStatus === 2) {
      this.markRenderSuccess(msgInfo.customMsgId, msgInfo.MsgID)
    }
  }

  /**
   * 记录导致重渲染的函数
   * @param {string} msgId
   * @param {string} fnName
   */
  markRerender(msgId, fnName) {
    const log = this.marks.sendLog.get(msgId)
    if (log && fnName) {
      log.rerenderFns.push({ fn: fnName, time: Date.now() })
    }
  }

  /**
   * 获取消息发送日志
   * @param {string} msgId
   */
  getSendLog(msgId) {
    return this.marks.sendLog.get(msgId)
  }

  /**
   * 检查状态是否包含某个位
   * @param {string} msgId
   * @param {number} statusBit
   */
  hasStatus(msgId, statusBit) {
    const log = this.marks.sendLog.get(msgId)
    return log ? (log.status & statusBit) !== 0 : false
  }

  _registerDevToolsHook() {
    try {
      const { currentWindow } = require('@/platform')
      if (currentWindow && currentWindow.webContents) {
        currentWindow.webContents.on('devtools-opened', () => {
          this.onDevTool()
        })
      }
    } catch (e) {
      // 非 Electron 环境，忽略
    }
  }

  onDevTool() {
    // 延迟执行，避免阻塞 DevTools 打开
    setTimeout(() => this._printReport(), 100)
  }

  _printReport() {
    console.group('%c📊 Benchmark Report', 'font-size: 14px; font-weight: bold; color: #4CAF50;')

    // 系统信息
    console.group('🖥️ System Info')
    const sysInfo = getSystemInfo()
    const memInfo = getMemoryInfo()
    const appMemInfo = getAppMemoryInfo()
    const version = getVersion()
    console.log('版本:', version)
    console.log('CPU:', sysInfo.cpu)
    console.log('硬盘:', sysInfo.disk)
    console.log('内存:', memInfo)
    if (appMemInfo) {
      console.log(`应用: RSS ${appMemInfo.rss} | 堆已用 ${appMemInfo.heapUsed} / 堆总量 ${appMemInfo.heapTotal}`)
    }
    console.groupEnd()

    // 重连记录
    const reconnectCount = this.getReconnectCount()
    console.log(`🔄 重连次数(5分钟内): ${reconnectCount}`)

    // getMsgList 耗时
    if (this.marks.getMsgList.size > 0) {
      console.group('📋 getMsgList')
      for (const [id, text] of this.marks.getMsgList) {
        console.log(text)
      }
      console.groupEnd()
    }

    // addDB 耗时
    if (this.marks.addDB.size > 0) {
      console.group('💾 addDB')
      for (const [id, text] of this.marks.addDB) {
        console.log(text)
      }
      console.groupEnd()
    }

    // sendLog 信息
    if (this.marks.sendLog.size > 0) {
      console.group('📨 sendLog')
      for (const [customMsgId, log] of this.marks.sendLog) {
        const sent = log.sended ? '√' : 'X'
        const recieved = log.recieved ? '√' : 'X'
        const Rsent = (log.status & STATUS.RENDER_SUCCESS) ? '√' : 'X'
        const Rfailed = (log.status & STATUS.RENDER_FAILED) ? '√' : 'X'
        const failNames = Object.keys(log.fnMsgSendFail).join('-') || 'none'

        console.log(`${customMsgId}: ${log.MsgId || '-'} | sent${sent} | recieved${recieved} | Rsent${Rsent} | Rfailed${Rfailed} | mount:${log.mounted} | references:${failNames}`)
      }
      console.groupEnd()
    }

    console.groupEnd()
  }
  summary(values) {
    // 先别处理
  }
}

const getSystemInfo = () => {
  try {
    const os = require('os')
    const cpus = os.cpus()

    return {
      cpu: cpus.length > 0 ? `${cpus[0].model} (${cpus.length}核)` : '未知',
      disk: getDiskType()
    }
  } catch (e) {
    return { cpu: '获取失败', disk: '获取失败' }
  }
}

// 缓存硬盘类型，避免重复查询
let _diskTypeCache = null

const getDiskType = () => {
  if (_diskTypeCache !== null) return _diskTypeCache

  try {
    const { execSync } = require('child_process')
    const platform = process.platform

    if (platform === 'win32') {
      // Windows: 使用 PowerShell 获取磁盘类型
      const result = execSync('powershell "Get-PhysicalDisk | Select-Object MediaType | ConvertTo-Json"', { encoding: 'utf8' })
      const disks = JSON.parse(result)
      const types = Array.isArray(disks) ? disks.map(d => d.MediaType) : [disks.MediaType]
      _diskTypeCache = types.includes('SSD') ? 'SSD' : (types.includes('HDD') ? 'HDD' : types.join(','))
    } else if (platform === 'darwin') {
      // macOS
      const result = execSync('system_profiler SPStorageDataType | grep "Medium Type"', { encoding: 'utf8' })
      _diskTypeCache = result.includes('SSD') ? 'SSD' : 'HDD'
    } else {
      _diskTypeCache = '未知'
    }
    return _diskTypeCache
  } catch (e) {
    return '获取失败'
  }
}

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

const getMemoryInfo = () => {
  try {
    const os = require('os')
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const usagePercent = ((usedMem / totalMem) * 100).toFixed(1)

    return `已用 ${formatBytes(usedMem)} / 总共 ${formatBytes(totalMem)} (${usagePercent}%)`
  } catch (e) {
    return '获取失败'
  }
}

const getAppMemoryInfo = () => {
  try {
    const mem = process.memoryUsage()
    return {
      rss: formatBytes(mem.rss),           // 进程占用的总物理内存
      heapTotal: formatBytes(mem.heapTotal), // V8 堆总内存
      heapUsed: formatBytes(mem.heapUsed),   // V8 堆已用内存
      external: formatBytes(mem.external)    // C++ 对象内存
    }
  } catch (e) {
    return null
  }
}

const getVersion = () => {
  try {
    const pkg = require('../../package.json')
    return pkg.version || '未知'
  } catch (e) {
    return '获取失败'
  }
}



export default new Benchmark();
