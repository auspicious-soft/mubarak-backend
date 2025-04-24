import mongoose from "mongoose";



const storeSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    role: {
      type: String,
      requried: true,
    },
    ownerName: {
      type: String,
      requried: true,
    },
    storeName: {
      type: String,
      requried: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phoneNumber: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    address: { type: String },
  },
  { timestamps: true }
);

export const storeModel = mongoose.model("store", storeSchema);
