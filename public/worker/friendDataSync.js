
self.addEventListener('message', async event => {
    let { newContactList,groupMemenberData} = event.data
    newContactList.forEach(item => {
        let id = item.userInfo?.uid?.low || item.userInfo.uid || item.uid.low ||item.uid
        for(let key in groupMemenberData) {
            let groupList=groupMemenberData[key]
            let userObj = groupList.find(i => (i.user.uid.low || i.user.uid )=== id)
       
            if(userObj) {
                userObj.user = {...userObj.user,...item.userInfo}
            }
        }
    });
    self.postMessage({groupMemenberData});
});