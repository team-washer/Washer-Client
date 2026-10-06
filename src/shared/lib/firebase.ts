import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import firebaseConfig from "./firebase-config";
import registerPushToken from "@/shared/hooks/use-push-message";

const app = initializeApp(firebaseConfig);

export const getMessagingIfSupported = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export async function requestPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.warn("푸시 권한 거부됨");
    return null;
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    console.warn("FCM 미지원 브라우저");
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error("VAPID 키 없음");
    return null;
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker?.ready;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });
    await registerPushToken({ token });
    return token;
  } catch (error) {
    console.error("FCM 토큰 발급 오류:", error);
    return null;
  }
}
