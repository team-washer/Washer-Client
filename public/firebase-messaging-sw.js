importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.data?.title || '알림';
  const notificationOptions = {
    body: payload.data?.body,
    icon: 'https://washer-log.s3.ap-northeast-2.amazonaws.com/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
