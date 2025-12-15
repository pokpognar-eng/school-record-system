import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- นำค่าจาก Firebase Console มาใส่ตรงนี้ ---
const firebaseConfig = {
  apiKey: "AIzaSyAzuFU6enoi0CjhI40gF3ncjTisKWCUcl0",
  authDomain: "school-service-app-baf5e.firebaseapp.com",
  projectId: "school-service-app-baf5e",
  storageBucket: "school-service-app-baf5e.firebasestorage.app",
  messagingSenderId: "1088172496852",
  appId: "1:1088172496852:web:06f7102960dbe55a84a841",
  measurementId: "G-QF92J5LMWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };