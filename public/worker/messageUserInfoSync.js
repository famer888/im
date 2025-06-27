/**
 * 修改表中的所有数据
 * editFn (item)=> {
 *          item.userInfo.icon = 'newIcon.png';
            item.userInfo.name = 'newName';
 *       }
 */
const editTableAllData =(db,tableName,editFn) => {
    return new Promise((resolve,reject) => {
        try{
            const transaction = db.transaction(tableName, 'readwrite');
            const objectStore = transaction.objectStore(tableName);
            const getAllRequest = objectStore.getAll();
            getAllRequest.onsuccess = function(event) {
              const allData = event.target.result;
              allData.slice(-5000).forEach(function(data) {
                editFn(data)
                // 将修改后的数据保存回表中
                objectStore.put(data);
              });
            };
            transaction.oncomplete = function(event) {
              resolve(event)
            };
        } catch (error) {
            console.error(error);
            reject(error)
        }
    })
}

const msgSync = (contactList,dbName) => {
    return new Promise((resolve,reject)=>{
        const request = indexedDB.open(dbName);
        request.onsuccess = async (event) => {
            const db = event.target.result;
            let allTableNameObj = db.objectStoreNames
            let allTableName =Object.keys(allTableNameObj).map(key => allTableNameObj[key])
            
            if(!allTableName && !allTableName.length) return
            let allGroupTableName= allTableName.filter(item => item.includes('groupMessage'))
            await Promise.all(allGroupTableName.map(groupTableName => 
                editTableAllData(db,groupTableName,(item)=>{
                    let uid = item.UserID || item.sendMember?.user?.uid?.low || item.sendMember?.user?.uid
                    if(!uid) return
                   let userObj = contactList.find(item => (item.userInfo.uid.low || item.userInfo.uid) == uid)
                    if(userObj && userObj.userInfo) {
                        item.sendMember.user.icon= userObj.userInfo.icon ||''
                    }
                })
            ))
            resolve(1)
        };
        request.onerror = function(event) {
            console.error(event);
            reject(event)
        };
    })
}

self.addEventListener('message', async event => {
    let { contactList,dbName} = event.data
    await msgSync(contactList,dbName)
    self.postMessage(1);
});