import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  Messaging,
  MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB3qYCGqzw2mz83rvGdnRMBjFr-8VV4x4s",
  authDomain: "smalloffice-67f8e.firebaseapp.com",
  projectId: "smalloffice-67f8e",
  storageBucket: "smalloffice-67f8e.appspot.com",
  messagingSenderId: "825052312770",
  appId: "1:825052312770:web:6226436f03aa334bec775b",
  measurementId: "G-1S1DMMPBXJ",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// ✅ Messaging is dynamically assigned only if supported
let messaging: Messaging | null = null;

const setupMessaging = async (): Promise<Messaging | null> => {
  const supported = await isSupported();
  if (!supported) {
    console.warn("🚫 Firebase Messaging is not supported in this browser.");
    return null;
  }

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error("🔥 Error initializing messaging:", error);
    return null;
  }
};

// ✅ Request Firebase token safely
export const requestFirebaseToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = await setupMessaging();
    if (!messagingInstance) return null;

    const TOKEN_KEY = "fcm_token";
    const LAST_UPDATE_KEY = "fcm_token_last_update";
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const currentTime = Date.now();
    if (
      TOKEN_KEY &&
      LAST_UPDATE_KEY &&
      currentTime - parseInt(LAST_UPDATE_KEY) < ONE_DAY_MS
    ) {
      console.log("✅ Using cached FCM Token:", TOKEN_KEY);
      return TOKEN_KEY;
    }
    const token = await getToken(messagingInstance, {
      vapidKey:
        "BLhJGZkWcp5FUuBB9Jm3OYOhp2t06rhwfaELs7B2i-SIIG_di0ESeuc5KLoNEkS-pWmIsNCRUjxX3mXnJBcfAvs",
    });

    if (token) {
      console.log("✅ New FCM Token:", token);

      return token;
    } else {
      console.warn("⚠️ No FCM token available.");
      return null;
    }
  } catch (error) {
    console.error("🔥 FCM Token error:", error);
    return null;
  }
};

export const setupForegroundMessageHandler = async (
  callback: (payload: MessagePayload) => void,
) => {
  const messagingInstance = await setupMessaging();
  if (!messagingInstance) return;

  onMessage(messagingInstance, (payload) => {
    console.log("📢 Foreground message:", payload);
    callback(payload);
  });
};

// ✅ Service worker registration
let serviceWorkerRegistered = false;

export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | void> => {
    if ("serviceWorker" in navigator && !serviceWorkerRegistered) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        console.log("🔥 Service Worker Registered:", registration);
        serviceWorkerRegistered = true;
        return registration;
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
        throw error;
      }
    }
  };
