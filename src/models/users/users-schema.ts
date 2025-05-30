import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const identifier = customAlphabet("0123456789", 5);

const userSchema = new mongoose.Schema({
    identifier: {
      type: String,
      unique: true,
      default: () => identifier(),
    },
    role: {
      type: String,
      default: "user",
      required: true,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
   
    phoneNumber: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String,
    },
    address: {
      type: String
    },
    street: { type: String },
    city: { type: String },
    country: { type: String },
    postalCode: { type: String },
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("user", userSchema);
