import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBAa-k9HKdzori5C_WBRdIpPaz6gAoKaMo",
  authDomain: "yourcart-ng.firebaseapp.com",
  projectId: "yourcart-ng",
  storageBucket: "yourcart-ng.firebasestorage.app",
  messagingSenderId: "474991189639",
  appId: "1:474991189639:web:f37aaca49b8e81f1b56222"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)