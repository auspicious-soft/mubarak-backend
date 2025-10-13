// services/notification.service.ts

import { notificationModel } from "../../models/notification/notification-schema";
import { storeModel } from "../../models/stores/stores-schema";
import { usersModel } from "../../models/users/users-schema";
import { fcm } from "../../utils/firebase";
import { sendSMS } from "../../utils/sms/sms";

interface NotificationPayload {
  type: "user" | "store";
  title: string;
  description: string;
  storeIds?: string[]; // optional, only for store notifications
  sendToSpecific?: boolean; // optional, only for store
}

export const sendNotificationService = async (payload: NotificationPayload) => {
  const { type, title, description, storeIds, sendToSpecific } = payload;

  let recipientDocs: any[] = [];

  try {
    if (type === "user") {
      // ✅ Fetch all users
      recipientDocs = await usersModel.find();

      // Collect all FCM tokens
      const fcmTokens = recipientDocs
        .flatMap((u) => (Array.isArray(u.fcmToken) ? u.fcmToken : [u.fcmToken]))
        .filter(Boolean);

      if (fcmTokens.length > 0) {
        console.log("Sending notifications to users:", fcmTokens.length);

        const message: any = {
          notification: { title, body: description },
          android: { priority: "normal" },
          apns: { headers: { "apns-priority": "5" } },
          tokens: fcmTokens,
        };

        const response = await fcm.sendEachForMulticast(message);

        console.log(
          `✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failed`
        );
      } else {
        console.log("⚠️ No FCM tokens found for users.");
      }

    } else if (type === "store") {
      // ✅ Send to specific stores or all stores
      if (sendToSpecific && storeIds && storeIds.length > 0) {
        recipientDocs = await storeModel.find({ _id: { $in: storeIds } });
      } else {
        recipientDocs = await storeModel.find();
      }

      // Send SMS via Twilio
      for (const store of recipientDocs) {
        if (store.phoneNumber) {
          try {
            await sendSMS(store.phoneNumber, `${title}\n${description}`);
          } catch (err) {
            console.error(`❌ Failed to send SMS to ${store.phoneNumber}`, err);
          }
        }
      }

    // ✅ Save notifications in DB
    const notificationsToSave = recipientDocs.map((doc) => ({
      title,
      description,
      type,
      recipients: [
        {
          recipientId: doc._id,
          recipientModel: type,
        },
      ],
    }));

    if (notificationsToSave.length > 0) {
      await notificationModel.insertMany(notificationsToSave);
    }
    }

    return { success: true, message: "Notifications sent successfully" };
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    return { success: false, message: "Failed to send notifications" };
  }
};