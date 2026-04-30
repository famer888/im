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
    let arrbuf = [];
    for (
      let i = 0, len = Math.floor(arrayBuffer.length / 102416) + 1;
      i < len;
      i++
    ) {
      let newBuffer = _decrypt(
        arrayBuffer.slice(i * 102416, (i + 1) * 102416),
        fileKey
      );
      arrbuf = ConcatInt8([arrbuf, newBuffer]);
    }

    self.postMessage({ decrypted: arrbuf.buffer }, [arrbuf.buffer]);
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
