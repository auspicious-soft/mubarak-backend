import admin from "firebase-admin";
import dotenv from "dotenv";

// ✅ Load environment variables from .env file
const dotenvResult = dotenv.config();

if (dotenvResult.error) {
  console.error("❌ Error loading .env file:", dotenvResult.error);
} else {
  console.log("✅ .env file loaded successfully");
}

if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT env variable is not defined.");
    }

    console.log("ℹ️ Parsing FIREBASE_SERVICE_ACCOUNT...");

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    console.log("✅ Service account parsed successfully. Initializing Firebase...");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
  }
}

export const fcm = admin.messaging();