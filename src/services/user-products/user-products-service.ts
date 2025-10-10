import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { userProductModel } from "../../models/user-products/user-products-schema";
import { wishlistModel } from "../../models/wishlist/wishlist-schema";
import mongoose from "mongoose";

// Create a new user product
export const createUserProductService = async (payload: any, userId: string, res: Response) => {
  const productData = {
    ...payload,
    userId
  };

  const product = await userProductModel.create(productData);

  return {
    success: true,
    message: "Product created successfully",
    data: product
  };
};

export const getAllUserProductsService = async (query: any, userId: string) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  let { query: searchQuery, sort } = queryBuilder(query, ["productName"]) as { 
    query: { [key: string]: any; price?: { $gte?: number; $lte?: number } }, 
    sort: any 
  };

  // Exclude current user's products
  if (userId) {
    searchQuery.userId = { $ne: userId };
  }

  // Handle price filtering
  if (query.minPrice || query.maxPrice) {
    searchQuery.price = {};
    if (query.minPrice) searchQuery.price.$gte = parseFloat(query.minPrice as string);
    if (query.maxPrice) searchQuery.price.$lte = parseFloat(query.maxPrice as string);
  }

  // Handle sorting
  if (query.sortBy) {
    switch (query.sortBy) {
      case "latest":
        sort = { createdAt: -1 };
        break;
      case "priceLowToHigh":
        sort = { price: 1 };
        break;
      case "priceHighToLow":
        sort = { price: -1 };
        break;
      case "alphaAsc":
        sort = { productName: 1 };
        break;
      case "alphaDesc":
        sort = { productName: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  } else {
    sort = Object.keys(sort).length > 0 ? sort : { createdAt: -1 };
  }

  // Get total + paginated products
  const totalProducts = await userProductModel.countDocuments(searchQuery);
  const products = await userProductModel
    .find(searchQuery)
    .sort(sort)
    .collation({ locale: "en", strength: 2 })
    .skip(offset)
    .limit(limit)
    .populate("userId");

  // Fetch wishlist for current user
  let whitelistedProductIds: mongoose.Types.ObjectId[] = [];
  if (userId) {
    const wishlist = await wishlistModel.find({
      userId,
      productType: "userProduct",
      productId: { $in: products.map((p) => p._id) },
    });
    whitelistedProductIds = wishlist.map((w) => w.productId);
  }

  // Add isWhitelisted key
  const productsWithWishlist = products.map((p) => ({
    ...p.toObject(),
    isWhitelisted: whitelistedProductIds.some((id) => id.equals(p._id)),
  }));

  return {
    success: true,
    message: "Products retrieved successfully",
    data: {
      products: productsWithWishlist,
      page,
      limit,
      total: totalProducts,
    },
  };
};

// export const getAllUserProductsService = async (query: any) => {
//   const page = parseInt(query.page as string) || 1;
//   const limit = parseInt(query.limit as string) || 10;
//   const offset = (page - 1) * limit;

//   let { query: searchQuery, sort } = queryBuilder(query, ["productName"]) as { query: { [key: string]: any; price?: { $gte?: number; $lte?: number } }, sort: any };

//   if (query.minPrice || query.maxPrice) {
//     searchQuery.price = {};
//     if (query.minPrice) {
//       searchQuery.price.$gte = parseFloat(query.minPrice as string);
//     }
//     if (query.maxPrice) {
//       searchQuery.price.$lte = parseFloat(query.maxPrice as string);
//     }
//   }

//   const totalProducts = await userProductModel.countDocuments(searchQuery);
//   const products = await userProductModel
//     .find(searchQuery)
//     .sort(sort)
//     .skip(offset)
//     .limit(limit);

//   return {
//     success: true,
//     message: "Products retrieved successfully",
//     data: {
//       products,
//       page,
//       limit,
//       total: totalProducts
//     }
//   };
// };

// Get user products by user ID
export const getUserProductsByUserIdService = async ( userId: string, payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10;
  const offset = (page - 1) * limit;
  let { query } = queryBuilder(payload, ["productName"]);

  const totalProducts = await userProductModel.countDocuments({userId,...query});
  const products = await userProductModel
    .find({userId,...query})
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
};

// Get product by ID
export const getUserProductByIdService = async (productId: string, currentUserId: string, res: Response) => {
  const product = await userProductModel.findById(productId).populate("userId");

  if (!product) {
    return errorResponseHandler("Product not found", httpStatusCode.NOT_FOUND, res);
  }

  // ✅ Check if current logged-in user has whitelisted this product
  let isWhitelisted = false;
  if (currentUserId) {
    const wishlistEntry = await wishlistModel.findOne({
      userId: currentUserId,
      productType: "userProduct",
      productId: product._id,
    });
    isWhitelisted = !!wishlistEntry;
  }

  // ✅ Fetch related products added by the same owner (exclude current product)
  const relatedProducts = await userProductModel
    .find({
      userId: product.userId._id,
      _id: { $ne: product._id },
    })
    .limit(10);

  // ✅ Check wishlist status for related products for current logged-in user
  let whitelistedRelatedIds: mongoose.Types.ObjectId[] = [];
  if (currentUserId && relatedProducts.length > 0) {
    const relatedWishlist = await wishlistModel.find({
      userId: currentUserId,
      productType: "userProduct",
      productId: { $in: relatedProducts.map((p) => p._id) },
    });
    whitelistedRelatedIds = relatedWishlist.map((w) => w.productId);
  }

  const relatedProductsWithWishlist = relatedProducts.map((p) => ({
    ...p.toObject(),
    isWhitelisted: whitelistedRelatedIds.some((id) => id.equals(p._id)),
  }));

  return {
    success: true,
    message: "Product retrieved successfully",
    data: {
      ...product.toObject(),
      isWhitelisted,
      relatedProducts: relatedProductsWithWishlist,
    },
  };
};

// Update product
export const updateUserProductService = async (productId: string, payload: any, userId: string, res: Response) => {
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
};

// Delete product
export const deleteUserProductService = async (productId: string, res: Response) => {
  // Check if product exists and belongs to the user
  const product = await userProductModel.findOne({ _id: productId });

  if (!product) {
    return errorResponseHandler("Product not found", httpStatusCode.NOT_FOUND, res);
  }

  // Delete the product
  await userProductModel.findByIdAndDelete(productId);

  return {
    success: true,
    message: "Product deleted successfully"
  };
};

// Update product status
export const updateUserProductStatusService = async (productId: string, status: string, userId: string, res: Response) => {
  // Check if product exists and belongs to the user
  const product = await userProductModel.findOne({ _id: productId, userId });

  if (!product) {
    return errorResponseHandler("Product not found or you don't have permission to update it", httpStatusCode.NOT_FOUND, res);
  }

  // Update the product with the new status
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
};
export const getAllUserProductsForAdminService = async (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  let { query: searchQuery, sort } = queryBuilder(query, ["productName"]) as { 
    query: { [key: string]: any; price?: { $gte?: number; $lte?: number } }, 
    sort: any 
  };


  // ✅ Get total + paginated products
  const totalProducts = await userProductModel.countDocuments(searchQuery);
  const products = await userProductModel
    .find(searchQuery)
    .sort(sort)
    .collation({ locale: "en", strength: 2 })
    .skip(offset)
    .limit(limit)
    .populate("userId");

  return {
    success: true,
    message: "Products retrieved successfully",
    data: {
      products,
      page,
      limit,
      total: totalProducts,
    },
  };
};