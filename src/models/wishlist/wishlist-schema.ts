import mongoose from "mongoose";
const Schema = mongoose.Schema;

const wishlistSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    productType: {
      type: String,
      enum: ["storeProduct", "userProduct"], // To know the source
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "productType", // dynamic reference (storeProduct or userProduct)
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure a user cannot add the same product twice
wishlistSchema.index({ userId: 1, productId: 1, productType: 1 }, { unique: true });

export const wishlistModel = mongoose.model("wishlist", wishlistSchema);