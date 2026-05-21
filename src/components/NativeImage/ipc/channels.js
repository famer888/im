// NativeImage IPC channel 名（design.md §9）
// renderer 与 main 共用此文件，避免字符串散落。

export const Channels = Object.freeze({
    /** renderer → main：手动获取 taskId / 状态 snapshot。可选；主路径走 native-image:// 协议。 */
    resolve:    'nativeImage:resolve',

    /** main → renderer：状态变更广播 (broadcast)。payload = StateMachine.snapshot()。 */
    status:     'nativeImage:status',

    /** renderer → main：unsubscribe；最后一个 subscriber 离开自动 CANCEL。 */
    cancel:     'nativeImage:cancel',

    /** renderer → main：强制终态 → resolving，重跑下载链路。 */
    invalidate: 'nativeImage:invalidate',
});

export default Channels;
