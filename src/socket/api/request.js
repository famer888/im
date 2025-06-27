import { _decrypt, _encrypt } from "@/api/base/index";
import { AES_KEY } from "@/api/base/unit";
import { getInt64, getUint32Bytes, getUint16Bytes, stringToAscii } from "../unit";
import { getApiMacAddressSync, getAesKeySync } from '@/utils/trendsAesKey'
import configs from "@/config.js";

export function encrypt(data,key) {
    let aesKey = AES_KEY
    if(!key) {
        aesKey = configs.TRENDS_AES_KEY ? getAesKeySync() : AES_KEY
    }
    return _encrypt(key || aesKey || AES_KEY, data);
}

export function decrypt(info, key) {
    let aesKey = AES_KEY
    if(!key) {
        aesKey = configs.TRENDS_AES_KEY ? getAesKeySync() : AES_KEY
    }
    try {
        return _decrypt(Int8Array.from(info), key || aesKey || AES_KEY)
    } catch (error) {
        return _decrypt(Int8Array.from(info), AES_KEY)
    }
}

const getSokectMacAddress = () => {
    try {
        let mac = getApiMacAddressSync()
        if(!mac){
            throw new RangeError('sokect调用mac地址获取失败'); 
            return
        }
        let macArr = stringToAscii(mac)
        let macArrLength = getUint32Bytes(macArr.length)
        return {macArr,macArrLength}
    } catch (error) {
        throw new RangeError('Divisor cannot be zero');  
    }
   
}

export function initHeader(buffer, cmd) {
    let isJM = new Int8Array([1]);
    let isZip = new Int8Array([-128]); //-128后端将转为bit格式10000000读取第1位位是否动态域名判断、最后一位作为是否压缩判断
    let mid = new getUint16Bytes(cmd);
    let key = configs.TRENDS_AES_KEY ? getAesKeySync() : AES_KEY
    let signed = encrypt(buffer,  key || AES_KEY)
    let Cmd = getInt64(cmd)
    let msg = null
    let len = 0
    const fn = () => {
        isZip = new Int8Array([0]);
        len = getUint32Bytes(signed.length)
        msg = ConcatInt8([isJM, isZip, mid, len, Cmd, signed])
    }
    if(!configs.TRENDS_AES_KEY || !key) {
        fn() 
        return msg
    }
    try {  
        
        let { macArr, macArrLength} = getSokectMacAddress()
        let contentLength = signed.length + macArr.length + macArrLength.length
        len = getUint32Bytes(contentLength)
        msg = ConcatInt8([isJM, isZip, mid, len, Cmd, macArrLength, macArr, signed])
    } catch (error) {  
        fn()
        console.error(error);
    }
    return msg
}

//把int8array拼接起来
export function ConcatInt8(list = []) {
    let long = 0;
    const res = list.reduce((arr, item) => {
        arr.set(item, long);
        long += item.length;
        return arr;
    }, new Int8Array(getBufferLength(list)));
    return res;
}

function getBufferLength(list) {
    return list.reduce((sum, item) => {
        return (sum += item.length);
    }, 0);
}
