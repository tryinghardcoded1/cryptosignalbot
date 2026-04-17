import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config dynamically safely for server
const rawConfig = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
const firebaseConfig = JSON.parse(rawConfig);

const app = initializeApp(firebaseConfig, "server-app");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function addSignalFromServer(data: { pair: string, signal: string, entry: number, takeProfit: number, stopLoss: number }) {
  const signalData = {
    ...data,
    timestamp: Date.now(),
    isWebhook: true,
    webhookSecret: "server_secret_for_webhook"
  };
  
  await addDoc(collection(db, "signals"), signalData);
}
