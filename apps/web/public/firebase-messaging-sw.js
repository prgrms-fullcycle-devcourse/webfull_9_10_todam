// firebase-messaging-sw.js
// Phase 1: 생명주기 등록만. FCM 핸들러는 Phase 2에서 추가.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Phase 2에서 추가 예정:
// importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js');
// firebase.initializeApp(self.FIREBASE_CONFIG);
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((payload) => { ... });
// self.addEventListener('notificationclick', (event) => { ... });
