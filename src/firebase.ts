import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAd72wlqY7BXnC-HrXYhTXiVhmBBxegqks",
  authDomain: "safe-path-45055.firebaseapp.com",
  projectId: "safe-path-45055",
  storageBucket: "safe-path-45055.firebasestorage.app",
  messagingSenderId: "138616442913",
  appId: "1:138616442913:web:ecd4b388d9045779fb9360",
  measurementId: "G-VTJJV4S6HQ"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, firebase };