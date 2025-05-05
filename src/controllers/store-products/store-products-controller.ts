import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
  createStoreProductService,
  getAllStoreProductsService,
  getStoreProductByIdService,
  updateStoreProductService,
  deleteStoreProductService
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
    const response = await getAllStoreProductsService(req.query);
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
    const response = await getStoreProductByIdService(req.params.id, res);
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
    const response = await deleteStoreProductService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
