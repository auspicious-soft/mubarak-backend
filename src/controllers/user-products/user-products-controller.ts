import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import {
  createUserProductService,
  getAllUserProductsService,
  getUserProductsByUserIdService,
  getUserProductByIdService,
  updateUserProductService,
  deleteUserProductService,
  updateUserProductStatusService
} from "../../services/user-products/user-products-service";

// Create a new user product
export const createUserProduct = async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated user (assuming it's set in req.user by auth middleware)
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const response = await createUserProductService(req.body, userId, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get all user products
export const getAllUserProducts = async (req: Request, res: Response) => {
  try {
    const response = await getAllUserProductsService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get user products by user ID
export const getUserProductsByUserId = async (req: Request, res: Response) => {
  try {
    //TODO - userID by token
    const userId = req.params.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required"
      });
    }

    const response = await getUserProductsByUserIdService(userId, req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get product by ID
export const getUserProductById = async (req: Request, res: Response) => {
  try {
    const response = await getUserProductByIdService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update product
export const updateUserProduct = async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated user
    // const userId = (req as any).user?.id || req.body.userId;
  const userId = "60d5f3f5c7b8e1234567890a"
    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const response = await updateUserProductService(req.params.id, req.body, userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Delete product
export const deleteUserProduct = async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated user
    // const userId = (req as any).user?.id || req.body.userId;

    // if (!userId) {
    //   return res.status(httpStatusCode.UNAUTHORIZED).json({
    //     success: false,
    //     message: "User not authenticated"
    //   });
    // }

    const response = await deleteUserProductService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update product status
export const updateUserProductStatus = async (req: Request, res: Response) => {
  try {
    // Get userId from authenticated user
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Status is required"
      });
    }

    const response = await updateUserProductStatusService(req.params.id, status, userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
