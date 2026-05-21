// NativeImage 全局常量
// 与 design.md §7（状态机）、§5.4（headerCheck）、§4（协议）一一对应
// 任何新增状态/事件/错误码必须先改 design.md，再改这里。

/** 10 个状态，与 design.md §7.1 一一对应；终态锁定，不允许 plugin 扩展。 */
export const STATE = Object.freeze({
    IDLE:           'idle',
    RESOLVING:      'resolving',
    DOWNLOADING:    'downloading',
    VERIFYING:      'verifying',
    DECRYPTING:     'decrypting',
    COMMITTING:     'committing',
    READY:          'ready',
    EXPIRED:        'expired',
    DOWNLOAD_ERROR: 'downloadError',
    DECRYPT_ERROR:  'decryptError',
});

export const TERMINAL_STATES = Object.freeze([
    STATE.READY,
    STATE.EXPIRED,
    STATE.DOWNLOAD_ERROR,
    STATE.DECRYPT_ERROR,
]);

export const ERROR_TERMINAL_STATES = Object.freeze([
    STATE.EXPIRED,
    STATE.DOWNLOAD_ERROR,
    STATE.DECRYPT_ERROR,
]);

export const MID_STATES = Object.freeze([
    STATE.RESOLVING,
    STATE.DOWNLOADING,
    STATE.VERIFYING,
    STATE.DECRYPTING,
    STATE.COMMITTING,
]);

export const isTerminal = (s) => TERMINAL_STATES.includes(s);
export const isErrorTerminal = (s) => ERROR_TERMINAL_STATES.includes(s);
export const isMid = (s) => MID_STATES.includes(s);

/** 13 个核心事件，与 design.md §7.2 一一对应；plugin 可加新事件但禁止覆盖语义。 */
export const EVENT = Object.freeze({
    MOUNT:         'MOUNT',
    UNSUBSCRIBE:   'UNSUBSCRIBE',
    START_FETCH:   'START_FETCH',
    HTTP_4XX:      'HTTP_4XX',
    HTTP_FAIL:     'HTTP_FAIL',
    START_VERIFY:  'START_VERIFY',
    VERIFY_FAIL:   'VERIFY_FAIL',
    START_DECRYPT: 'START_DECRYPT',
    DECRYPT_FAIL:  'DECRYPT_FAIL',
    START_COMMIT:  'START_COMMIT',
    COMMITTED:     'COMMITTED',
    CANCEL:        'CANCEL',
    INVALIDATE:    'INVALIDATE',
});

/** 错误码分类（与 design.md §5.4 headerCheck + §5.2 downloader 一致）。 */
export const ERROR_CODE = Object.freeze({
    TOO_SMALL:         'tooSmall',
    SUSPICIOUS_SIZE:   'suspiciousSize',
    NOT_BLOCK_ALIGNED: 'notBlockAligned',
    PLAIN_TEXT:        'plainText',

    HTTP_404:          'HTTP_404',
    HTTP_410:          'HTTP_410',
    HTTP_403:          'HTTP_403',
    HTTP_4XX_OTHER:    'HTTP_4XX_OTHER',
    NETWORK:           'NETWORK',
    TIMEOUT:           'TIMEOUT',
    ABORT:             'ABORT',

    WORKER_FAILED:     'workerFailed',
    WRITE_FAILED:      'writeFailed',
    RENAME_FAILED:     'renameFailed',
});

/** HTTP 状态码归类。 */
export const classifyHttpStatus = (status) => {
    if (status === 404) return ERROR_CODE.HTTP_404;
    if (status === 410) return ERROR_CODE.HTTP_410;
    if (status === 403) return ERROR_CODE.HTTP_403;
    if (status >= 400 && status < 500) return ERROR_CODE.HTTP_4XX_OTHER;
    return null;
};

/** DB schema 版本（design.md §13.2）。 */
export const SCHEMA_VERSION = 1;

/** 自定义协议名（design.md §4）。 */
export const PROTOCOL = 'native-image';

/** scope.kind 枚举：派生组件命名空间，taskRegistry 用作隔离 key 前缀。 */
export const SCOPE_KIND = Object.freeze({
    AVATAR:  'avatar',
    PICTURE: 'picture',
    POSTER:  'poster',
});

/** SlotState.kind 枚举（design.md §13.2）。 */
export const SLOT_KIND = Object.freeze({
    IMAGE: 'image',
    VIDEO: 'video',
});

/** Machine 类型枚举（design.md §13.2）。 */
export const MACHINE = Object.freeze({
    IMAGE:  'image',
    POSTER: 'poster',
    VIDEO:  'video',
});
