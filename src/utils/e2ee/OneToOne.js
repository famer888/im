import sharePromise from "../sharePromise";

class KeyPairMap {
  // [key: uid]: OneToOneKeyPair[]
  pairs = new Map();

  init() {
    
  }

  fetchKeyPairByUid(uid) {

  }
  fetchKeyPairByVersion(version) {

  }
  getCurrentUserKeyPair() {
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

  }
  recieved() {

  }
  confirm() {

  }
  clear() {
    
  }
  storage() {
    
  }
}
// created: timestamp
// type: 'app' | 'pc' | 'appOwn'
// publicKey: string
// keyVersion: number
// privateKey: string
// valid: boolean
class KeyPair {

}
class Decryption {
  decryptInPipe() {
    
  }
  pipe() {

  }
}
class Encryption {

}

const OneToOneKeyPairMap = new KeyPairMap();
const OneToOneDecryption = new Decryption();
const OneToOneEncryption = new Encryption();
export { OneToOneKeyPairMap, OneToOneDecryption, OneToOneEncryption };