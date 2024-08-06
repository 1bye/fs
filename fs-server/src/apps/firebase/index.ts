// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCe6X3ULofCpRwzVKvwcDNAIObrgT2T_wc",
    authDomain: "spending-money-762d0.firebaseapp.com",
    databaseURL: "https://spending-money-762d0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spending-money-762d0",
    storageBucket: "spending-money-762d0.appspot.com",
    messagingSenderId: "616872193290",
    appId: "1:616872193290:web:0ea7be3bea9bc54f351ef3",
    measurementId: "G-WKM6YHGR1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    app,
    db
}