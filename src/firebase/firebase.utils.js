import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

const app = initializeApp(config);
const db = getFirestore();
const storage = getStorage();

export const getUploadedFileLink = async (fileToUpload, meeting_id, attachedFileName) => {
  if (fileToUpload.size > 10000000) {
    throw new Error("File size greater than 10 MB")
  }
  const storageRef = ref(storage, `attachments/${meeting_id}/${attachedFileName}`);

  try {
    const uploadTask = await uploadBytesResumable(storageRef, fileToUpload);
    const dURL = await getDownloadURL(uploadTask.ref);
    return dURL;
  }
  catch (err) {
    throw new Error(err.message)
  }
}

export const createUserProfileDocument = async (userAuth, additionalData) => {
  if (!userAuth) {
    return;
  }
  debugger;
  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapShot = await getDoc(userRef);

  if (!snapShot.exists()) {
    const { displayName, email } = userAuth;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        displayName,
        email,
        createdAt,
        ...additionalData,
      });
    } catch (error) {
      console.log("error creating user", error.message);
    }
  }

  return userRef;
};

export const auth = getAuth();
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      unsubscribe();
      resolve(userAuth);
    }, reject);
  });
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
