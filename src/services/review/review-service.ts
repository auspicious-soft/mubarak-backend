import mongoose from "mongoose";
import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { productReviewModel } from "../../models/review/review-schema";
import { storeProductModel } from "../../models/store-products/store-products-schema";

export const addStoreProductReviewService = async (
  userId: string,
  payload: {
    productId: string;
    rating: number;
    reviewText?: string;
  },
  res: Response
) => {
    const { productId, rating, reviewText = "" } = payload;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponseHandler(
        "Invalid product ID",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }
    const product = await storeProductModel.findById(productId);
    if (!product) {
      return errorResponseHandler(
        "Product not found",
        httpStatusCode.NOT_FOUND,
        res
      );
    }

    if (rating < 1 || rating > 5) {
      return errorResponseHandler(
        "Rating must be between 1 and 5",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }

    // ✅ Create or update review (unique per user + product)
    const review = await productReviewModel.findOneAndUpdate(
      { userId, productId },
      { rating, reviewText },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      message: "Review submitted successfully",
      data: review,
    };

};

export const getStoreProductReviewsService = async (
  productId: string,
  payload: { page?: number; limit?: number } = {},
  res: Response
) => {

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponseHandler(
        "Invalid product ID",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }

    const page = payload.page && payload.page > 0 ? payload.page : 1;
    const limit = payload.limit && payload.limit > 0 ? payload.limit : 10;
    const offset = (page - 1) * limit;

    // ✅ Fetch reviews
    const reviews = await productReviewModel
      .find({ productId })
      .populate("userId","-phoneNumber -email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // ✅ Aggregate average rating and total reviews
    const agg = await productReviewModel.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = agg[0]?.avgRating || 0;
    const totalReviews = agg[0]?.totalReviews || 0;

    return {
      success: true,
      message: "Reviews fetched successfully",
      data: {
        reviews,
        avgRating,
        totalReviews,
        page,
        limit,
      },
    };
};
