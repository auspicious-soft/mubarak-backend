import mongoose from 'mongoose';
import { customAlphabet } from "nanoid";

const identifier = customAlphabet("0123456789", 5);
const Schema = mongoose.Schema;

// Schema for Contact Information
const contactInfoSchema = new Schema({
  sellerName: {
    type: String,
    required: true,
    trim: true
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
  location: {
    type: String,
    required: true,
    trim: true
  }
});

// Main User Product Schema
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
  title: {
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
  // More images section
  // moreImages: {
  //   type: [String],
  //   default: []
  // },
  // Contact information
  contactInfo: {
    type: contactInfoSchema,
    required: true
  },
  // Status of the product (active, sold, etc.)
  status: {
    type: String,
    enum: ['active', 'sold', 'pending', 'inactive'],
    default: 'active'
  },
  // Category of the product
  category: {
    type: String,
    required: false,
    trim: true
  },
  // Tags for better searchability
  tags: {
    type: [String],
    default: []
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Middleware to update the updatedAt field on save
// userProductSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// Create indexes for better search performance
// userProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
// userProductSchema.index({ userId: 1 });
// userProductSchema.index({ status: 1 });
// userProductSchema.index({ createdAt: -1 });

export const userProductModel = mongoose.model("userProduct", userProductSchema);
