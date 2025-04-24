import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { storeProductModel } from "../../models/store-products/store-products-schema";

// Create Store Product
export const createStoreProductService = async (payload: any, res: Response) => {
  console.log('payload: ', payload);
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
  } catch (error) {
    console.error("Error creating store product:", error);
    return errorResponseHandler(
      "Failed to create store product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Get All Store Products
export const getAllStoreProductsService = async (payload: any) => {
  try {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Create a base query object
    const baseQuery: any = {};

 

    // Get search query from queryBuilder
    let { query: searchQuery, sort } = queryBuilder(payload, ["name", "shortDescription"]);

    // Merge the queries
    const query = { ...baseQuery, ...(Object.keys(searchQuery).length > 0 ? searchQuery : {}) };

    const totalProducts = await storeProductModel.countDocuments(query);
    const products = await storeProductModel
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit);

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

// Get Store Product by ID
export const getStoreProductByIdService = async (id: string, res: Response) => {
  try {
    const product = await storeProductModel.findById(id);

    if (!product) {
      return errorResponseHandler("Store product not found", httpStatusCode.NOT_FOUND, res);
    }

    return {
      success: true,
      message: "Store product retrieved successfully",
      data: product
    };
  } catch (error) {
    console.error("Error fetching store product:", error);
    return errorResponseHandler(
      "Failed to retrieve store product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
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
export const deleteStoreProductService = async (id: string, res: Response) => {
  try {
    const product = await storeProductModel.findById(id);

    if (!product) {
      return errorResponseHandler("Store product not found", httpStatusCode.NOT_FOUND, res);
    }

    await storeProductModel.findByIdAndDelete(id);

    return {
      success: true,
      message: "Store product deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting store product:", error);
    return errorResponseHandler(
      "Failed to delete store product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};
