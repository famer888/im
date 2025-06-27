// const CryptoJS = require('./crypto');
// const CryptoJS = require('crypto-js');
// var JSEncrypt = require("node-jsencrypt");
// const crypto = require('@/api/base/crypto-js.min.js');
// 导入所需要的模块
// var CryptoJS = require("@/api/base/crypto-js.min.js");           
// var RSA = require("crypto-js/pad-rsa");

// 引入 jsencrypt 库
// var JSEncrypt = require('./jsencrypt.min');
// import JSEncrypt from 'jsencrypt'
import JSEncrypt from 'jsencrypt'




// const JSEncrypt = require('./jsencrypt.min');

// 创建 JSEncrypt 实例

JSEncrypt.prototype.encryptLong = function(string) {
  var b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var b64pad = "=";

  function hex2b64(h) {
    var i;
    var c;
    var ret = "";
    for (i = 0; i + 3 <= h.length; i += 3) {
        c = parseInt(h.substring(i, i + 3), 16);
        ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
    }
    if (i + 1 == h.length) {
        c = parseInt(h.substring(i, i + 1), 16);
        ret += b64map.charAt(c << 2);
    }
    else if (i + 2 == h.length) {
        c = parseInt(h.substring(i, i + 2), 16);
        ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
    }
    while ((ret.length & 3) > 0) {
        ret += b64pad;
    }
    return ret;
}
  var k = this.getKey();
  try {
      var lt = "";
      var ct = "";
      //RSA每次加密117bytes，需要辅助方法判断字符串截取位置
      //1.获取字符串截取点
      var bytes = new Array();
      bytes.push(0);
      var byteNo = 0;
      var len, c;
      len = string.length;
      var temp = 0;
      for (var i = 0; i < len; i++) {
          c = string.charCodeAt(i);
          if (c >= 0x010000 && c <= 0x10FFFF) {
              byteNo += 4;
          } else if (c >= 0x000800 && c <= 0x00FFFF) {
              byteNo += 3;
          } else if (c >= 0x000080 && c <= 0x0007FF) {
              byteNo += 2;
          } else {
              byteNo += 1;
          }
          if ((byteNo % 117) >= 114 || (byteNo % 117) == 0) {
              if (byteNo - temp >= 114) {
                  bytes.push(i);
                  temp = byteNo;
              }
          }
      }
      //2.截取字符串并分段加密
      if (bytes.length > 1) {
          for (var i = 0; i < bytes.length - 1; i++) {
              var str;
              if (i == 0) {
                  str = string.substring(0, bytes[i + 1] + 1);
              } else {
                  str = string.substring(bytes[i] + 1, bytes[i + 1] + 1);
              }
              var t1 = k.encrypt(str);
              ct += t1;
          }
          ;
          if (bytes[bytes.length - 1] != string.length - 1) {
              var lastStr = string.substring(bytes[bytes.length - 1] + 1);
              ct += k.encrypt(lastStr);
          }
          return hex2b64(ct);
      }
      var t = k.encrypt(string);
      var y = hex2b64(t);
      return y;
  } catch (ex) {
    console.log('encryptLong-111-',ex)
      return false;
  }
};


// 使用公钥加密数据
export const encryptedData = (publicKey,data) => {
  console.log('JSEncrypt',JSEncrypt)
  // var encrypt = new JSEncrypt();
  // encrypt.setPublicKey(publicKey);
  // var encrypted = encrypt.encrypt(data);
  // return encrypted

  let encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  let encryptPwd = encrypt.encryptLong(data);
  console.log('encryptedData-',encryptPwd)
  return encryptPwd;

// const wordArrayData = CryptoJS.enc.Utf8.parse(data);
// const encryptedData = CryptoJS.RSA.encrypt(wordArrayData, publicKey).toString();
 
  // 将公钥字符串转换为 Buffer
  // return crypto.publicEncrypt(Buffer.from(publicKey, 'base64'), Buffer.from(data, 'utf8'));
  // var encrypted = CryptoJS.RSA.encrypt(data, publicKey).toString();
  //  return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
} 

// 使用私钥解密数据
export const decryptedData = (privateKey,encryptedData) => {
    crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64')).toString();
} 

export const generateKeyPairSync = () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // 密钥长度
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      return {privateKey,publicKey}
}

