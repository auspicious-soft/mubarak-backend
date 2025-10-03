import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Schema for Cart Item
const cartItemSchema = new Schema({
  storeProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'storeProduct',
    required: true
  },
  selectedPriceDetail: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  _id: true
});

// Main Cart Schema
const cartSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Adjust this to match your user model name
    required: true,
    unique: true // One cart per user
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to calculate total items
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

// Index for faster queries
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.storeProduct': 1 });

export const cartModel = mongoose.model("cart", cartSchema);