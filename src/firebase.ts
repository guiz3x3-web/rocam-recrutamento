import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA6l96IKSBHh9Kg10Hb0uXWTqNvH4rEq54",
  authDomain: "recrutamento-rocam-96e76.firebaseapp.com",
  projectId: "recrutamento-rocam-96e76",
  storageBucket: "recrutamento-rocam-96e76.firebasestorage.app",
  messagingSenderId: "471290475293",
  appId: "1:471290475293:web:de263909337e633963e7f4",
  databaseURL: "https://recrutamento-rocam-96e76-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app); 
