importScripts("/worker/crypto-js.min.js");

CryptoJS.enc.u8array = {
  stringify: function (wordArray) {
    let words = wordArray.words;
    let sigBytes = wordArray.sigBytes;
    let u8 = new Int8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
      let byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[i] = byte;
    }
    return u8;
  },
  stringify2: function (wordArray) {
    let words = wordArray.words;
    let sigBytes = wordArray.sigBytes;
    let u8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
      let byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[i] = byte;
    }
    return u8;
  },
  parse: function (u8arr) {
    let len = u8arr.length;
    let words = [];
    for (let i = 0; i < len; i++) {
      words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, len);
  },
};
// 每块明文 102400 字节 → 密文 102416 字节（含 16 字节 PKCS7 整填充块）。
const PLAIN_CHUNK = 102400;
const CIPHER_CHUNK = 102416;

// encrypt arraybuffer
let _decrypt = (u8array, key) => {
  let keyHex = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
  let decryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
  let decrypted = CryptoJS.AES.decrypt(
    decryptedWordArray.toString(CryptoJS.enc.Base64),
    keyHex,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return CryptoJS.enc.u8array.stringify(decrypted);
};

// ECB 解密但不去 PKCS7 填充，用于探测分块方案。
let _decryptNoPad = (u8array, key) => {
  let keyHex = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
  let decryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
  let decrypted = CryptoJS.AES.decrypt(
    decryptedWordArray.toString(CryptoJS.enc.Base64),
    keyHex,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding,
    }
  );
  return CryptoJS.enc.u8array.stringify2(decrypted);
};

// 判定是否为 PC 端「102400 明文分块 + 逐块 PKCS7」加密方案。
//   PC 分块：第 0 块 = encrypt(102400 明文 + 16 字节 0x10 填充块)，
//            故密文 [102400,102416) 这一块（ECB 独立）解密后应为 16 个 0x10。
//   安卓整文件：该位置是真实图像数据，几乎不可能恰为 16 个 0x10。
// 体积 <= 102416 时两种方案等价（单块），统一按整文件解密即可，无需区分。
let isPcChunkedScheme = (arrayBuffer, key) => {
  if (arrayBuffer.length <= CIPHER_CHUNK) return false;
  try {
    let padCipher = arrayBuffer.slice(PLAIN_CHUNK, CIPHER_CHUNK);
    let padPlain = _decryptNoPad(padCipher, key);
    if (!padPlain || padPlain.length < 16) return false;
    for (let i = 0; i < 16; i++) {
      if ((padPlain[i] & 0xff) !== 0x10) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

//把int8array拼接起来
function ConcatInt8(list = []) {
  let long = 0;
  let res = list.reduce((arr, item) => {
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

self.addEventListener("message", (e) => {
  try {
    let { fileData, fileKey } = e.data;
    let arrayBuffer = new Uint8Array(fileData);
    let result;

    if (isPcChunkedScheme(arrayBuffer, fileKey)) {
      // PC 分块方案：按 102416 密文分块、逐块去 PKCS7 填充（行为与历史一致）
      let arrbuf = [];
      for (
        let i = 0, len = Math.floor(arrayBuffer.length / CIPHER_CHUNK) + 1;
        i < len;
        i++
      ) {
        let slice = arrayBuffer.slice(i * CIPHER_CHUNK, (i + 1) * CIPHER_CHUNK);
        if (slice.length === 0) break;
        let newBuffer = _decrypt(slice, fileKey);
        arrbuf = ConcatInt8([arrbuf, newBuffer]);
      }
      result = arrbuf;
    } else {
      // 安卓 / 整文件方案：整体单次 ECB/PKCS7 解密（修复大图分块去填充导致的错位花屏）
      result = _decrypt(arrayBuffer, fileKey);
    }

    self.postMessage({ decrypted: result.buffer }, [result.buffer]);
  } catch (error) {
    self.postMessage({
      error: {
        message: error && error.message ? error.message : String(error),
        name: error && error.name,
      },
    });
  }
  self.close();
});
