import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSi4pSZYDitawHmn-oUZv1XexOGBYSCdk",
  authDomain: "jdx-project-10.firebaseapp.com",
  projectId: "jdx-project-10",
  storageBucket: "jdx-project-10.appspot.com",
  messagingSenderId: "442689696633",
  appId: "1:442689696633:web:2d09246dc06c32a1fa35a8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
