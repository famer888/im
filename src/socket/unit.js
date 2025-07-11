let Int64 = require("node-int64");

// 将数值写入到视图中，获得其字节数组，大端字节序
function getUint8Array(len, setNum) {
    var buffer = new ArrayBuffer(len); // 指定字节长度
    setNum(new DataView(buffer)); // 根据不同的类型调用不同的函数来写入数值
    return new Uint8Array(buffer); // 创建一个字节数组，从缓存中拿取数据
}

// 得到一个8位有符号整型的字节数组，大端字节序
export function getInt8Bytes(num, count = 1) {
    return getUint8Array(count, function (view) {
        view.setInt8(count - 1, num);
    });
}

export function getUint8Array8length(lastValue) {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, lastValue]);
}

// 得到一个8位无符号整型的字节数组，大端字节序
export function getUint8Bytes(num) {
    return getUint8Array(1, function (view) {
        view.setUint8(0, num);
    });
}

// 得到一个16位有符号整型的字节数组，大端字节序
export function getInt16Bytes(num) {
    return getUint8Array(2, function (view) {
        view.setInt16(0, num);
    });
}

// 得到一个16位无符号整型的字节数组，大端字节序
export function getUint16Bytes(num) {
    return getUint8Array(2, function (view) {
        view.setUint16(0, num);
    });
}

// 得到一个32位有符号整型的字节数组，大端字节序
export function getInt32Bytes(num) {
    return getUint8Array(4, function (view) {
        view.setInt32(0, num);
    });
}

// 得到一个32位无符号整型的字节数组，大端字节序
export function getUint32Bytes(num, count = 4) {
    return getUint8Array(count, function (view) {
        view.setUint32(0, num);
    });
}

// 得到一个32位浮点型的字节数组，大端字节序
export function getFloat32Bytes(num) {
    return getUint8Array(4, function (view) {
        view.setFloat32(0, num);
    });
}

// 得到一个64位浮点型的字节数组，大端字节序
export function getFloat64Bytes(num) {
    return getUint8Array(8, function (view) {
        view.setFloat64(0, num);
    });
}

export function getU32(num) {
    return getUint8Array(4, function (view) {
        return view.getUint32(0, num);
    });
}

export function getInt64(num) {
    let x = new Int64(num);
    return Int8Array.from(x.buffer);
}

export function stringToAscii(str) {  
    let asciiArray = [];  
    for (let i = 0; i < str.length; i++) {  
        asciiArray.push(str.charCodeAt(i));  
    }  
    return asciiArray;  
}  