// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDx1SskX8Zp8B1wY1qXBTOz5uVmcQvZWfI",
  authDomain: "zestify-dbf64.firebaseapp.com",
  projectId: "zestify-dbf64",
  storageBucket: "zestify-dbf64.firebasestorage.app",
  messagingSenderId: "665386479103",
  appId: "1:665386479103:web:9e7f68c63d40b03ee6cbca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
