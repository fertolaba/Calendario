// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWU-Mvgdb3W1R_agC5c5HVLR5eB7nqdOc",
  authDomain: "calendarioequipo-8513b.firebaseapp.com",
  projectId: "calendarioequipo-8513b",
  storageBucket: "calendarioequipo-8513b.firebasestorage.app",
  messagingSenderId: "346195093556",
  appId: "1:346195093556:web:417769448babfce5dcc261",
  measurementId: "G-P79JK8SWP2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// 4. Inicializar Firestore y EXPORTARLO (Esta es la línea que te falta)
export const db = getFirestore(app);