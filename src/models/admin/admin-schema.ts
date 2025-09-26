import mongoose from "mongoose";
const adminSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    role: {
      type: String,
      requried: true,
    },
    fullName: {
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
    image:{
      type:String,
      default:"web/logo/Frame1984078080.png"
    },
    planType: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    
    address: { type: String },
  },
  { timestamps: true }
);

export const adminModel = mongoose.model("admin", adminSchema);
