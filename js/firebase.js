// js/firebase.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyChrB0ClWB6KlZgCc4x1rEtxGoYTahLD9I",
  authDomain: "medistore-web-77ee9.firebaseapp.com",
  projectId: "medistore-web-77ee9",   // ✅ must be MediStore projectId
  storageBucket: "medistore-web-77ee9.appspot.com",
  messagingSenderId: "921084167652",
  appId: "1:921084167652:web:87d3169100501ba812b3f1",
  measurementId: "G-DD0WWJPQMH"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase Auth and Firestore to use in other JS files
export const auth = getAuth(app);
export const db = getFirestore(app);


