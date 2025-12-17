export default class Logger {
  prefix = '';
  constructor(prefix) {
    this.prefix = prefix;
  }
  log(message) {
    console.log(`[${this.prefix}]: ${message}`);
  }
  time(message) {
    console.time(`[${this.prefix}]: ${message}`);
  }
  timeEnd(message) {
    console.timeEnd(`[${this.prefix}]: ${message}`);
  }
  error(message) {
    console.error(`[${this.prefix}]: ${message}`);
  }
  warn(message) {
    console.warn(`[${this.prefix}]: ${message}`);
  }
  info(message) {
    console.info(`[${this.prefix}]: ${message}`);
  }
}


export const Massass = new Logger('Message List');
