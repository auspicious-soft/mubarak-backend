import { Request, Response } from "express";
import {  getUserWishlistService, removeFromWishlistService, toggleWishlistService } from "../../services/wishlist/wishlist-service";
import { httpStatusCode } from "../../lib/constant";
import { errorParser } from "../../lib/errors/error-response-handler";

export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // from auth middleware
    const { productId, productType } = req.body;

    if (!userId || !productId || !productType) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const response = await toggleWishlistService(userId, productId, productType);
    return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
      const { code, message } = errorParser(error);
      return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: message || "An error occurred" });
    }
};


export const getUserWishlistController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
     if (!userId) {
              return res.status(httpStatusCode.BAD_REQUEST).json({
                success: false,
                message: "User ID is required"
              });
            }
    const wishlist = await getUserWishlistService(userId);
    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: wishlist,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeFromWishlistController = async (req: Request, res: Response) => {
  try {
    const { productId, productType } = req.body;
    const userId = (req as any).user.id;
      if (!userId) {
              return res.status(httpStatusCode.BAD_REQUEST).json({
                success: false,
                message: "User ID is required"
              });
            }
    const removed = await removeFromWishlistService(userId, productId, productType);
    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: removed,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
