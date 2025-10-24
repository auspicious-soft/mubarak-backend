import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
  createStoreProductService,
  getAllStoreProductsService,
  getStoreProductByIdService,
  updateStoreProductService,
  deleteStoreProductService,
  getStoreProductsByStoreIdForAdminService,
  getAllStoreProductsForAdminService,
  getStoreProductByIdForAdminService
} from "../../services/store-products/store-products-service";

// Create Store Product
export const createStoreProduct = async (req: Request, res: Response) => {
  try {
    const response = await createStoreProductService(req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get All Store Products
export const getAllStoreProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await getAllStoreProductsService(userId,req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getAllStoreProductsForAdmin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await getAllStoreProductsForAdminService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
 
// Get Store Product by ID
export const getStoreProductById = async (req: Request, res: Response) => {
  try {
   const role = req.headers.role?.toString().toLowerCase();
    const userId = role === "guest" ? null  : (req as any).user?.id ;
    const response = await getStoreProductByIdService(req.params.id,userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update Store Product
export const updateStoreProduct = async (req: Request, res: Response) => {
  try {
    const response = await updateStoreProductService(req.params.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Delete Store Product
export const deleteStoreProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
        const role = (req as any).user?.role;
    const response = await deleteStoreProductService(req.params.id,userId,role, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Admin: Get Products by Store ID
export const getStoreProductsByStoreIdForAdmin = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.storeId;
    
    if (!storeId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Store ID is required"
      });
    }
      const role = req.headers.role?.toString().toLowerCase();
    const userId = role === "guest" ? null  : (req as any).user?.id ;
    const response = await getStoreProductsByStoreIdForAdminService(storeId, req.query,userId);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

export const getStoreProductByIdForAdmin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await getStoreProductByIdForAdminService(req.params.id,userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
