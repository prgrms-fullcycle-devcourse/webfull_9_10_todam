// firebase-messaging-sw.js
// FCM 백그라운드 푸시 수신 SW. 번들 밖 정적 파일 → process.env 못 읽음.
// firebaseConfig는 공개값(클라 노출 OK)이라 하드코딩. (서비스 계정 키는 BE 전용, 여기 없음)
// importScripts 버전은 앱의 firebase 패키지 버전(12.14.0)과 맞춘다.

importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyDgF0QQgPHMH8Xo_lTDXppPvNGHeexHrL4',
    authDomain: 'todam-web.firebaseapp.com',
    projectId: 'todam-web',
    storageBucket: 'todam-web.firebasestorage.app',
    messagingSenderId: '194347941618',
    appId: '1:194347941618:web:56847ed14fe880cebfda6b',
});

const messaging = firebase.messaging();

// 앱이 백그라운드/종료 상태일 때 수신. data 페이로드 기준으로 알림 표시.
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? payload.data?.title ?? 'todam';
    const options = {
        body: payload.notification?.body ?? payload.data?.body ?? '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: { deepLink: payload.data?.deepLink ?? '/' },
    };
    self.registration.showNotification(title, options);
});

// 알림 클릭 → deepLink로 이동(이미 열린 탭 있으면 포커스).
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const deepLink = event.notification.data?.deepLink ?? '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(deepLink);
                    return client.focus();
                }
            }
            return self.clients.openWindow(deepLink);
        }),
    );
});

// 생명주기 — 즉시 활성화.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
