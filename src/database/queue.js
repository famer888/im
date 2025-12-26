import Dexie from "dexie";
import { Cache } from "@/cache";
import DbBase, { afterfix} from "./index";
import { Massass } from "./logger";
import benchmark from "@/debuggers/benchmark";
// 这是一个DB操作队列，如你所见，dbBase extends Queue
// 我需要你实现的是：所有dbBase的方法被调用时候，都会插入到队列中，然后按顺序执行
// 即：db.getMsgList并不会立即执行，而是等待队列完成
// 你只需要实现这个队列，暂时不要去改动index.js中的代码
// 不要删除注释

export default class Queue extends DbBase {
  tasks = [];
  requestCreateCollections = new Map();
  running = false;
  taskId = 0;

  constructor(userId) {
    super(userId);
  }

  getMsgList(...args) {
    // Massass.log('getMsgList', args);
    return this._enqueue('getMsgList', super.getMsgList.bind(this), args, false);
  }

  addDB(...args) {
    const [tableName] = args;
    if (!this.db || !this.db[tableName]) {
      return this.requestForDBUpdate(...args);
    }
    return this._enqueue('addDB', super.addDB.bind(this), args, false);
  }

  updateMsgProperty(...args) {
    return this._enqueue('updateMsgProperty', super.updateMsgProperty.bind(this), args, false);
  }
  requestForDBUpdate(tableName, data, type) {
    const result = Array.isArray(data) ? data : [data];
    if (!this.requestCreateCollections.has(tableName)) {
      this.requestCreateCollections.set(tableName, { messages: [...result], type });
    } else {
      const existing = this.requestCreateCollections.get(tableName);
      this.requestCreateCollections.set(tableName, {
        messages: [...existing.messages, ...result],
        type: type || existing.type
      });
    }
    // 如你所见，我把队列中的需要更新indexDb version的操作都统一到了requestCreateCollections
    // drain执行时，执行完一个task, 如果下一个task的priority不为true，那么需要清空执行requestCreateCollections中的数据
    this.drain();
  }

  _enqueue(name, fn, args, priority) {
    const id = `${name}-${++this.taskId}`;
    const enqueueTime = Date.now();
    // Massass.log(`当前堆积的数量: ${this.tasks.length}`);
    return new Promise((resolve, reject) => {
      const task = { id, enqueueTime, fn, args, resolve, reject, priority };
      if (priority) {
        this.tasks.unshift(task);
      } else {
        this.tasks.push(task);
      }
      this.drain();
    });
  }

  async drainRequestCreateCollections() {
    if (this.requestCreateCollections.size === 0) return;

    const startTime = Date.now();

    // 快照当前需要处理的数据，防止处理过程中被修改
    const entries = [...this.requestCreateCollections.entries()];

    // 1. 更新 localStorageName，添加新表
    for (const [tableName] of entries) {
      if (!this.localStorageName[tableName]) {
        this.localStorageName[tableName] = this.tableString;
      }
    }

    // 2. 关闭数据库，升级版本，重新打开
    await this.createCollections();

    // Massass.log(`drainRequestCreateCollections: 数据库升级成功, version=${this.version}, tables=${entries.length}`);

    // 3. 批量插入数据到各个表
    for (const [tableName, { messages, type }] of entries) {
      // 检查是否在处理过程中有新数据加入
      const currentData = this.requestCreateCollections.get(tableName);

      if (!currentData) {
        // 已被删除，跳过
        continue;
      }

      const processedCount = messages.length;
      const currentCount = currentData.messages.length;

      try {
        // 格式化数据并插入
        const addData = this.setDataList(messages, type, tableName);
        if (addData.length > 0) {
          await this.db[tableName].bulkPut(addData);
          // Massass.log(`drainRequestCreateCollections: ${tableName} 插入 ${addData.length} 条数据`);
        }
      } catch (err) {
        // Massass.log(`drainRequestCreateCollections: ${tableName} 插入失败`, err);
      }

      // 处理在 drain 过程中新加入的数据
      if (currentCount > processedCount) {
        const remainingMessages = currentData.messages.slice(processedCount);
        this.requestCreateCollections.set(tableName, {
          messages: remainingMessages,
          type: currentData.type
        });
      } else {
        this.requestCreateCollections.delete(tableName);
      }
    }

    // Massass.log(`drainRequestCreateCollections: 总耗时 ${Date.now() - startTime}ms`);
  }

  // 关闭数据库、创建/升级表结构、打开数据库
  async createCollections() {
    const tables = this.localStorageName;

    // 获取并更新版本号
    this.version = (await this.getVersion()) || 1;
    if (this.version % 10 === 0) {
      this.version += 1;
    }
    await Cache(`${this.userId}storageVersion`, this.version + 1);

    // 关闭现有数据库连接
    if (this.db) {
      this.db.close();
    }

    // 创建新的数据库实例并配置表结构
    this.db = new Dexie(this.userId + afterfix);
    this.db.version(this.version).stores(tables);

    try {
      await this.db.open();
      // 持久化 localStorageName
      await Cache(`${this.userId}localStorageName`, tables);
    } catch (err) {
      // Massass.log(`createCollections: 数据库打开失败`, err);
      // 版本错误时重试
      if (err.name === 'VersionError' && err.message.includes('is less than the existing version')) {
        const match = err.message.match(/is less than the existing version \((\d+)\)/);
        if (match) {
          let existingVersion = parseInt(match[1]);
          if (existingVersion % 10 === 0) {
            existingVersion = Math.floor(existingVersion / 10);
          }
          await Cache(`${this.userId}storageVersion`, existingVersion + 1);
          // 递归重试
          return this.createCollections();
        }
      }
      throw err;
    }
  }
  // 这个函数是关键，它需要执行队列中的所有任务
  // 并发量1，等待上一个任务完成才执行下一个
  // 每消费一个任务，删除队列中的该任务，并执行下一个
  // 如你所见，我把队列中的需要更新indexDb version的操作都统一到了requestCreateCollections
  // drain执行时，执行完一个task, 如果下一个task的priority不为true，那么需要清空执行requestCreateCollections中的数据，直到requestCreateCollections为空
  async drain() {
    if (this.running) return;
    this.running = true;

    while (this.tasks.length > 0 || this.requestCreateCollections.size > 0) {
      // 如果 tasks 为空但 requestCreateCollections 有数据，先处理它
      if (this.tasks.length === 0) {
        await this.drainRequestCreateCollections();
        continue;
      }

      const task = this.tasks.shift();
      const startTime = Date.now(); // 在任务开始执行时记录时间
      const waitTime = startTime - task.enqueueTime; // 等待时间
      try {
        const result = await task.fn(...task.args);
        task.resolve(result);
      } catch (err) {
        task.reject(err);
      }
      const execTime = Date.now() - startTime; // 纯执行时间
      const logText = `${task.id}: 执行${execTime}ms, 等待${waitTime}ms, 总耗时${Date.now() - task.enqueueTime}ms`;
      // Massass.log(logText);

      // benchmark: 记录 getMsgList 和 addDB 耗时
      if (task.id.startsWith('getMsgList')) {
        benchmark.recordGetMsgList(task.id, logText);
      } else if (task.id.startsWith('addDB')) {
        benchmark.recordAddDB(task.id, logText);
      }

      // 检查下一个 task 的 priority，如果不为 true，则清空执行 requestCreateCollections
      const nextTask = this.tasks[0];
      if (!nextTask || nextTask.priority !== true) {
        await this.drainRequestCreateCollections();
      }
    }

    this.running = false;
  }
}
