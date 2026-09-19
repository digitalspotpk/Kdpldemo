import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCevZQ147HjQKzEyQjr7cfFgI4Icj-tlYM",
  authDomain: "kd-premier-league.firebaseapp.com",
  projectId: "kd-premier-league",
  storageBucket: "kd-premier-league.firebasestorage.app",
  messagingSenderId: "568383052969",
  appId: "1:568383052969:web:5d659048366e3bcb5b9db8",
};

function loadConfig() {
  try {
    const saved = localStorage.getItem('kdpl_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }
  return DEFAULT_CONFIG;
}

export const firebaseConfig = loadConfig();
export const firebaseApp = initializeApp(firebaseConfig);

function initDb() {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db = initDb();
export const auth = getAuth(firebaseApp);
export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && !!firebaseConfig.apiKey;
}
