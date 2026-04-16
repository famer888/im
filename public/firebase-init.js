import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAURQYoCKCBKtLDsY97DuT3QJc38SbCDz8',
  authDomain: 'airy-task-99702.firebaseapp.com',
  databaseURL: 'https://airy-task-99702.firebaseio.com',
  projectId: 'airy-task-99702',
  storageBucket: 'airy-task-99702.appspot.com',
  messagingSenderId: '893754626953',
  appId: '1:893754626953:web:68c619c0fa81d993e58758',
  measurementId: 'G-WBJTK877PJ',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
logEvent(analytics, 'crashlytics_pcs', {
  user_name: 333,
  userid: '1231231',
  platm: 'mac',
});
