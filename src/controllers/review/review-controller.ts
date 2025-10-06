import { Request, Response } from "express";
import { httpStatusCode } from "../../lib/constant";
import { addStoreProductReviewService, getStoreProductReviewsService } from "../../services/review/review-service";
import { errorParser } from "../../lib/errors/error-response-handler";

// ✅ Add a review
export const addStoreProductReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const payload = req.body;

    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const response = await addStoreProductReviewService(userId, payload,res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// ✅ Get reviews for a product
export const getStoreProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const payload = req.query;

    if (!productId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const response = await getStoreProductReviewsService(productId, payload as any,res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
