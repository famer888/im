importScripts('/worker/crypto-js.min.js');

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

const _encrypt = (key, u8array) => {
  let keyHex = CryptoJS.enc.Utf8.parse(key);
  let encryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
  let encrypted = CryptoJS.AES.encrypt(encryptedWordArray, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return CryptoJS.enc.u8array.stringify(encrypted.ciphertext);
};

let db = null;
const getTableAllData = (transaction, objectStoreName) => {
  return new Promise((resolve) => {
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.getAll();
    request.onsuccess = function (event) {
      let entries = event.target.result;
      entries = entries.slice(-10000).sort((a, b) => b.sendTime - a.sendTime);
      //    entries = entries.sort((a, b) => b.sendTime - a.sendTime);
      resolve(entries);
    };
  });
};

const getAllHistoryList = async (dbName) => {
  return new Promise(async (resolve) => {
    try {
      let results = [];
      let list = db._storeNames || Object.values(db.objectStoreNames);
      const transaction = db.transaction(list, 'readonly');
      let history = await Promise.all(list.map((item) => getTableAllData(transaction, item)));
      results = history.map((item, index) => ({
        name: list[index],
        list: item,
      }));
      resolve(results);
    } catch (err) {
      resolve([]);
    }
  });
};

const openDB = (dbName) => {
  // 打开IndexedDB数据库
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };
  });
};

self.addEventListener('message', async (event) => {
  let { dbName, params, key } = event.data;
  if (dbName) {
    await openDB(dbName);
    if (db) {
      const history = await getAllHistoryList(dbName);
      let datas = Object.assign({}, params, { history });
      const buffer = new TextEncoder().encode(JSON.stringify(datas));
      const encrypted = key ? _encrypt(key, buffer) : buffer;
      self.postMessage({ encrypted: encrypted });
    }
  }
});
