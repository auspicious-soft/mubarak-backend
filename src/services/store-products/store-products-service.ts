import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { storeProductModel } from "../../models/store-products/store-products-schema";
import { wishlistModel } from "../../models/wishlist/wishlist-schema";
import { cartModel } from "../../models/cart/cart-schema";
import { productReviewModel } from "../../models/review/review-schema";
import { Types } from "mongoose";

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
      .sort({createdAt: -1})
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
export const getStoreProductByIdService = async (
  id: string,
  userId: string,
  res: Response
) => {
  const product = await storeProductModel
    .findById(id)
    .populate("storeId")
    .lean();

  if (!product) {
    return errorResponseHandler(
      "Store product not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // ✅ Check if this product is in user's wishlist
  let isWishlisted = false;
  if (userId) {
    const wishlistEntry = await wishlistModel.findOne({
      userId,
      productId: id,
      productType: "storeProduct",
    });
    isWishlisted = !!wishlistEntry;
  }

  // ✅ Check if this product is in user's cart
  let isInCart = false;
  if (userId) {
    const cart = await cartModel.findOne({
      userId,
      "items.storeProduct": id, // check inside cart items
    });

    if (cart) {
      isInCart = true;
    }
  }

  return {
    success: true,
    message: "Store product retrieved successfully",
    data: {
      ...product,
      isWishlisted,
      isInCart, // 👈 new flag
    },
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
  role:string,
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
    if(role !=="admin" ) {
    if (product.storeId.toString() !== storeId.toString()) {
      return errorResponseHandler(
        "You are not authorized to delete this product",
        httpStatusCode.FORBIDDEN,
        res
      );
    }
  }

    await storeProductModel.findByIdAndDelete(id);

    return {
      success: true,
      message: "Store product deleted successfully",
    };
};


// Admin: Get Products by Store ID
export const getStoreProductsByStoreIdForAdminService = async (
  storeId: string, 
  payload: any, 
  userId: string | null  // ✅ Allow null for guest users
) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10;
  const offset = (page - 1) * limit;

  // Create query with storeId filter
  let { query: searchQuery, sort } = queryBuilder(payload, ["name", "shortDescription"]);
  
  // Combine with storeId
  const query = { storeId, ...(Object.keys(searchQuery).length > 0 ? searchQuery : {}) };

  const totalProducts = await storeProductModel.countDocuments(query);
  let products = await storeProductModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .populate('storeId')
    .lean();

  // ✅ Only fetch wishlist if user is authenticated
  let wishlistSet = new Set<string>();
  
  if (userId && Types.ObjectId.isValid(userId)) {
    try {
      const wishlist = await wishlistModel.find({ 
        userId: new Types.ObjectId(userId), 
        productType: "storeProduct", 
        productId: { $in: products.map(p => p._id) } 
      }).lean();

      wishlistSet = new Set(wishlist.map(w => w.productId.toString()));
    } catch (wishlistError) {
      console.error('Error fetching wishlist:', wishlistError);
      // Continue without wishlist data for guests
    }
  }
  
  // ✅ Map products with wishlist status
  products = products.map(product => ({
    ...product,
    isWishlisted: wishlistSet.has(product._id.toString())  // Will be false for guests
  }));

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
};
export const getAllStoreProductsForAdminService = async (payload: any) => {
  const page = Number(payload.page) > 0 ? Number(payload.page) : 1;
  const limit = Number(payload.limit) > 0 ? Number(payload.limit) : 10;
  const offset = (page - 1) * limit;

  // Base query
  const baseQuery: any = {};

  // Build search and sort
  const { query: searchQuery, sort } = queryBuilder(payload, [
    "name",
    "shortDescription",
  ]);

  // Merge base + search
  const query = { ...baseQuery, ...searchQuery };

  const totalProducts = await storeProductModel.countDocuments(query);

  // Fetch paginated products
  const products = await storeProductModel
    .find(query)
    .sort({createdAt: -1})
    .skip(offset)
    .limit(limit)
    .populate("storeId", "storeName")
    .lean();

  // Extract product IDs
  const productIds = products.map((p) => p._id);

  // Aggregate average ratings for these products
  const ratings = await productReviewModel.aggregate([
    { $match: { productId: { $in: productIds } } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  // Map ratings by productId for quick lookup
  const ratingMap = ratings.reduce((acc, r) => {
    acc[r._id.toString()] = {
      averageRating: Number(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
    return acc;
  }, {} as Record<string, { averageRating: number; totalReviews: number }>);

  // Attach average rating to each product
  const productsWithRatings = products.map((p) => ({
    ...p,
    averageRating: ratingMap[p._id.toString()]?.averageRating || 0,
    totalReviews: ratingMap[p._id.toString()]?.totalReviews || 0,
  }));

  return {
    success: true,
    message: "Store products retrieved successfully",
    data: {
      products: productsWithRatings,
      page,
      limit,
      total: totalProducts,
    },
  };
};

export const getStoreProductByIdForAdminService = async (
  id: string,
  userId: string,
  res: Response
) => {
  const product = await storeProductModel
    .findById(id)
    .populate("storeId")
    .lean();

  if (!product) {
    return errorResponseHandler(
      "Store product not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }
  const reviews = await productReviewModel.find({ productId: id }).populate("userId", "-phoneNumber").lean();


  return {
    success: true,
    message: "Store product retrieved successfully",
    data: {
      product,
      reviews
    },
  };
};