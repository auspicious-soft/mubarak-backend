import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { storeProductModel } from "../../models/store-products/store-products-schema";

// Create Store Product
export const createStoreProductService = async (payload: any, res: Response) => {
  try {
    const {  storeId } = payload;
    // Check if storeId is provided
    if (!storeId) {
      return errorResponseHandler(
        "Store ID is required",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }
    const storeProduct = await storeProductModel.create(payload);
    return {
      success: true,
      message: "Store product created successfully",
      data: storeProduct
    };
  } catch (error:any) {
    console.error("Error creating store product:", error);
    return errorResponseHandler(
      error.message || "Failed to create store product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Get All Store Products
export const getAllStoreProductsService = async (storeId:any,payload: any) => {
  try {
    const page = Number(payload.page) > 0 ? Number(payload.page) : 1;
    const limit = Number(payload.limit) > 0 ? Number(payload.limit) : 10;
    const offset = (page - 1) * limit;
    console.log('storeId:', storeId);

    // Base query
    const baseQuery: any = {};
    if (storeId) {
      baseQuery.storeId = storeId;
    }

    // Build search and sort
    const { query: searchQuery, sort } = queryBuilder(payload, [
      "name",
      "shortDescription",
    ]);

    // Merge base + search
    const query = { ...baseQuery, ...searchQuery };

    const totalProducts = await storeProductModel.countDocuments(query);

    const products = await storeProductModel
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .lean();

    return {
      success: true,
      message: "Store products retrieved successfully",
      data: {
        products,
        page,
        limit,
        total: totalProducts,
      },
    };
  } catch (error) {
    console.error("Error fetching store products:", error);
    return {
      success: false,
      message: "Failed to retrieve store products",
      data: null,
    };
  }
};

// Get Store Product by ID
export const getStoreProductByIdService = async (id: string, res: Response) => {
    const product = await storeProductModel.findById(id).populate('storeId').lean();

    if (!product) {
      return errorResponseHandler("Store product not found", httpStatusCode.NOT_FOUND, res);
    }

    return {
      success: true,
      message: "Store product retrieved successfully",
      data: product
    };

};

// Update Store Product
export const updateStoreProductService = async (id: string, payload: any, res: Response) => {
  try {
    const product = await storeProductModel.findById(id);

    if (!product) {
      return errorResponseHandler("Store product not found", httpStatusCode.NOT_FOUND, res);
    }

    // If updating identifier, check if it already exists
    // if (payload.identifier && payload.identifier !== product.identifier) {
    //   const existingProduct = await storeProductModel.findOne({
    //     _id: { $ne: id } // Exclude current product
    //   });

    //   if (existingProduct) {
    //     return errorResponseHandler(
    //       "Product with this identifier already exists",
    //       httpStatusCode.BAD_REQUEST,
    //       res
    //     );
    //   }
    // }

    // Update the updatedAt field
    payload.updatedAt = Date.now();

    const updatedProduct = await storeProductModel.findByIdAndUpdate(
      id,
      payload,
      { new: true }
    );

    return {
      success: true,
      message: "Store product updated successfully",
      data: updatedProduct
    };
  } catch (error) {
    console.error("Error updating store product:", error);
    return errorResponseHandler(
      "Failed to update store product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Delete Store Product
export const deleteStoreProductService = async (
  id: string,
  storeId: string,
  res: Response
) => {
    const product = await storeProductModel.findById(id).lean();
    if (!product) {
      return errorResponseHandler(
        "Store product not found",
        httpStatusCode.NOT_FOUND,
        res
      );
    }

    // Check store ownership
    if (product.storeId.toString() !== storeId.toString()) {
      return errorResponseHandler(
        "You are not authorized to delete this product",
        httpStatusCode.FORBIDDEN,
        res
      );
    }

    await storeProductModel.findByIdAndDelete(id);

    return {
      success: true,
      message: "Store product deleted successfully",
    };
};


// Admin: Get Products by Store ID
export const getStoreProductsByStoreIdForAdminService = async (storeId: string, payload: any) => {
  try {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Create query with storeId filter
    let { query: searchQuery, sort } = queryBuilder(payload, ["name", "shortDescription"]);
    
    // Combine with storeId
    const query = { storeId, ...(Object.keys(searchQuery).length > 0 ? searchQuery : {}) };

    const totalProducts = await storeProductModel.countDocuments(query);
    const products = await storeProductModel
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('storeId');

    return {
      success: true,
      message: "Store products retrieved successfully",
      data: {
        products,
        page,
        limit,
        total: totalProducts
      }
    };
  } catch (error) {
    console.error("Error fetching store products:", error);
    return {
      success: false,
      message: "Failed to retrieve store products",
      data: null
    };
  }
};
