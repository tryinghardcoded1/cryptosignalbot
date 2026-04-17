import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function run() {
  const rawConfig = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
  const firebaseConfig = JSON.parse(rawConfig);

  const app = initializeApp(firebaseConfig, "admin-script");
  const auth = getAuth(app);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  const email = 'cerezvincent1@gmail.com';
  const password = 'Memyselfandi1';

  let uid = '';

  try {
    console.log("Attempting to create account...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log("Account created successfully.");
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("Account already exists. Attempting to sign in...");
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        console.log("Signed in successfully.");
      } catch (signInErr: any) {
        console.error("Failed to sign in. Password might be incorrect on this specific Firebase project:", signInErr.code);
        process.exit(1);
      }
    } else {
      console.error("Failed to create account:", err.code);
      process.exit(1);
    }
  }

  if (uid) {
    try {
      console.log("Setting admin permissions in Firestore for UID:", uid);
      await setDoc(doc(db, 'users', uid), {
        email: email,
        createdAt: Date.now(),
        isAdmin: true
      }, { merge: true });
      console.log("Admin user configured successfully in Firestore!");
    } catch (dbErr) {
      console.error("Database error:", dbErr);
    }
  }

  process.exit(0);
}

run();
