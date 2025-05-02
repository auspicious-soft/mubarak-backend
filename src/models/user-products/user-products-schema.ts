import mongoose from 'mongoose';
import { customAlphabet } from "nanoid";

const identifier = customAlphabet("0123456789", 5);
const Schema = mongoose.Schema;

const userProductSchema = new Schema({
  identifier: {
    type: String,
    unique: true,
    default: () => identifier(),
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  longDescription: {
    type: String,
    required: true,
    trim: true
  },
  // Main product images
  images: {
    type: [String],
    required: true,
    // validate: {
    //   validator: function(arr: string[]) {
    //     return arr.length > 0;
    //   },
    //   message: 'At least one image is required.'
    // }
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  whatsappNumber: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  exchanges: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: String,
    required: false,
    trim: true
  },

}, { timestamps: true });

export const userProductModel = mongoose.model("userProduct", userProductSchema);
