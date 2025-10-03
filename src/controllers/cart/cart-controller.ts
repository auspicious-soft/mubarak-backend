import { Request, Response } from 'express';
import { httpStatusCode } from '../../lib/constant';
import { addToCartService, clearCartService, getCartService, removeCartItemService, updateCartItemService } from '../../services/cart/cart-service';
import { errorParser } from '../../lib/errors/error-response-handler';

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const { storeProduct, selectedPriceDetail, quantity } = req.body;
    
    if (!storeProduct || !selectedPriceDetail) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Store product and price detail are required"
      });
    }

    const response = await addToCartService(userId, {
      storeProduct,
      selectedPriceDetail,
      quantity: quantity || 1
    }, res);
    
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get user cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const response = await getCartService(userId,res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId || !quantity) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Item ID and quantity are required"
      });
    }

    const response = await updateCartItemService(userId, itemId, quantity,res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Remove item from cart
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Item ID is required"
      });
    }

    const response = await removeCartItemService(userId, itemId, quantity, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const response = await clearCartService(userId,res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};