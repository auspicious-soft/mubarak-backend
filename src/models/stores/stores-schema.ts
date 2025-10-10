import mongoose from "mongoose";



const storeSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    role: {
      type: String,
      default: "store",
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
    image:{
      type:String,
      default:"web/logo/Frame1984078080.png"
    },
    phoneNumber: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    discount: { type: Number, default: 0 },
    address: { type: String },
  },
  { timestamps: true }
);

export const storeModel = mongoose.model("store", storeSchema);