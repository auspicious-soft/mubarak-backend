import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  const json = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
    "base64"
  ).toString("utf-8");

  const serviceAccount = JSON.parse(json);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const fcm = admin.messaging();
