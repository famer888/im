// NativeImage 唯一对外入口（design.md §0、§2、§3）
//
// 本期外部使用：
//   import NativeImage, { Avatar } from '@/components/NativeImage'
//   import { STATE, EVENT, ERROR_CODE, SCOPE_KIND } from '@/components/NativeImage'
//
// 预留：Picture / Poster / MediaCaption（design.md §3.3 / §3.4，[预留]）以及
//       MsgPropertyPersist / patchMsgNativeImage（§12.3 / §13）保留为同目录下的
//       伪代码文件，但**本期不通过 index.js 暴露、也不被任何生产路径引用**——
//       接 Picture/Poster/MediaCaption 时再在此文件按需 re-export，落库**仅写**
//       新字段 msg.nativeImage，不与旧 msg.local* 字段双写（§12.7 / §13.10）。
//
// 禁止直接 import 'src/components/NativeImage/core/*' 或 '.../node/*'（§12.2）。

import NativeImage from './NativeImage.vue';
import Avatar from './Avatar.vue';

import {
    STATE,
    EVENT,
    ERROR_CODE,
    SCOPE_KIND,
    SLOT_KIND,
    MACHINE,
} from './core/constants';

export { Avatar };
export { STATE, EVENT, ERROR_CODE, SCOPE_KIND, SLOT_KIND, MACHINE };
export default NativeImage;
