import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { promotionsModel } from "../../models/promotion/promotion-schema";

// Create Promotion
export const createPromotionService = async (payload: any, res: Response) => {
  try {
    const { storeName, title, banner } = payload;

    // Check if storeName is provided
    if (!storeName) {
      return errorResponseHandler(
        "Store ID is required",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }

    // Create the promotion
    const promotion = await promotionsModel.create(payload);

    return {
      success: true,
      message: "Promotion created successfully",
      data: promotion
    };
  } catch (error) {
    console.error("Error creating promotion:", error);
    return errorResponseHandler(
      "Failed to create promotion",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Get All Promotions
export const getAllPromotionsService = async (payload: any) => {
  try {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Create a base query object
    const baseQuery: any = {};

    // Add store filter if provided
    if (payload.storeName) {
      baseQuery.storeName = payload.storeName;
    }

    // Get search query from queryBuilder
    let { query: searchQuery, sort } = queryBuilder(payload, ["title"]);

    // Merge the queries
    const query = { ...baseQuery, ...(Object.keys(searchQuery).length > 0 ? searchQuery : {}) };

    const totalPromotions = await promotionsModel.countDocuments(query);
    const promotions = await promotionsModel
      .find(query)
      .populate('storeName', 'storeName email')
      .sort({createdAt: -1})
      .skip(offset)
      .limit(limit);

    return {
      success: true,
      message: "Promotions retrieved successfully",
      data: {
        promotions,
        page,
        limit,
        total: totalPromotions
      }
    };
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
};

// Get Promotion by ID
export const getPromotionByIdService = async (id: string, res: Response) => {
  try {
    const promotion = await promotionsModel.findById(id).populate('storeName', 'storeName email');

    if (!promotion) {
      return errorResponseHandler("Promotion not found", httpStatusCode.NOT_FOUND, res);
    }

    return {
      success: true,
      message: "Promotion retrieved successfully",
      data: promotion
    };
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return errorResponseHandler(
      "Failed to retrieve promotion",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Update Promotion
export const updatePromotionService = async (id: string, payload: any, res: Response) => {
  try {
    const promotion = await promotionsModel.findById(id);

    if (!promotion) {
      return errorResponseHandler("Promotion not found", httpStatusCode.NOT_FOUND, res);
    }

    // Update the promotion
    const updatedPromotion = await promotionsModel.findByIdAndUpdate(
      id,
      payload,
      { new: true }
    ).populate('storeName', 'storeName email');

    return {
      success: true,
      message: "Promotion updated successfully",
      data: updatedPromotion
    };
  } catch (error) {
    console.error("Error updating promotion:", error);
    return errorResponseHandler(
      "Failed to update promotion",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Delete Promotion
export const deletePromotionService = async (id: string, res: Response) => {
  try {
    const promotion = await promotionsModel.findById(id);

    if (!promotion) {
      return errorResponseHandler("Promotion not found", httpStatusCode.NOT_FOUND, res);
    }

    await promotionsModel.findByIdAndDelete(id);

    return {
      success: true,
      message: "Promotion deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return errorResponseHandler(
      "Failed to delete promotion",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};
