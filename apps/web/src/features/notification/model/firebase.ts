import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

// 클라 공개값(NEXT_PUBLIC_*). SW(firebase-messaging-sw.js)는 번들 밖이라 동일 config를 하드코딩.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? '';

function getFirebaseApp() {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// 브라우저 + FCM 지원 환경에서만 Messaging 인스턴스 반환. SSR/미지원 시 null.
export async function getMessagingIfSupported(): Promise<Messaging | null> {
    if (typeof window === 'undefined') return null;
    try {
        if (!(await isSupported())) return null;
        return getMessaging(getFirebaseApp());
    } catch {
        return null;
    }
}
