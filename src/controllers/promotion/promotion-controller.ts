import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
  createPromotionService,
  getAllPromotionsService,
  getPromotionByIdService,
  updatePromotionService,
  deletePromotionService
} from "../../services/promotion/promotion-service";

// Create Promotion
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const response = await createPromotionService(req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get All Promotions
export const getAllPromotions = async (req: Request, res: Response) => {
  try {
    const response = await getAllPromotionsService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get Promotion by ID
export const getPromotionById = async (req: Request, res: Response) => {
  try {
    const response = await getPromotionByIdService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update Promotion
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const response = await updatePromotionService(req.params.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Delete Promotion
export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const response = await deletePromotionService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
