// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5fEXFhK8gWm2ZZTluulmcV-JdqRZCdN8",
  authDomain: "calendario-f6256.firebaseapp.com",
  projectId: "calendario-f6256",
  storageBucket: "calendario-f6256.firebasestorage.app",
  messagingSenderId: "109104843309",
  appId: "1:109104843309:web:e6b74b14a2b7e7e9e506a4",
  measurementId: "G-K5FR5QT6WW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);