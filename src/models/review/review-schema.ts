import mongoose from "mongoose";
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storeProduct", // linked to store product
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // reviewer
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // ⭐ between 1–5
    },
    reviewText: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [String], // optional review images
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate reviews by same user for same product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const productReviewModel = mongoose.model("productReview", reviewSchema);
