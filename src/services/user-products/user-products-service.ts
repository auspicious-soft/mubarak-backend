import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { userProductModel } from "../../models/user-products/user-products-schema";

// Create a new user product
export const createUserProductService = async (payload: any, userId: string, res: Response) => {
  try {
    // Add userId to the payload
    const productData = {
      ...payload,
      userId
    };

    // Create the product
    const product = await userProductModel.create(productData);

    return {
      success: true,
      message: "Product created successfully",
      data: product
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return errorResponseHandler(
      "Failed to create product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Get all user products (with pagination and filtering)
export const getAllUserProductsService = async (query: any) => {
  try {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get search query from queryBuilder
    let { query: searchQuery, sort } = queryBuilder(query, ["title", "description"]);

    // Add status filter if provided
    if (query.status) {
      searchQuery.status = query.status;
    }

    // Add category filter if provided
    if (query.category) {
      searchQuery.category = query.category;
    }

    // Add price range filter if provided
    if (query.minPrice || query.maxPrice) {
      searchQuery.price = {};
      if (query.minPrice) {
        searchQuery.price.$gte = parseFloat(query.minPrice as string);
      }
      if (query.maxPrice) {
        searchQuery.price.$lte = parseFloat(query.maxPrice as string);
      }
    }

    const totalProducts = await userProductModel.countDocuments(searchQuery);
    const products = await userProductModel
      .find(searchQuery)
      .sort(sort)
      .skip(offset)
      .limit(limit);

    return {
      success: true,
      message: "Products retrieved successfully",
      data: {
        products,
        page,
        limit,
        total: totalProducts
      }
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Get user products by user ID
export const getUserProductsByUserIdService = async (userId: string, query: any) => {
  try {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Add userId to the search query
    const searchQuery = { userId };

    // Add status filter if provided
    if (query.status) {
      searchQuery.status = query.status;
    }

    const totalProducts = await userProductModel.countDocuments(searchQuery);
    const products = await userProductModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return {
      success: true,
      message: "User products retrieved successfully",
      data: {
        products,
        page,
        limit,
        total: totalProducts
      }
    };
  } catch (error) {
    console.error("Error fetching user products:", error);
    throw error;
  }
};

// Get product by ID
export const getUserProductByIdService = async (productId: string, res: Response) => {
  try {
    const product = await userProductModel.findById(productId);

    if (!product) {
      return errorResponseHandler("Product not found", httpStatusCode.NOT_FOUND, res);
    }

    return {
      success: true,
      message: "Product retrieved successfully",
      data: product
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return errorResponseHandler(
      "Failed to retrieve product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Update product
export const updateUserProductService = async (productId: string, payload: any, userId: string, res: Response) => {
  try {
    // Check if product exists and belongs to the user
    const product = await userProductModel.findOne({ _id: productId, userId });
    
    if (!product) {
      return errorResponseHandler("Product not found or you don't have permission to update it", httpStatusCode.NOT_FOUND, res);
    }

    // Update the product
    const updatedProduct = await userProductModel.findByIdAndUpdate(
      productId,
      { ...payload, updatedAt: new Date() },
      { new: true }
    );

    return {
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return errorResponseHandler(
      "Failed to update product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Delete product
export const deleteUserProductService = async (productId: string, userId: string, res: Response) => {
  try {
    // Check if product exists and belongs to the user
    const product = await userProductModel.findOne({ _id: productId, userId });
    
    if (!product) {
      return errorResponseHandler("Product not found or you don't have permission to delete it", httpStatusCode.NOT_FOUND, res);
    }

    // Delete the product
    await userProductModel.findByIdAndDelete(productId);

    return {
      success: true,
      message: "Product deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return errorResponseHandler(
      "Failed to delete product",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

// Update product status
export const updateUserProductStatusService = async (productId: string, status: string, userId: string, res: Response) => {
  try {
    // Check if product exists and belongs to the user
    const product = await userProductModel.findOne({ _id: productId, userId });
    
    if (!product) {
      return errorResponseHandler("Product not found or you don't have permission to update it", httpStatusCode.NOT_FOUND, res);
    }

    // Validate status
    const validStatuses = ['active', 'sold', 'pending', 'inactive'];
    if (!validStatuses.includes(status)) {
      return errorResponseHandler("Invalid status value", httpStatusCode.BAD_REQUEST, res);
    }

    // Update the product status
    const updatedProduct = await userProductModel.findByIdAndUpdate(
      productId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    return {
      success: true,
      message: "Product status updated successfully",
      data: updatedProduct
    };
  } catch (error) {
    console.error("Error updating product status:", error);
    return errorResponseHandler(
      "Failed to update product status",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};
