
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Cấu hình Firebase từ thông tin bạn cung cấp
// const firebaseConfig = {
//   apiKey: "AIzaSyCcaR5hI3Yaa0piGCMAxe_-ym_oaXbmJ30",
//   authDomain: "xeghep-phutho---hanoi.firebaseapp.com",
//   projectId: "xeghep-phutho---hanoi",
//   storageBucket: "xeghep-phutho---hanoi.firebasestorage.app",
//   messagingSenderId: "914425290150",
//   appId: "1:914425290150:web:b67b5a3b1640f7cd7d4367",
//   measurementId: "G-9DSG4SD5D4",
//   // Đường dẫn Database mặc định. 
//   // QUAN TRỌNG: Nếu app không chạy, hãy vào Firebase Console -> Realtime Database để copy link chính xác nếu nó khác link dưới.
//   databaseURL: "https://xeghep-phutho---hanoi-default-rtdb.firebaseio.com"
// };

const firebaseConfig = {
  apiKey: "AIzaSyB1bn_lenLtcm7_TFTk9AKnA5-KzqVlpFA",
  authDomain: "xeghep-phutho---hanoi-cd3b3.firebaseapp.com",
  projectId: "xeghep-phutho---hanoi-cd3b3",
  storageBucket: "xeghep-phutho---hanoi-cd3b3.firebasestorage.app",
  messagingSenderId: "593223140544",
  appId: "1:593223140544:web:a51961233da183398f5925",
  measurementId: "G-XM7ZFM5406",
  databaseURL: "https://xeghep-phutho---hanoi-cd3b3-default-rtdb.asia-southeast1.firebasedatabase.app/",
};


// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Try to initialize Analytics if available (guarded for environments where Analytics may fail)
let analytics: null | ReturnType<typeof getAnalytics> = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (err) {
  // Analytics isn't critical; log and continue so the app doesn't crash during init.
  // This can happen in environments without the browser globals or when measurementId/config is missing.
  // eslint-disable-next-line no-console
  console.warn('Firebase analytics not initialized:', err);
}

// Khởi tạo Realtime Database
export const db = getDatabase(app);
