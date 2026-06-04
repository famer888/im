import { Cache } from "@/cache";
import { enumMsgType } from "@/utils/base";
import i18n from "@/assets/lang/i18n";
import md5 from "js-md5";

// 事件
import eventCommon from "@/event/common";
import benchmark from "@/debuggers/benchmark";

// api
import { GetKeyPair, UpdateKeyPair } from "@/api/imBase";
import {
    secret,
    _encrypt,
    _decrypt,
    _encrypt2,
    _decrypt2,
    setGenerateKeyPair,
} from "@/api/base/index";
import { ConcatInt8 } from "@/socket/api/request";
import { ReceiveKeyPairMessage } from "@/socket/api/message";
import { setUpdateKeyPairSource, consumeUpdateKeyPairDesc } from "@/utils/e2ee/keypairTracer";
import oneToOneSendDiag from "@/debuggers/oneToOneSendDiag";

import {
    SystemObj,
    LocationObj,
    SetImageObj,
    AnimatedGameObj,
    TextObj,
    ImageObj,
    VideoObj,
    AudioObj,
    DynamicImageObj,
    FileObj,
    NameCardObj,
    GroupNoticeObj,
    HtmlObj,
    MediaTextListObj,
    CaptionMediaType,
} from "@/api/base/imweb-web";

// 好友 密钥对象集
let friendKeyObjs = {};

// 群 密钥对象集
let groupKeyObjs = {};

// 频道 密钥对象集
let channelKeyObjs = {};

// 好友密钥已通过API补全检查的记录（会话级别，避免重复请求）
let friendKeyApiSupplemented = new Set();

/**
 * 全部密钥的对象初始化
 */
export const fnKeyObjsInit = () => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 初始化群的 密钥对象集
    Cache(`${loginId}-group-key-objs`).then((res) => {
        if (res) {
            groupKeyObjs = res;
        }
    });

    // 初始化频道的 密钥对象集
    Cache(`${loginId}-channel-key-objs`).then((res) => {
        if (res) {
            channelKeyObjs = res;
        }
    });

    // 初始化好友的 密钥对象集
    Cache(`${loginId}-friend-key-objs`).then((res) => {
        if (res) {
            try {
                Object.keys(res).forEach((uid) => {
                    const keyInfos = res[uid];
                    if (keyInfos && typeof keyInfos === 'object') {
                        Object.keys(keyInfos).forEach((key) => {
                            const publicKey = keyInfos[key];
                            const version = Number(key.replace("app-", "").replace("pc-", ""));
                            if (!version || !publicKey) {
                                console.$collectE2ee('初始化位置存有错误值', { uid, version, publicKey: publicKey || '', key });
                            }
                        });
                    }
                });
            } catch (e) {}
            friendKeyObjs = res;
        }
    });
};

// 登录成功初始化所有群的key为空，获取接口新key存储进去
export const fnInitAllGroupKey = (loginId) => {
    groupKeyObjs = {};
    Cache(`${loginId}-group-key-objs`, null);
};

export const fnInitAllChannelKey = (loginId) => {
    channelKeyObjs = {};
    Cache(`${loginId}-channel-key-objs`, null);
};

export const fnInitAllFriendKey = (loginId) => {
    friendKeyObjs = {};
    friendKeyApiSupplemented = new Set();
    Cache(`${loginId}-friend-key-objs`, null);
};

/**
 * 尝试修复自身密钥（限制10分钟内只触发1次）
 */
const fnTryRepairOwnKey = () => {
    const beforeTime = window.beforeUploadOwnKeyTime || 0;
    const currentTime = new Date().getTime();
    if (currentTime > beforeTime + 1000 * 60 * 10) {
        window.beforeUploadOwnKeyTime = currentTime;
        setUpdateKeyPairSource('fnTryRepairOwnKey', '自身私钥缺失触发密钥自动修复');
        fnUpdateOwnKey().catch(err => {
            console.error('密钥自动修复失败-', err);
        });
    }
};

/**
 * 获取频道真实的密钥
 */
export const fnChannelRelKeyGet = async (id) => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 密钥信息
    let keyInfos = channelKeyObjs[id];

    // 密钥不存在，则需要api获取
    if (!keyInfos) {
        //      console.log('GetKeyPair-1-', {
        //     targetId: id,
        //     flag: 3,
        //     channelKeyVersion: 1,
        // })
        const keyPair = await GetKeyPair({
            targetId: id,
            flag: 3,
            channelKeyVersion: 1,
        });
        // console.log('GetKeyPair-2-', keyPair)

        if (keyPair && !_.isEmpty(keyPair.channelKeyPair)) {
            keyInfos = keyPair.channelKeyPair;

            // 记录
            channelKeyObjs[id] = keyInfos;

            // 保存到本地
            Cache(`${loginId}-channel-key-objs`, channelKeyObjs);
        } else {
            // 解密错误
            console.error("频道解密-获取密钥失败-3-", keyInfos);
            return null;
        }
    }

    // 账户配置信息
    const { accountConfig } = eventCommon.fnConfigRU();

    // 自己的私key，同账户app的公key
    const { privateKey } = accountConfig;

    if (!privateKey) {
        console.error('频道解密-自身私钥缺失');
        fnTryRepairOwnKey();
        return null;
    }

    if (!keyInfos.publicKey || !keyInfos.msgKey) {
        console.error('频道解密-频道密钥数据不完整-', 'publicKey:', !!keyInfos.publicKey, 'msgKey:', !!keyInfos.msgKey);
        delete channelKeyObjs[id];
        Cache(`${loginId}-channel-key-objs`, channelKeyObjs);
        return null;
    }

    // 解密出真实的密钥
    let key = null;
    try {
         key = secret(privateKey, keyInfos.publicKey).toUpperCase();
    } catch (error) {
        console.error('频道解密-生成秘钥异常-2-', 'publicKey:', !!keyInfos.publicKey, error.message)
        delete channelKeyObjs[id];
        Cache(`${loginId}-channel-key-objs`, channelKeyObjs);
        return null;
    }

    const msgKeyBuffer = Uint8Array.from(Buffer.from(keyInfos.msgKey, "hex"));
    let msgkey = null;
    try {
      msgkey = _decrypt(msgKeyBuffer, key);
    } catch (error) {
        console.error('频道解密异常-msgkey-', !!keyInfos.msgKey, error.message)
        delete channelKeyObjs[id];
        Cache(`${loginId}-channel-key-objs`, channelKeyObjs);
        return null;
    }
    const buffer = ConcatInt8([
        Uint8Array.from([10]),
        Uint8Array.from([msgkey.byteLength]),
        msgkey,
    ]);

    // 返回真实的频道密钥
    return fnUtf8ArrayToStr(buffer).trim();
};

/**
 * 获取群真实的密钥
 */
export const fnGroupRelKeyGet = async (id) => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 密钥信息
    let keyInfos = groupKeyObjs[id];

    // 密钥不存在，则需要api获取
    if (!keyInfos) {
        const keyPair = await GetKeyPair({
            targetId: id,
            flag: 1,
            groupKeyVersion: 1,
        });

        if (keyPair && !_.isEmpty(keyPair.groupKeyPair)) {
            keyInfos = keyPair.groupKeyPair;

            // 记录
            groupKeyObjs[id] = keyInfos;

            // 保存到本地
            Cache(`${loginId}-group-key-objs`, groupKeyObjs);
        } else {
            // 解密错误
            console.error("解密-获取密钥失败-3-", keyInfos);
            return null;
        }
    }

    // 账户配置信息
    const { accountConfig } = eventCommon.fnConfigRU();

    // 自己的私key，同账户app的公key
    const { privateKey } = accountConfig;

    if (!privateKey) {
        console.error('群解密-自身私钥缺失');
        fnTryRepairOwnKey();
        return null;
    }

    if (!keyInfos.publicKey || !keyInfos.msgKey) {
        console.error('群解密-群密钥数据不完整-', 'publicKey:', !!keyInfos.publicKey, 'msgKey:', !!keyInfos.msgKey);
        delete groupKeyObjs[id];
        Cache(`${loginId}-group-key-objs`, groupKeyObjs);
        return null;
    }

    // 解密出真实的密钥
    let key = null;
    try {
         key = secret(privateKey, keyInfos.publicKey).toUpperCase();
    } catch (error) {
        console.error('群解密-生成秘钥异常-2-', 'publicKey:', !!keyInfos.publicKey, error.message)
        delete groupKeyObjs[id];
        Cache(`${loginId}-group-key-objs`, groupKeyObjs);
        return null;
    }

    const msgKeyBuffer = Uint8Array.from(Buffer.from(keyInfos.msgKey, "hex"));
    let msgkey = null;
    try {
      msgkey = _decrypt(msgKeyBuffer, key);
    } catch (error) {
        console.error('群解密异常-msgkey-', 'msgKey:', !!keyInfos.msgKey, error.message)
        delete groupKeyObjs[id];
        Cache(`${loginId}-group-key-objs`, groupKeyObjs);
        return null;
    }
    const buffer = ConcatInt8([
        Uint8Array.from([10]),
        Uint8Array.from([msgkey.byteLength]),
        msgkey,
    ]);

    // 返回真实的群密钥
    return fnUtf8ArrayToStr(buffer).trim();
};

/**
 * 密钥信息获取
 */
export const fnFriendRelKeyGet = async ({
    id,
    msgEncryptionVersion,
    source,
    isSelf,
    senderKeyVersion,
    _diagTaskId,
}) => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
    const optsStr = JSON.stringify({
        id,
        msgEncryptionVersion,
        source,
        isSelf,
        loginId,
   })

    // 账户配置信息
    const { accountConfig } = eventCommon.fnConfigRU();

    // 自己的私key，同账户app的公key
    const { privateKey, appKeyPair: appKeyPairOwn } = accountConfig;

    const _keyState = (extra) => ({
        hasPrivateKey: !!privateKey,
        ownWebKeyVersion: accountConfig.keyVersion,
        ownAppKeyVersion: appKeyPairOwn?.keyVersion,
        hasOwnAppPublicKey: !!appKeyPairOwn?.publicKey,
        msgEncryptionVersion,
        source,
        isSelf,
        senderKeyVersion,
        ...extra,
    });

    // 如果是助手
    if (msgEncryptionVersion === -1 && id === 10008) {
        // 同账户的 app 密钥
        try {
            return {
                appOwn: {
                    relKey: secret(
                        privateKey,
                        appKeyPairOwn.publicKey
                    ).toUpperCase(),
                    keyVersion: appKeyPairOwn.keyVersion,
                },
            };
        } catch (error) {
            console.$collectE2ee('解密-生成秘钥异常-1-助手', _keyState({ error: error.message }));
            console.error("解密-生成秘钥异常-1-", optsStr,
                'privateKey:', !!privateKey,
                'appKeyPairOwn.publicKey:', !!appKeyPairOwn?.publicKey,
                error.message)
            return null;
        }
    }

    // 旧的密钥信息
    const keyInfos = friendKeyObjs[id] || {};

    // [诊断] 入口快照（仅发送路径）
    if (_diagTaskId && msgEncryptionVersion === -1) {
        try {
            oneToOneSendDiag.markEntry(_diagTaskId, {
                privateKey,
                ownKeyVersion: accountConfig.keyVersion,
                cacheKeys: Object.keys(keyInfos),
                apiSupplementFlagSet: friendKeyApiSupplemented.has(id),
            });
        } catch (e) {}
    }

    // 使用的密钥信息
    let keyInfosActive = null;

    if (msgEncryptionVersion === -1) {
        // 获取最新
        for (const key of Object.keys(keyInfos)) {
            const publicKey = keyInfos[key];
            if (!publicKey) continue;

            if (!keyInfosActive) {
                keyInfosActive = {};
            }

            const keyVersion = Number(
                key.replace("app-", "").replace("pc-", "")
            );

            if (key.includes("app")) {
                if (
                    !keyInfosActive.appKeyPair ||
                    keyInfosActive.appKeyPair.keyVersion < keyVersion
                ) {
                    keyInfosActive.appKeyPair = {
                        publicKey,
                        keyVersion,
                    };
                }
            } else {
                if (
                    !keyInfosActive.webKeyPair ||
                    keyInfosActive.webKeyPair.keyVersion < keyVersion
                ) {
                    keyInfosActive.webKeyPair = {
                        publicKey,
                        keyVersion,
                    };
                }
            }
        }
    } else if (!isSelf && keyInfos) {
        // 指定版本，肯定是收到消息，如果是同账户发的信息，不需要去获取
        const publicKey =
            keyInfos[(source === 1 ? "pc-" : "app-") + msgEncryptionVersion];

        if (publicKey) {
            if (source === 1) {
                keyInfosActive = {
                    webKeyPair: {
                        publicKey,
                    },
                };
            } else {
                keyInfosActive = {
                    appKeyPair: {
                        publicKey,
                    },
                };
            }
        }
    }

    // 发送时缓存不完整（缺少 app 或 web 密钥），需要从API补全（每个好友每会话仅补全一次）
    const needsApiSupplement = msgEncryptionVersion === -1 && keyInfosActive
        && (!keyInfosActive.appKeyPair || !keyInfosActive.webKeyPair)
        && !friendKeyApiSupplemented.has(id);

    // [诊断] needsApiSupplement 决策（无论是否真的调 API 都记一次）
    const _diagWillCallApi = (!keyInfosActive || needsApiSupplement) && (!isSelf || msgEncryptionVersion === -1);
    if (_diagTaskId && msgEncryptionVersion === -1) {
        try {
            oneToOneSendDiag.markDecision(_diagTaskId, {
                needsApiSupplement: !!needsApiSupplement,
                apiCalled: !!_diagWillCallApi,
            });
        } catch (e) {}
    }

    // 如果指定版本的密钥不存在，或发送时缓存不完整，则需要api获取
    if ((!keyInfosActive || needsApiSupplement) && (!isSelf || msgEncryptionVersion === -1)) {
        if (needsApiSupplement) {
            friendKeyApiSupplemented.add(id);
        }

        const params = {
            targetId: id,
        };

        if (source === 1) {
            // pc
            params.webKeyVersion = msgEncryptionVersion;
        } else {
            // 手机
            params.appKeyVersion = msgEncryptionVersion;
        }

        // api获取密钥
        const keyPair = await GetKeyPair(params);

        if (keyPair) {
            const { appKeyPair, webKeyPair } = keyPair;

            const appKeyVersion = _.get(appKeyPair, "keyVersion");
            const pcKeyVersion = _.get(webKeyPair, "keyVersion");

            // [诊断] API 返回结果
            if (_diagTaskId && msgEncryptionVersion === -1) {
                try {
                    oneToOneSendDiag.markDecision(_diagTaskId, {
                        apiAppKeyVersion: appKeyVersion,
                        apiPcKeyVersion: pcKeyVersion,
                    });
                } catch (e) {}
            }

            // 如果
            if (appKeyVersion || pcKeyVersion) {
                let hasValidKey = false;

                if (appKeyVersion && appKeyPair.publicKey) {
                    keyInfos["app-" + appKeyVersion] = appKeyPair.publicKey;

                    if (source === 0 || msgEncryptionVersion === -1) {
                        keyInfosActive = {
                            ...keyInfosActive,
                            appKeyPair,
                        };
                    }
                    hasValidKey = true;
                }

                if (pcKeyVersion && webKeyPair.publicKey) {
                    keyInfos["pc-" + pcKeyVersion] = webKeyPair.publicKey;

                    if (source === 1 || msgEncryptionVersion === -1) {
                        keyInfosActive = {
                            ...keyInfosActive,
                            webKeyPair,
                        };
                    }
                    hasValidKey = true;
                }

                if (hasValidKey) {
                    // 记录
                    friendKeyObjs[id] = keyInfos;

                    // 保存到本地
                    Cache(`${loginId}-friend-key-objs`, friendKeyObjs);
                } else if (!keyInfosActive) {
                    console.$collectE2ee('解密-获取密钥失败-1a', _keyState());
                    console.error("解密-获取密钥失败-1-",optsStr, keyPair, params);
                    return null;
                }
            } else {
                if (!keyInfosActive) {
                    console.$collectE2ee('解密-获取密钥失败-1b', _keyState());
                    console.error("解密-获取密钥失败-1-",optsStr, keyPair, params);
                    return null;
                }
            }
        } else {
            if (!keyInfosActive) {
                console.$collectE2ee('解密-获取密钥失败-2', _keyState());
                console.error("解密-获取密钥失败-2-",optsStr, keyPair, params );
                return null;
            }
        }
    }

    const { appKeyPair, webKeyPair } = keyInfosActive || {};

    if (msgEncryptionVersion === -1) {
        try {
             // 发送消息加密用
            const data = {
                appOwn: {
                    relKey: secret(
                        privateKey,
                        appKeyPairOwn.publicKey
                    ).toUpperCase(),
                    keyVersion: appKeyPairOwn.keyVersion,
                },
            };

            if (webKeyPair && webKeyPair.publicKey) {
                data.pc = {
                    relKey: secret(privateKey, webKeyPair.publicKey).toUpperCase(),
                    keyVersion: webKeyPair.keyVersion,
                };
            }

            if (appKeyPair && appKeyPair.publicKey) {
                data.app = {
                    relKey: secret(privateKey, appKeyPair.publicKey).toUpperCase(),
                    keyVersion: appKeyPair.keyVersion,
                };
            }

            // [诊断] relKey 生成完毕，记录所有密钥对与 relKey 摘要
            if (_diagTaskId) {
                try {
                    oneToOneSendDiag.markKey(_diagTaskId, {
                        privateKey,
                        ownKeyVersion: accountConfig.keyVersion,
                        appKeyPair: (appKeyPair && appKeyPair.publicKey)
                            ? { publicKey: appKeyPair.publicKey, keyVersion: appKeyPair.keyVersion }
                            : null,
                        webKeyPair: (webKeyPair && webKeyPair.publicKey)
                            ? { publicKey: webKeyPair.publicKey, keyVersion: webKeyPair.keyVersion }
                            : null,
                        appKeyPairOwn: (appKeyPairOwn && appKeyPairOwn.publicKey)
                            ? { publicKey: appKeyPairOwn.publicKey, keyVersion: appKeyPairOwn.keyVersion }
                            : null,
                        relKeyApp: data.app ? data.app.relKey : null,
                        relKeyPc: data.pc ? data.pc.relKey : null,
                        relKeyAppOwn: data.appOwn ? data.appOwn.relKey : null,
                    });
                } catch (e) {}
            }

            return data;
        } catch (error) {
            console.$collectE2ee('解密-生成秘钥异常-3-shareKey', _keyState({
                hasWebPublicKey: !!webKeyPair?.publicKey,
                webKeyVersion: webKeyPair?.keyVersion,
                hasAppPublicKey: !!appKeyPair?.publicKey,
                appKeyVersion: appKeyPair?.keyVersion,
                error: error.message,
            }));
            console.error('解密-生成秘钥异常-3-', optsStr,
                'privateKey:', !!privateKey,
                'appKeyPairOwn:', !!appKeyPairOwn?.publicKey,
                'webKeyPair:', !!webKeyPair?.publicKey,
                'appKeyPair:', !!appKeyPair?.publicKey,
                error.message)
            return null;
        }
    } else {
        try {
             // 收到消息解密用
            if (isSelf) {
                if (!privateKey || !appKeyPairOwn || !appKeyPairOwn.publicKey) {
                    const now = Date.now();
                    const lastRepair = window._isSelfKeyRepairTime || 0;
                    if (now - lastRepair > 10000) {
                        window._isSelfKeyRepairTime = now;
                        console.$collectE2ee('isSelf解密-自身密钥缺失', _keyState());
                        console.error('isSelf解密-自身密钥缺失，尝试自动修复',
                            optsStr,
                            'privateKey:', !!privateKey,
                            'appKeyPairOwn.publicKey:', !!appKeyPairOwn?.publicKey);
                        try {
                            // 第一步：从本地缓存恢复（等同于重新登录的 fnConfigInit）
                            // 避免直接调 fnUpdateOwnKey 导致 getNewKey 生成新密钥覆盖原有好密钥
                            await eventCommon.fnConfigInit(true);
                            const { accountConfig: cachedConfig } = eventCommon.fnConfigRU();
                            if (cachedConfig.privateKey && cachedConfig.appKeyPair?.publicKey) {
                                try {
                                    return secret(cachedConfig.privateKey, cachedConfig.appKeyPair.publicKey).toUpperCase();
                                } catch (secretErr) {
                                    console.$collectE2ee('isSelf解密-缓存密钥数据异常', _keyState({ error: secretErr.message }));
                                    console.error('isSelf解密-缓存密钥数据异常，尝试服务端恢复', optsStr, secretErr.message);
                                }
                            }
                        } catch (e) {
                            console.$collectE2ee('isSelf解密-缓存恢复失败', _keyState({ error: e.message }));
                            console.error('isSelf解密-缓存恢复失败', optsStr, e);
                        }
                        try {
                            // 第二步：缓存无效或密钥数据损坏，从服务端刷新
                            setUpdateKeyPairSource('fnFriendRelKeyGet', 'isSelf解密-缓存恢复失败-从服务端刷新密钥');
                            await fnUpdateOwnKey();
                            const { accountConfig: freshConfig } = eventCommon.fnConfigRU();
                            if (freshConfig.privateKey && freshConfig.appKeyPair?.publicKey) {
                                return secret(freshConfig.privateKey, freshConfig.appKeyPair.publicKey).toUpperCase();
                            }
                        } catch (e) {
                            console.$collectE2ee('isSelf解密-服务端恢复失败', _keyState({ error: e.message }));
                            console.error('isSelf解密-服务端恢复失败', optsStr, e);
                        }
                    }
                    console.$collectE2ee('isSelf解密失败-自身密钥无效', _keyState());
                    console.error('isSelf解密失败-自身密钥无效',
                        optsStr,
                        'privateKey:', !!privateKey,
                        'appKeyPairOwn.publicKey:', !!appKeyPairOwn?.publicKey,
                        '[PC端] 密钥恢复失败');
                    return null;
                }

                // 优先用 appKeyPairOwn（版本匹配或无版本信息时）
                if (!senderKeyVersion || appKeyPairOwn.keyVersion == senderKeyVersion) {
                    try {
                        return secret(privateKey, appKeyPairOwn.publicKey).toUpperCase();
                    } catch (e) {
                        console.$collectE2ee('isSelf解密-secret计算异常', _keyState({ error: e.message }));
                        console.error('isSelf解密-secret计算异常',
                            optsStr,
                            'appKeyPairOwn.keyVersion:', appKeyPairOwn.keyVersion,
                            e.message);
                        return null;
                    }
                }

                // 版本不匹配：发送端 APP 的 keyVersion 与 PC 缓存的 appKeyPairOwn 不一致
                // 多设备切换场景：尝试从 friendKeyObjs 按版本查找发送端的公钥
                console.$collectE2ee('isSelf解密-版本不匹配', _keyState({
                    ownAppKeyVersionActual: appKeyPairOwn.keyVersion,
                    versionMatch: false,
                }));
                console.warn('isSelf解密-版本不匹配，尝试按版本查找',
                    'appKeyPairOwn.keyVersion:', appKeyPairOwn.keyVersion,
                    'senderKeyVersion:', senderKeyVersion);

                const selfKeyInfos = friendKeyObjs[loginId];
                if (selfKeyInfos) {
                    const cachedPubKey = selfKeyInfos["app-" + senderKeyVersion];
                    if (cachedPubKey) {
                        try {
                            return secret(privateKey, cachedPubKey).toUpperCase();
                        } catch (e) {
                            console.$collectE2ee('isSelf解密-缓存版本密钥计算异常', _keyState({ error: e.message }));
                            console.error('isSelf解密-缓存版本密钥计算异常', optsStr, e.message);
                        }
                    }
                }

                // 缓存中无对应版本，从 API 获取
                try {
                    const keyPair = await GetKeyPair({
                        targetId: Number(loginId),
                        appKeyVersion: senderKeyVersion,
                    });
                    if (keyPair?.appKeyPair?.publicKey) {
                        if (!friendKeyObjs[loginId]) friendKeyObjs[loginId] = {};
                        friendKeyObjs[loginId]["app-" + keyPair.appKeyPair.keyVersion] = keyPair.appKeyPair.publicKey;
                        Cache(`${loginId}-friend-key-objs`, friendKeyObjs);
                        try {
                            return secret(privateKey, keyPair.appKeyPair.publicKey).toUpperCase();
                        } catch (e) {
                            console.$collectE2ee('isSelf解密-API版本密钥计算异常', _keyState({
                                apiAppKeyVersion: keyPair.appKeyPair.keyVersion,
                                error: e.message,
                            }));
                            console.error('isSelf解密-API版本密钥计算异常', optsStr, e.message);
                        }
                    }
                } catch (e) {
                    console.$collectE2ee('isSelf解密-API获取版本密钥失败', _keyState({ error: e.message }));
                    console.error('isSelf解密-API获取版本密钥失败', optsStr, e);
                }

                // 所有尝试失败：缓存无命中、API 未返回匹配版本
                // 说明 senderKeyVersion 对应的私钥已丢失（密钥轮换后旧私钥不可恢复）
                console.$collectE2ee('isSelf解密-私钥版本不匹配-对应版本私钥已丢失', _keyState({
                    ownAppKeyVersionActual: appKeyPairOwn.keyVersion,
                    requiredVersion: senderKeyVersion,
                    privateKeyLost: true,
                }));
                // 降级返回 appKeyPairOwn 密钥（可能不正确）
                // 不返回 null，是为了让上层 fnMsgDecryption 的 _decrypt 失败后进入 isSelf 重试流程
                // 重试会调用 fnUpdateOwnKey 刷新密钥，有可能在第二次调用时恢复正确
                try {
                    return secret(privateKey, appKeyPairOwn.publicKey).toUpperCase();
                } catch (e) {
                    console.$collectE2ee('isSelf解密-降级secret计算异常', _keyState({
                        ownAppKeyVersionActual: appKeyPairOwn.keyVersion,
                        error: e.message,
                    }));
                    console.error('isSelf解密-降级secret计算异常',
                        optsStr,
                        'appKeyPairOwn.keyVersion:', appKeyPairOwn.keyVersion,
                        e.message);
                    return null;
                }
            }

            if (source === 1) {
                // 好友的 pc 密钥
                if (webKeyPair && webKeyPair.publicKey) {
                    return secret(privateKey, webKeyPair.publicKey).toUpperCase();
                }
            } else {
                // 好友的 app 密钥
                if (appKeyPair && appKeyPair.publicKey) {
                    return secret(privateKey, appKeyPair.publicKey).toUpperCase();
                }
            }

            console.$collectE2ee('解密-密钥publicKey为空-4', _keyState({
                hasWebPublicKey: !!webKeyPair?.publicKey,
                webKeyVersion: webKeyPair?.keyVersion,
                hasAppPublicKey: !!appKeyPair?.publicKey,
                appKeyVersion: appKeyPair?.keyVersion,
            }));
            console.error('解密-密钥publicKey为空-4-', optsStr, source, webKeyPair, appKeyPair)
            return null;
        } catch (error) {
            console.$collectE2ee('解密-生成秘钥异常-4', _keyState({
                hasWebPublicKey: !!webKeyPair?.publicKey,
                webKeyVersion: webKeyPair?.keyVersion,
                hasAppPublicKey: !!appKeyPair?.publicKey,
                appKeyVersion: appKeyPair?.keyVersion,
                error: error.message,
            }));
            console.error('解密-生成秘钥异常-4-', optsStr,
                'privateKey:', !!privateKey,
                'appKeyPairOwn:', !!appKeyPairOwn?.publicKey,
                'webKeyPair:', !!webKeyPair?.publicKey,
                'appKeyPair:', !!appKeyPair?.publicKey,
                error.message)
            return null;
        }

    }
};

/**
 * 消息解密
 */
export const fnMsgDecryption = async ({
    id,
    type,
    msgType,
    msgEncryptionVersion,
    content,
    attachmentKey,
    source,
    isSelf,
    senderKeyVersion,
}) => {
    const optsStr = JSON.stringify({
        id,
        type,
        msgType,
        msgEncryptionVersion,
        attachmentKey,
        source,
        isSelf})
    const _e2eeState = (extra) => {
        const { accountConfig } = eventCommon.fnConfigRU();
        return {
            hasPrivateKey: !!accountConfig?.privateKey,
            ownWebKeyVersion: accountConfig?.keyVersion,
            ownAppKeyVersion: accountConfig?.appKeyPair?.keyVersion,
            hasOwnAppPublicKey: !!accountConfig?.appKeyPair?.publicKey,
            id, type, msgEncryptionVersion, source, isSelf,
            ...extra,
        };
    };
    // 新的内容
    let contentNew = content;

    // 文件密钥
    let fileKey = null;

    // 有加密版本才需要解密
    if (msgEncryptionVersion) {
        let relKey = "";

        if (type === "group") {
            relKey = await fnGroupRelKeyGet(id);

            // 如果群密钥没获取到，则直接结束
            if (!relKey) {
                console.$collectE2ee('群消息解密失败-密钥获取失败', _e2eeState());
                console.error("群消息 解密失败-1-", optsStr);
                return {};
            }

            // 群消息解密
            try {
                contentNew = _decrypt(content, relKey);
            } catch (err) {
                console.$collectE2ee('群消息解密失败-decrypt异常', _e2eeState({ error: err.message }));
                console.error("群消息 解密失败-2-", optsStr, relKey);
                delete groupKeyObjs[id];
                return {};
            }
        } else if (type === "channel") {
            relKey = await fnChannelRelKeyGet(id);

            // 如果频道密钥没获取到，则直接结束
            if (!relKey) {
                console.$collectE2ee('频道消息解密失败-密钥获取失败', _e2eeState());
                console.error("频道消息 解密失败-1-", optsStr, relKey);
                return {};
            }

            // 频道消息解密
            try {
                contentNew = _decrypt(content, relKey);
            } catch (err) {
                console.$collectE2ee('频道消息解密失败-decrypt异常', _e2eeState({ error: err.message }));
                console.error("频道消息 解密失败-2-", optsStr, relKey);
                delete channelKeyObjs[id];
                return {};
            }
        } else {
            relKey = await fnFriendRelKeyGet({
                id,
                msgEncryptionVersion,
                source,
                isSelf,
                senderKeyVersion,
            });

            // 如果好友密钥没获取到，则直接结束
            if (!relKey) {
                console.$collectE2ee('好友消息解密失败-密钥获取失败', _e2eeState());
                console.error("好友消息 解密失败", optsStr, relKey);
                return {};
            }

            // 解密
            try {
                contentNew = _decrypt(content, relKey);
            } catch (err) {
                if (!isSelf) {
                    console.$collectE2ee('好友消息解密失败-可能私钥版本不匹配', _e2eeState({
                        error: err.message,
                        hint: '对方可能使用旧版本publicKey加密,当前privateKey已轮换,对应版本私钥已丢失',
                    }));
                    console.error("消息 解密失败", optsStr, relKey);
                    return {};
                }
                // isSelf解密失败，可能是本地appKeyPair过期，尝试刷新密钥后重试（限频：60秒内仅触发一次）
                const now = Date.now();
                const lastRefresh = window._isSelfDecryptRetryTime || 0;
                if (now - lastRefresh < 60000) {
                    console.$collectE2ee('isSelf消息解密失败-限频跳过重试', _e2eeState({ error: err.message }));
                    console.error("消息 解密失败(限频跳过重试)", optsStr, relKey);
                    return {};
                }
                window._isSelfDecryptRetryTime = now;
                try {
                    setUpdateKeyPairSource('fnMsgDecryption', 'isSelf消息解密失败-刷新密钥重试');
                    await fnUpdateOwnKey();
                    const newRelKey = await fnFriendRelKeyGet({
                        id,
                        msgEncryptionVersion,
                        source,
                        isSelf,
                        senderKeyVersion,
                    });
                    if (newRelKey && newRelKey !== relKey) {
                        contentNew = _decrypt(content, newRelKey);
                        relKey = newRelKey;
                    } else {
                        console.$collectE2ee('isSelf消息解密失败-密钥未变更', _e2eeState());
                        console.error("消息 解密失败(密钥未变更)", optsStr, relKey,
                            "msgEncryptionVersion:", msgEncryptionVersion);
                        return {};
                    }
                } catch (retryErr) {
                    console.$collectE2ee('isSelf消息解密重试失败', _e2eeState({ error: retryErr.message }));
                    console.error("消息 解密重试失败", optsStr, relKey, retryErr);
                    return {};
                }
            }
        }

        if (attachmentKey) {
            try {
                fileKey = fnUtf8ArrayToStr(
                    _decrypt(Buffer.from(attachmentKey, "hex"), relKey),
                    "all"
                );
            } catch (err) {
                console.$collectE2ee('fileKey解密失败', _e2eeState({ error: err.message }));
                console.error("fileKey 解密失败", optsStr,attachmentKey, relKey);
                // 与同函数其他 catch 保持一致：解密失败必须中止派发，否则 fileKey=null 透传到 image.vue
                // 会让加密体当成 plaintext 显示，触发"图片文件解密失败"
                return {};
            }
        }
    } else {
        fileKey = attachmentKey
    }

    // 附加信息解码
            let otherInfo = {};
            try {
                 otherInfo = fnOtherUtf8ArrayToStr(contentNew, msgType);
            } catch (e) {
                console.error("fnOtherUtf8ArrayToStr error", e);
            }

            // 内容解析字符串
            let contentStr = "";
            try {
                contentStr = fnUtf8ArrayToStr(contentNew, msgType);
            } catch (e) {
                 console.error("fnUtf8ArrayToStr error", e);
            }

            return {
                otherInfo,
                contentStr,
                fileKey,
            };
};

/**
 * buffer转字符串 todo 临时兼容之前的格式 后面可换成返回对象
 */
const fnUtf8ArrayToStr = (buffer, type) => {
    const UnitBuffer = Uint8Array.from(buffer);

    switch (type) {
        case "all": {
            try {
                const encodedString = String.fromCodePoint.apply(
                    null,
                    new Uint8Array(buffer)
                );
                return decodeURIComponent(escape(encodedString)); //没有这一步中文会乱码
            } catch (error) {
                console.error("fnUtf8ArrayToStr all error:", error);
                return "";
            }
        }
        case enumMsgType.image: {
            // 图片
            const imgObj = ImageObj.decode(UnitBuffer);
            let txt = `${imgObj.url}||${imgObj.thumbUrl}||${Number(
                imgObj.fileSize
            )}||${imgObj.sizeType}`;

            if (imgObj.ref) {
                txt = fnFormartMsgToStr(imgObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.gif: {
            // gif
            const dynamicImageObj = DynamicImageObj.decode(UnitBuffer);
            let txt = `${dynamicImageObj.url}||${dynamicImageObj.url}`;
            if (dynamicImageObj.ref) {
                txt = fnFormartMsgToStr(dynamicImageObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.file: {
            //文件
            const { size, fileUrl, name, ref } = FileObj.decode(UnitBuffer);
            let txt = `${fileUrl}||${name}||${String(size)}`;
            if (ref) {
                txt = fnFormartMsgToStr(ref, txt);
            }
            return txt;
        }
        case enumMsgType.video: {
            // 视频
            const videoObj = VideoObj.decode(UnitBuffer);
            // 格式: url*PthumbUrl||duration||fileSize||width||height
            let txt = `${videoObj.url}*P${videoObj.thumbUrl}||${videoObj.duration || 0}||${Number(videoObj.fileSize) || 0}||${videoObj.width || 0}||${videoObj.height || 0}`;
            if (videoObj.ref) {
                txt = fnFormartMsgToStr(videoObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.voice: {
            // 音频
            const audioObj = AudioObj.decode(UnitBuffer);
            let txt = `${audioObj.url}||${audioObj.duration}`;
            if (audioObj.ref) {
                txt = fnFormartMsgToStr(audioObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.shareCard: {
            // 分享名片
            const { nickName, uid, icon, ref } = NameCardObj.decode(UnitBuffer);

            let txt = icon
                ? `${nickName}*|*|*${icon}*|*|*${String(uid)}`
                : `${nickName}*|*|*${String(uid)}`;

            if (ref) {
                txt = fnFormartMsgToStr(ref, txt);
            }
            return txt;
        }
        case enumMsgType.groupNotice: {
            // 群简介 - 返回纯文本内容，元数据由 fnOtherUtf8ArrayToStr 提取
            const obj = GroupNoticeObj.decode(UnitBuffer);
            return obj.content || '';
        }
        case enumMsgType.dice: {
            // 骰子
            const data = SetImageObj.decode(UnitBuffer);
            if (data.ref && data.ref.msgId && Number(data.ref.msgId)) {
                return `${data.currentImage}||${Number(data.ref.msgId)}`;
            }
            return data.currentImage;
        }
        case enumMsgType.address: {
            // 地址
            return LocationObj.decode(UnitBuffer).address;
        }
        case enumMsgType.redEnvelope: {
            // 红包
            return "[红包消息，暂不支持]";
        }
        case enumMsgType.transfer: {
            // 转账
            return "[转账消息，暂不支持]";
        }
        case enumMsgType.payments: {
            // 转账收款
            return "[收款消息，暂不支持]";
        }
        case enumMsgType.system: {
            // 系统消息
            return SystemObj.decode(UnitBuffer).content;
        }
        case enumMsgType.animatedGame: {
            // 扑克游戏
            const data = AnimatedGameObj.decode(UnitBuffer);
            if (data.ref && data.ref.msgId && Number(data.ref.msgId)) {
                return `${data.currentImage}||${Number(data.ref.msgId)}`;
            }
            return data.currentImage;
        }
        case enumMsgType.mediasCaption: {
            const mediaList = MediaTextListObj.decode(UnitBuffer);
            // console.log('[mediasCaption] decoded MediaTextListObj:', 'caption:', mediaList.caption, 'objs count:', mediaList.objs?.length);
            const parts = [];
            if (mediaList.objs && mediaList.objs.length) {
                for (let i = 0; i < mediaList.objs.length; i++) {
                    const obj = mediaList.objs[i];
                    const mediaBuffer = Uint8Array.from(obj.content);
                    const typeName = CaptionMediaType[obj.type] || obj.type;
                    if (obj.type === CaptionMediaType.Image) {
                        const img = ImageObj.decode(mediaBuffer);
                        // console.log(`[mediasCaption] objs[${i}] type=${typeName}:`, JSON.stringify(img, null, 2));
                        parts.push(`image:${img.url}||${img.thumbUrl}||${Number(img.fileSize)}||${img.sizeType}`);
                    } else if (obj.type === CaptionMediaType.Video) {
                        const vid = VideoObj.decode(mediaBuffer);
                        // console.log(`[mediasCaption] objs[${i}] type=${typeName}:`, JSON.stringify(vid, null, 2));
                        parts.push(`video:${vid.url}*P${vid.thumbUrl}||${vid.duration || 0}||${Number(vid.fileSize) || 0}||${vid.width || 0}||${vid.height || 0}`);
                    } else if (obj.type === CaptionMediaType.DynamicImage) {
                        const gif = DynamicImageObj.decode(mediaBuffer);
                        // console.log(`[mediasCaption] objs[${i}] type=${typeName}:`, JSON.stringify(gif, null, 2));
                        parts.push(`gif:${gif.url}||${gif.url}`);
                    } else {
                        // console.log(`[mediasCaption] objs[${i}] unknown type=${typeName}`);
                    }
                }
            }
            let txt = parts.join("|||");
            if (mediaList.caption) {
                txt += "##caption##" + mediaList.caption;
            }
            if (mediaList.ref) {
                txt = fnFormartMsgToStr(mediaList.ref, txt);
            }
            return txt;
        }
        default: {
            // 文本
            const { content, ref } = TextObj.decode(UnitBuffer);
            if (ref && Number(ref.uid) != 0) {
                return fnFormartMsgToStr(ref, content);
            }
            return content;
        }
    }
};

/**
 * 附加信息解码
 */
const fnOtherUtf8ArrayToStr = (buffer, type) => {
    let UnitBuffer = Uint8Array.from(buffer);
    if (type == enumMsgType.TWMessageTypeRobot) {
        return HtmlObj.decode(UnitBuffer);
    } else if (type == enumMsgType.groupNotice) {
        // 群简介元数据：noticeId、showNotify
        const obj = GroupNoticeObj.decode(UnitBuffer);
        return {
            noticeId: obj.noticeId ? Number(obj.noticeId) : 0,
            showNotify: !!obj.showNotify,
        };
    } else {
        return {};
    }
};

/**
 * 格式化消息为字符串
 */
const fnFormartMsgToStr = (ref, str) => {
    const map = {
        1: "[图片]",
        2: "[语音]",
        3: "[视频]",
        4: "[位置]",
        5: "[名片]",
        6: "[系统]",
        7: "[文件]",
        8: "[群简介]",
        9: "[动图]",
        12: "[骰子]",
        17: "[多媒体]",
        18: "[扑克牌]",
    };

    const { msgId, content, nickname, uid, type } = ref;

    return `${str}${type ? "-||-type:" + map[type] : ""}${
        content ? "-||-content:" + content : ""
    }-||-uid:${String(uid)}-||-name:${nickname}-||-msgId:${String(msgId)}`;
};

/**
 * 字符串转流
 */
const fnEncode = (str, type, picData) => {
    switch (type) {
        case "all": {
            const arr = [...str];
            const buffer = new Uint8Array(arr.length * 4);
            let index = 0;
            for (let i = 0; i < arr.length; i++) {
                const codePoint = arr[i].codePointAt(0);
                // 四字节字符
                if (codePoint >= 0x10000) {
                    buffer[index++] = ((codePoint >> 18) & 0x7) | 0xf0;
                    buffer[index++] = ((codePoint >> 12) & 0x3f) | 0x80;
                    buffer[index++] = ((codePoint >> 6) & 0x3f) | 0x80;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else if (codePoint >= 0x800) {
                    // 三字节字符
                    buffer[index++] = ((codePoint >> 12) & 0xf) | 0xe0;
                    buffer[index++] = ((codePoint >> 6) & 0x3f) | 0x80;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else if (codePoint >= 0x80) {
                    // 两字节字符
                    buffer[index++] = ((codePoint >> 6) & 0x1f) | 0xc0;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else {
                    // 单字节字符
                    buffer[index++] = codePoint;
                }
            }
            return Uint8Array.from(buffer.slice(0, index));
        }
        case enumMsgType.image: {
            // 图片
            const { width, height, size, thumbUrl } = picData;
            return ImageObj.encode({
                width,
                height,
                fileSize: size,
                url: str,
                thumbUrl: thumbUrl || str,
            }).finish();
        }
        case enumMsgType.gif: {
            // 动图
            const { width, height, size } = picData;
            return DynamicImageObj.encode({
                width,
                height,
                fileSize: size,
                url: str,
                thumbUrl: str,
            }).finish();
        }
        case enumMsgType.file: {
            // 文件
            let { fileName: name, fileType: mimeType, size } = picData;
            return FileObj.encode({
                size,
                fileUrl: str,
                name,
                mimeType,
            }).finish();
        }
        case enumMsgType.video: {
            // 视频
            let { width, height, thumbUrl, size, duration } = picData;
            return VideoObj.encode({
                fileSize: size,
                url: str,
                thumbUrl: thumbUrl,
                duration,
                width,
                height,
            }).finish();
        }
        case enumMsgType.voice: {
            // 音频
            return AudioObj.encode({
                fileSize: 10,
                url: str,
                duration: 10,
            }).finish();
        }
        case enumMsgType.shareCard: {
            // 分享名片
            let dataList = str.split("*|*|*");
            return NameCardObj.encode({
                nickName: dataList[0],
                uid: dataList[2],
                icon: dataList[1],
            }).finish();
        }
        case enumMsgType.groupNotice: {
          // 群简介
            const { noticeId, showNotify } = picData || {};
            return GroupNoticeObj.encode({
                content: str,
                noticeId: noticeId ? Number(noticeId) : 0,
                showNotify: !!showNotify,
            }).finish();
        }
        case enumMsgType.dice: {
            // 骰子
            return SetImageObj.encode({
                setImageId: isNaN(str) ? 1 : str,
                currentImage: 0,
                imageSize: 7,
            }).finish();
        }
        case enumMsgType.animatedGame: {
            // 扑克游戏
            return AnimatedGameObj.encode({
                gameId: 1,
            }).finish();
        }
        case enumMsgType.mediasCaption: {
            const { mediasCaptionCaption = "", mediasCaptionSlots = [] } = picData || {};
            const objs = [];
            for (const slot of mediasCaptionSlots) {
                if (!slot || !slot.kind) continue;
                if (slot.kind === "image") {
                    objs.push({
                        type: CaptionMediaType.Image,
                        content: ImageObj.encode({
                            width: slot.width || 0,
                            height: slot.height || 0,
                            fileSize: Number(slot.fileSize) || 0,
                            url: slot.url,
                            thumbUrl: slot.thumbUrl || slot.url,
                            sizeType: slot.sizeType != null ? slot.sizeType : 0,
                        }).finish(),
                    });
                } else if (slot.kind === "video") {
                    objs.push({
                        type: CaptionMediaType.Video,
                        content: VideoObj.encode({
                            width: slot.width || 0,
                            height: slot.height || 0,
                            fileSize: Number(slot.fileSize) || 0,
                            url: slot.url,
                            thumbUrl: slot.thumbUrl || "",
                            duration: slot.duration || 0,
                        }).finish(),
                    });
                } else if (slot.kind === "gif") {
                    objs.push({
                        type: CaptionMediaType.DynamicImage,
                        content: DynamicImageObj.encode({
                            width: slot.width || 0,
                            height: slot.height || 0,
                            fileSize: Number(slot.fileSize) || 0,
                            url: slot.url,
                            thumbUrl: slot.thumbUrl || slot.url,
                        }).finish(),
                    });
                }
            }
            const encoded = MediaTextListObj.encode({
                objs,
                caption: mediasCaptionCaption || "",
            }).finish();
            const decoded = MediaTextListObj.decode(encoded);
            console.log('>>> encode caption decoded', decoded);
            return encoded;
        }
        default: {
            // 文本
            const params = {};
            if (str && str.indexOf("-||-uid:") != -1) {
                try {
                    let content = str.split("-||-content:")[1].split("-||-")[0];
                    content = content.split("-||-")[0].split("*|*|*")[0];
                    let ref = {
                        uid: str.split("-||-uid:")[1].split("-||-")[0],
                        type: str.split("-||-type:")[1].split("-||-")[0],
                        nickname: str.split("-||-name:")[1].split("-||-")[0],
                        msgId: str.split("-||-msgId:")[1].split("-||-")[0],
                        content,
                    };
                    params.ref = ref;
                } catch (error) {}
            }
            str = str ? str.split("-||-")[0].split("*|*|*")[0] : "";
            params.content = str;
            return TextObj.encode(params).finish();
        }
    }
};

/**
 * 格式化消息参数
 */
export const fnFormartMsgParams = async ({ data, customMsgId, id, type }) => {
    const {
        groupId,
        channelId,
        text,
        sendTime,
        msgType,
        chatType,
        width,
        height,
        size,
        fileName,
        fileType,
        thumbUrl,
        duration,
        atUsers,
        receiveUid,
        groupAttachmentKey,
        channelAttachmentKey,
        ownAppAttachmentKey,
        appAttachmentKey,
        webAttachmentKey,
        noticeId,
        showNotify,
        mediasCaptionCaption,
        mediasCaptionSlots,
    } = data;

    // 是否是官方
    const isOfficial =
        receiveUid &&
        receiveUid >= 10000 &&
        receiveUid <= 100000 &&
        receiveUid != 10008;

    const contentCode = fnEncode(text, msgType, {
        width,
        height,
        size,
        fileName,
        fileType,
        thumbUrl,
        duration,
        noticeId,
        showNotify,
        mediasCaptionCaption,
        mediasCaptionSlots,
    });

    // 协议规范化：AtUser 只保留 proto 定义的字段（uid + nickName）
    // 兼容历史/视图层用 id 命名的情况；name（本地备注名）等非协议字段不会被发到服务端
    const normalizedAtUsers = Array.isArray(atUsers)
        ? atUsers
              .map((u) => {
                  const uid = u && (u.uid ?? u.id);
                  if (uid === undefined || uid === null || uid === "") return null;
                  return { uid, nickName: u.nickName || "" };
              })
              .filter(Boolean)
        : [];
    const normalizedAtUids = normalizedAtUsers.map((u) => u.uid);

    const params = {
        msgId: null, // 消息ID
        sendUid: null, // 发送人uid
        receiveUid: null, // 接收人uid
        msgType, // 消息类型
        contentMd5: md5(contentCode), // 消息内容md5值
        sendTime: Number(sendTime), // 发送时间
        msgTime: Number(sendTime),
        sendUser: null, // 发送者信息
        snapchatTime: 0, // 阅后即焚设置时间 5秒， 10秒
        source: 1, // 消息来源 add v1.2.0
        customMsgId,
        atUsers: normalizedAtUsers,
        atUids: normalizedAtUids,
    };

    // 如果为骰子或者官方，则不加密
    if (chatType == enumMsgType.dice || chatType == enumMsgType.animatedGame  || isOfficial) {
        params.content = contentCode;

        params.appContent = {
            content: contentCode,
        };

        params.webContent = {
            content: contentCode,
        };

        params.myselfAppContent = {
            content: contentCode,
        };
    } else {
        if (type === "group") {
            // 如果是群，版本固定
            params.version = 1;

            // 文件 密钥
            params.attachmentKey = groupAttachmentKey;

            // 获取真实的密钥
            const relKey = await fnGroupRelKeyGet(id);

            // 如果群密钥没获取到，则直接结束
            if (!relKey) {
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                // benchmark: 群密钥获取失败
                benchmark.markFailed(customMsgId, 'fnGroupRelKeyGet');
                return;
            }

            // 加密内容
            params.content = _encrypt2(relKey, contentCode);
        } else if(type === "channel") {
             const loginId = eventCommon.fnCommonInfoRU({
                    getId: "loginId",
                });

            params.version = 1;
            params.attachmentKey = channelAttachmentKey;
            params.sendUid = loginId;

            // 获取真实的密钥
            const relKey = await fnChannelRelKeyGet(id);

            // 如果群密钥没获取到，则直接结束
            if (!relKey) {
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                return;
            }

            // 加密内容
            params.content = _encrypt2(relKey, contentCode);
        } else {
            const { accountConfig } = eventCommon.fnConfigRU();
            params.version = accountConfig.keyVersion;

            console.$collectE2ee('私聊加密-开始', {
                id, customMsgId,
                ownWebKeyVersion: accountConfig.keyVersion,
                hasPrivateKey: !!accountConfig.privateKey,
                ownAppKeyVersion: accountConfig.appKeyPair?.keyVersion,
                hasOwnAppPublicKey: !!accountConfig.appKeyPair?.publicKey,
            });

            const data = await fnFriendRelKeyGet({
                id,
                msgEncryptionVersion: -1,
                source: 1,
                isSelf: true,
                _diagTaskId: customMsgId,
            });

            if (!data) {
                console.$collectE2ee('私聊加密-密钥获取失败', {
                    id, customMsgId, ownWebKeyVersion: accountConfig.keyVersion,
                    hasPrivateKey: !!accountConfig.privateKey,
                    ownAppKeyVersion: accountConfig.appKeyPair?.keyVersion,
                    hasOwnAppPublicKey: !!accountConfig.appKeyPair?.publicKey,
                });
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                benchmark.markFailed(customMsgId, 'fnFriendRelKeyGet');
                try { oneToOneSendDiag.markRelKeyNull(customMsgId); } catch (e) {}
                try { oneToOneSendDiag.cancel(customMsgId, 'REL_KEY_NULL'); } catch (e) {}
                return;
            }

            const { app, pc, appOwn } = data;

            if (!app && !pc && id !== 10008) {
                console.$collectE2ee('私聊加密-app和pc密钥都为空', {
                    id, customMsgId, ownWebKeyVersion: accountConfig.keyVersion,
                    hasApp: !!app, hasPc: !!pc,
                    appKeyVersion: app?.keyVersion, pcKeyVersion: pc?.keyVersion,
                });
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                benchmark.markFailed(customMsgId, 'noAppAndPcKey');
                return;
            }

            if (app) {
                console.$collectE2ee('私聊加密-appContent', {
                    id, customMsgId,
                    appKeyVersion: app.keyVersion,
                    hasAppRelKey: !!app.relKey,
                    ownWebKeyVersion: accountConfig.keyVersion,
                    ownAppKeyVersion: accountConfig.appKeyPair?.keyVersion,
                    hasPrivateKey: !!accountConfig.privateKey,
                    versionValid: app.keyVersion > 0,
                });
                if (app.keyVersion === 0 && app.relKey) {
                    params.appContent = {
                        content: contentCode,
                        attachmentKey: appAttachmentKey,
                        version: 0,
                    };
                } else {
                    params.appContent = {
                        content: _encrypt2(app.relKey, contentCode),
                        attachmentKey: appAttachmentKey,
                        version: app.keyVersion,
                    };
                }
            }

            if (pc) {
                console.$collectE2ee('私聊加密-webContent', {
                    id, customMsgId,
                    pcKeyVersion: pc.keyVersion,
                    hasPcRelKey: !!pc.relKey,
                    ownWebKeyVersion: accountConfig.keyVersion,
                    hasPrivateKey: !!accountConfig.privateKey,
                    versionValid: pc.keyVersion > 0,
                });
                params.webContent = {
                    content: _encrypt2(pc.relKey, contentCode),
                    attachmentKey: webAttachmentKey,
                    version: pc.keyVersion,
                };
            }

            if (appOwn) {
                console.$collectE2ee('私聊加密-myselfAppContent', {
                    id, customMsgId,
                    appOwnKeyVersion: appOwn.keyVersion,
                    hasAppOwnRelKey: !!appOwn.relKey,
                    ownAppKeyVersion: accountConfig.appKeyPair?.keyVersion,
                    hasPrivateKey: !!accountConfig.privateKey,
                    versionValid: appOwn.keyVersion > 0,
                    versionMatch: appOwn.keyVersion === accountConfig.appKeyPair?.keyVersion,
                });
                params.myselfAppContent = {
                    content: _encrypt2(appOwn.relKey, contentCode),
                    attachmentKey: ownAppAttachmentKey,
                    version: appOwn.keyVersion,
                };
            }

            params.content = contentCode;

            // [诊断] 最终 OneToOneMessage 各字段（仅 friend 路径）
            if (type === 'friend') {
                try {
                    oneToOneSendDiag.markFinal(customMsgId, {
                        outerVersion: params.version,
                        appContent: params.appContent || null,
                        webContent: params.webContent || null,
                        myselfAppContent: params.myselfAppContent || null,
                    });
                } catch (e) {}
            }
        }
    }

    if (type === "group") {
        params.groupId = groupId;
    } else if(type === "channel") {
        params.channelId = channelId;
    } else {
        params.receiveUid = receiveUid;
    }

    return { atUids: [], ...data, ...params };
};

const getNewKey = async () => {
    // 设置新的密钥
    const keyInfo = setGenerateKeyPair();
    // 私key
    const privateKey = Buffer.from(keyInfo.private)
    .toString("hex")
    .toUpperCase();

    // 公key
    const publicKey = Buffer.from(keyInfo.public)
    .toString("hex")
    .toUpperCase();
    try {
        const desc = consumeUpdateKeyPairDesc();
        console.log('[UpdateKeyPair]密钥更新描述：' + desc);
        const res = await UpdateKeyPair({ publicKey, desc })
        if (res && res.keyVersion && res.commonResult.errCode === 200) {
            return {
                publicKey,
                privateKey,
                keyVersion: res.keyVersion,
            }
        }
    } catch (error) {
        console.error('获取新秘钥异常', error)
    }
    return {}
}

let _pendingUpdateOwnKey = null;
export const fnUpdateOwnKey = () => {
    if (_pendingUpdateOwnKey) return _pendingUpdateOwnKey;
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
    _pendingUpdateOwnKey = GetKeyPair({
        targetId: Number(loginId),
      }).then( async res => {
        // $e2ee: 更新密钥版本为
        console.$collectE2ee('更新密钥版本为', res);
        const { appKeyPair = null, webKeyPair = null } = res || {}
        if(!appKeyPair || !webKeyPair) return { code: 500 };
        const { accountConfig } = eventCommon.fnConfigRU();
        let { publicKey, privateKey, keyVersion } = accountConfig;

        if( publicKey !== webKeyPair.publicKey || keyVersion !== webKeyPair.keyVersion || !privateKey ) {
            // $e2ee：密钥与服务器不对称
            console.$collectE2ee('密钥与服务器不对称');
            const newKey =  await getNewKey()
            publicKey = newKey.publicKey;
            privateKey = newKey.privateKey;
            keyVersion = newKey.keyVersion
        }
        if(!publicKey || !privateKey || !keyVersion || !appKeyPair) {
            // $e2ee: 更新密钥后后，密钥信息缺失
            console.$collectE2ee('更新密钥后后，密钥信息缺失', { publicKey, privateKey, keyVersion, appKeyPair });
            return { code: 501 }
        };

        const keyInfos = {
            publicKey,
            privateKey,
            keyVersion,
            appKeyPair,
        };
        
        eventCommon.fnCommonInfoRU({
            infoMerge: keyInfos,
        });
        // $e2ee: 写入到本地
        console.$collectE2ee('写入到本地', keyInfos);
        eventCommon.fnConfigRU({
            isAccount: true,
            infoMerge: keyInfos,
        });
        return { code: 200, data: keyInfos }
      }).finally(() => {
        _pendingUpdateOwnKey = null;
      });
    return _pendingUpdateOwnKey;
}

/**
 * 同账号密钥轻量更新（20501 推送 uid === loginId 时使用）
 * 推送数据字段完整时直接更新 accountConfig.appKeyPair；
 * 缺少 publicKey 或 keyVersion 时降级调用 fnUpdateOwnKey 走接口拉取
 */
export const fnUpdateKeyOwn = ({ appKeyPair }) => {
    const appVer = Number(appKeyPair?.keyVersion) || 0;
    const appValid = appKeyPair && appKeyPair.publicKey && appVer > 0;

    if (!appValid) {
        // $e2ee：同下
        console.$collectE2ee('同账号密钥推送数据不完整，降级调用接口', { appPubKey: !!appKeyPair?.publicKey, appVer: appKeyPair?.keyVersion });
        console.warn('同账号密钥推送数据不完整，降级调用接口', 'appPubKey:', !!appKeyPair?.publicKey, 'appVer:', appKeyPair?.keyVersion);
        setUpdateKeyPairSource('fnUpdateKeyOwn', '同账号密钥推送数据不完整-降级调用接口');
        return fnUpdateOwnKey().catch(err => {
            // $e2ee：同下
            console.$collectE2ee('同账号密钥同步失败(API)', err);
            console.error('同账号密钥同步失败(API)', err);
        });
    }

    const { accountConfig } = eventCommon.fnConfigRU();
    const localAppVer = Number(accountConfig.appKeyPair?.keyVersion) || 0;

    if (localAppVer > 0 && appVer < localAppVer) {
        console.$collectE2ee('！！推送了旧版本公钥', { localAppVer, pushAppVer: appVer });
        return;
    }

    const updates = { appKeyPair };

    eventCommon.fnConfigRU({ isAccount: true, infoMerge: updates });
    eventCommon.fnCommonInfoRU({ infoMerge: updates });
};

/**
 * 更新好友的密钥
 */
export const fnUpdateKeyFriend = async ({ appKeyPair, webKeyPair, uid, noSendReceive = false }) => {
    const friendId = Number(uid);
    if (!friendId) return;

    if (appKeyPair || webKeyPair) {
        if (!friendKeyObjs[friendId]) {
            friendKeyObjs[friendId] = {};
        }

        // app的key
        if (appKeyPair && appKeyPair.publicKey && appKeyPair.keyVersion) {
            friendKeyObjs[friendId]["app-" + appKeyPair.keyVersion] =
                appKeyPair.publicKey;
        }

        // pc的key
        if (webKeyPair && webKeyPair.publicKey && webKeyPair.keyVersion) {
            friendKeyObjs[friendId]["pc-" + webKeyPair.keyVersion] =
                webKeyPair.publicKey;
        }

        // 登录的id
        const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

        // 保存到本地
        Cache(`${loginId}-friend-key-objs`, friendKeyObjs);

        // 确认收到
        if(!noSendReceive) {
             const version =
            (appKeyPair && appKeyPair.keyVersion) ||
            (webKeyPair && webKeyPair.keyVersion);
            ReceiveKeyPairMessage({ version, sendUid: friendId });
        }
    }
};

export const fnUpdateFriendKey = async ({ id }) => {
    const keyPair = await GetKeyPair({
        targetId: id,
    });
    const { appKeyPair, webKeyPair } = keyPair || {};
    let keyPar = {
        uid: id,
        noSendReceive: true
    }
    if(appKeyPair?.keyVersion && appKeyPair?.publicKey) {
        keyPar.appKeyPair = appKeyPair;
    }
    if(webKeyPair?.keyVersion && webKeyPair?.publicKey) {
        keyPar.webKeyPair = webKeyPair;
    }
    if(!keyPar.appKeyPair && !keyPar.webKeyPair) return
    fnUpdateKeyFriend(keyPar)
}

export const fnUpdateGroupKey = async ({ id }) => {
        // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });
        // 密钥信息
    let keyInfos = groupKeyObjs[id];
     const keyPair = await GetKeyPair({
            targetId: id,
            flag: 1,
            groupKeyVersion: 1,
        });
    if (keyPair && !_.isEmpty(keyPair.groupKeyPair)) {
        keyInfos = keyPair.groupKeyPair;

        // 记录
        groupKeyObjs[id] = keyInfos;

        // 保存到本地
        Cache(`${loginId}-group-key-objs`, groupKeyObjs);
    } else {
        // 解密错误
        console.error("更新群聊秘钥异常--", keyInfos);
        return null;
    }
}
