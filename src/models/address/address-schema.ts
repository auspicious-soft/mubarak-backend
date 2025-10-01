import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  recipientName: string;
  streetAddress: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const addressSchema: Schema = new Schema<IAddress>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // assumes you have a user model named "user"
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    streetAddress: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const AddressModel = mongoose.model<IAddress>("address", addressSchema);