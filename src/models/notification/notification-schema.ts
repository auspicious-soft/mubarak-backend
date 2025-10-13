import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["user", "store"], // type of recipient
      required: true,
    },
    // References to users or stores depending on type
    recipients: [
      {
        recipientId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "recipients.recipientModel",
        },
        recipientModel: {
          type: String,
          required: true,
          enum: ["user", "store"], // dynamic reference
        },
        isRead: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // metadata: {
    //   // optional extra data
    //   link: { type: String },
    //   image: { type: String },
    // },
  },
  { timestamps: true }
);

export const notificationModel = mongoose.model(
  "notification",
  notificationSchema
);