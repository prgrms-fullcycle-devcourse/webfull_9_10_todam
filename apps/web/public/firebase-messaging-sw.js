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

// notification 페이로드는 백그라운드에서 브라우저/FCM SDK가 자동 1회 표시한다.
// 여기서 onBackgroundMessage로 showNotification을 또 호출하면 알림이 2번 떠서 두지 않는다.
// (messaging 인스턴스는 SDK의 백그라운드 수신/자동 표시 활성화를 위해 생성만 유지.)
firebase.messaging();

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
