/*
 * @Author: Klien
 * @Date: 2022-09-22 18:57:53
 * @LastEditTime: 2022-09-22 19:16:01
 * @LastEditors: Klien
 */
let CryptoJS = require('./crypto-js.min.js')
import { sharedKey, generateKeyPair } from 'curve25519-js';

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
let setGenerateKeyPair = () => {

	return generateKeyPair(RandomUintArray());
}
let RandomUintArray = (len = 32) => {
	let array = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		array[i] = parseInt((Math.random() * 250).toFixed(0))
	}
	return array;
}
let secret = (A, B) => {
	const alicePriv = Uint8Array.from(Buffer.from(A, 'hex'));
	const bobPub = Uint8Array.from(Buffer.from(B, 'hex'));
	const secret = sharedKey(alicePriv, bobPub);
	return Buffer.from(secret).toString('hex');
}
// decrypt arraybuffer form file
let _decrypt = (u8array, key) => {
	let keyHex = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
	let decryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
	let decrypted = CryptoJS.AES.decrypt(decryptedWordArray.toString(CryptoJS.enc.Base64), keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return CryptoJS.enc.u8array.stringify(decrypted)
};

let _decrypt2 = (u8array, key) => {
	let keyHex = CryptoJS.enc.Utf8.parse(key);
	let decryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
	let decrypted = CryptoJS.DES.decrypt(decryptedWordArray.toString(CryptoJS.enc.Base64), keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return CryptoJS.enc.u8array.stringify(decrypted)
};


// encrypt arraybuffer
let _encrypt = (key, u8array) => {
	let keyHex = CryptoJS.enc.Utf8.parse(key);
	let encryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
	let encrypted = CryptoJS.AES.encrypt(encryptedWordArray, keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return CryptoJS.enc.u8array.stringify(encrypted.ciphertext);
};
let _encrypt2 = (key, u8array) => {
	let keyHex = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
	let encryptedWordArray = CryptoJS.enc.u8array.parse(u8array);
	let encrypted = CryptoJS.AES.encrypt(encryptedWordArray, keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return CryptoJS.enc.u8array.stringify2(encrypted.ciphertext);
};
const encryptBase64 = (word, key) => {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const srcs = CryptoJS.enc.Utf8.parse(word);
    const encrypted = CryptoJS.AES.encrypt(srcs, keyHex, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });
    const base64Encrypted = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
    return base64Encrypted;
};
const encrypt = (word, key) => {
	const keyHex = CryptoJS.enc.Utf8.parse(key);
	const srcs = CryptoJS.enc.Utf8.parse(word);
	const encrypted = CryptoJS.AES.encrypt(srcs, keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return encrypted.toString();
};
const decrypt = (encryptedWord, key) => {
	const keyHex = CryptoJS.enc.Utf8.parse(key);
	const decrypted = CryptoJS.AES.decrypt(encryptedWord, keyHex, {
	  mode: CryptoJS.mode.ECB,
	  padding: CryptoJS.pad.Pkcs7,
	});
	return decrypted.toString(CryptoJS.enc.Utf8);
};
const str2ab = function (str) {
	var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
	var bufView = new Uint16Array(buf);
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
};


const encryptHex = (jsonString, key) => {
	const secretKey = CryptoJS.enc.Utf8.parse(key);  
	const encrypted = CryptoJS.AES.encrypt(jsonString, secretKey, {  
		mode: CryptoJS.mode.ECB,  
		padding: CryptoJS.pad.Pkcs7  
    }).toString();  
	return base64ToHex(encrypted);
};

const decryptHex = (jsonString, key) => {
	const secretKey = CryptoJS.enc.Utf8.parse(key); 
	const decrypted = CryptoJS.AES.decrypt(hexToBase64(jsonString), secretKey, {  
		mode: CryptoJS.mode.ECB,  
		padding: CryptoJS.pad.Pkcs7  
	});   
	const decryptStr = decrypted.toString(CryptoJS.enc.Utf8);  
	return decryptStr;
};



function base64ToHex(base64) {  
	let binaryString = atob(base64);  
	let hexString = '';  
	for (let i = 0; i < binaryString.length; i++) {  
		let byte = binaryString.charCodeAt(i);  
		hexString += (byte >> 4).toString(16).padStart(1, '0');  
		hexString += (byte & 0x0F).toString(16).padStart(1, '0');  
	}  
	return hexString.toLowerCase();  
}  

function hexToBase64(hex) {  
	try {
		let hexBytes = hex.match(/.{1,2}/g) || [];  
		let binaryString = '';  
		hexBytes.forEach(byte => {  
			binaryString += String.fromCharCode(parseInt(byte, 16));  
		});  
		return btoa(binaryString);  
	} catch (error) {
		console.error(error, hex)
	}
	
}  

export { decrypt, encryptBase64, _decrypt, _encrypt, CryptoJS, encrypt, str2ab, secret, setGenerateKeyPair, _encrypt2, _decrypt2, encryptHex, decryptHex }