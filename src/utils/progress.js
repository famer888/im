import { ipcRenderer } from "@/platform";
import eventBase from "@/event/base";

class ProgressManager {
  // key: taskId, value: { percent, loading, taskId, type: upload | download }
  map = new Map();
  // key: taskId, value: Set<callback>
  subscribers = new Map();
  install() {
    ipcRenderer.on("downloadProgress", this.update);
    eventBase.fnCommunicationMonitoring("upload-progress", ["upload-progress"], (data) => this.update(null, data));
  }
  uninstall() {
    ipcRenderer.removeListener("downloadProgress", this.update);
    eventBase.fnCommunicationMonitoring("upload-progress", null);
  }
  init(message) {
    const { chatType, MsgID, customMsgId } = message;
    // MsgID 和 customMsgId 都没有则不初始化
    if (!MsgID && !customMsgId) {
      return null;
    }
    const old = this.getTask(message);
    if (old) {
      return old;
    }
    const taskId = `${chatType}-${MsgID || customMsgId}`;
    const type = MsgID ? 'download' : 'upload';
    const newTask = { percent: 0, loading: true, taskId, type };
    this.map.set(taskId, newTask);
    return newTask;
  }
  update = (event, data) => {
    const { taskId, percent } = data;
    if (!taskId) return;
    const task = this.map.get(taskId);
    if (task) {
      task.percent = percent;
    } else {
      this.map.set(taskId, { percent, loading: true, taskId });
    }
    // 通知订阅者
    this.notify(taskId, percent);
  };
  subscribe(taskId, callback) {
    if (!taskId) return;
    if (!this.subscribers.has(taskId)) {
      this.subscribers.set(taskId, new Set());
    }
    this.subscribers.get(taskId).add(callback);
  }
  unsubscribe(taskId, callback) {
    const subs = this.subscribers.get(taskId);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(taskId);
      }
    }
  }
  notify(taskId, percent) {
    const subs = this.subscribers.get(taskId);
    if (subs) {
      subs.forEach(cb => cb(percent));
    }
  }
  complete(message) {
    // 如果一个task已经完成，那么已写入库，那么这个task已经可以删除了
    const task = this.getTask(message);
    if (task) {
      this.map.delete(task.taskId);
      this.subscribers.delete(task.taskId);
    }
  }
  destroy(message) {
    const taskId = this.getTask(message)?.taskId;
    taskId && this.map.delete(taskId);
  }
  getTask(message) {
    const { customMsgId, chatType, MsgID } = message;
    if (this.map.has(`${chatType}-${MsgID}`)) {
      return this.map.get(`${chatType}-${MsgID}`);
    } else if (this.map.has(`${chatType}-${customMsgId}`)) {
      return this.map.get(`${chatType}-${customMsgId}`);
    }
  }
  getProgress(message) {
    const task = this.getTask(message);
    return task?.percent || {};
  }
  pause() {
    // 给不知道需不需要做的暂停上传下载预留

  }
}

export default new ProgressManager();
