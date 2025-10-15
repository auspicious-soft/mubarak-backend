import { Request, Response } from "express";

import { errorParser, errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
  createStoreService,
  getAllStoresService,
  getStoreByIdService,
  updateStoreService,
  deleteStoreService,
  getStoreProfileService,
  getStoreNotificationsService,
  markAllNotificationsAsReadService
} from "../../services/stores/stores-service";


// Create Store
export const createStore = async (req: Request, res: Response) => {
  try {
    const response = await createStoreService(req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get All Stores
export const getAllStores = async (req: Request, res: Response) => {
  try {
    const response = await getAllStoresService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get Store by ID
export const getStoreById = async (req: Request, res: Response) => {
  try {
    const response = await getStoreByIdService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getStoreProfile = async (req: Request, res: Response) => {
  try {
    const response = await getStoreProfileService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getStoreProfileByToken = async (req: Request, res: Response) => {
  try {
    const response = await getStoreProfileService(req.user.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update Store
export const updateStore = async (req: Request, res: Response) => {
  try {
    const response = await updateStoreService(req.params.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const updateStoreByToken = async (req: Request, res: Response) => {
  try {
    const response = await updateStoreService(req.user.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Delete Store
export const deleteStore = async (req: Request, res: Response) => {
  try {
    const response = await deleteStoreService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getStoreNotifications = async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user?.id;
    
    if (!storeId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Store ID is required"
      });
    }
    const response = await getStoreNotificationsService(storeId, req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user?.id;
    
    if (!storeId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Store ID is required"
      });
    }
    const response = await markAllNotificationsAsReadService(storeId);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
