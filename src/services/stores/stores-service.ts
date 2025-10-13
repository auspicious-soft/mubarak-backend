import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import bcrypt from "bcryptjs";
import { queryBuilder } from "../../utils";
import { storeModel } from "../../models/stores/stores-schema";
import { productReviewModel } from "../../models/review/review-schema";
import { storeProductModel } from "../../models/store-products/store-products-schema";

// Create Store
export const createStoreService = async (payload: any, res: Response) => {
  const { email, phoneNumber } = payload;

  // Check if store already exists
  const existingStore = await storeModel.findOne({ 
    $or: [{ email }, { phoneNumber }] 
  });
  
  if (existingStore) {
    return errorResponseHandler(
      "Store with this email or phone number already exists",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Hash password
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const store = await storeModel.create(payload);
  const storeObject = store.toObject();

  return {
    success: true,
    message: "Store created successfully",
    data: storeObject
  };
};

// Get All Stores
export const getAllStoresService = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10;
  const offset = (page - 1) * limit;

  // ✅ Support search by name, ownerName, or email
  let { query, sort } = queryBuilder(payload, ["storeName", "ownerName", "email"]);

  // ✅ Fetch total count
  const totalStores = await storeModel.countDocuments(query);

  // ✅ Fetch stores (with pagination + sort)
  const stores = await storeModel
    .find(query)
    .sort({createdAt: -1})
    .skip(offset)
    .limit(limit)
    .select("-password")
    .lean();

  if (stores.length === 0) {
    return {
      success: true,
      message: "No stores found",
      data: { stores: [], page, limit, total: 0 },
    };
  }

  // ✅ Extract store IDs
  const storeIds = stores.map((s) => s._id);

  // ✅ Fetch products for all stores (to count & link reviews)
  const storeProducts = await storeProductModel
    .find({ storeId: { $in: storeIds } })
    .select("_id storeId")
    .lean();

  // Build map storeId → [productIds]
  const storeToProductsMap = new Map<string, string[]>();
  storeProducts.forEach((p) => {
    const key = p.storeId.toString();
    if (!storeToProductsMap.has(key)) storeToProductsMap.set(key, []);
    storeToProductsMap.get(key)!.push(p._id.toString());
  });

  // ✅ Fetch ratings for all products
  const allProductIds = storeProducts.map((p) => p._id);
  const reviewAgg = await productReviewModel.aggregate([
    { $match: { productId: { $in: allProductIds } } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // Map productId → avgRating
  const productRatingMap = new Map<string, number>();
  reviewAgg.forEach((r) => productRatingMap.set(r._id.toString(), r.avgRating));

  // ✅ Compute store-level average rating
  const storeRatings = new Map<string, number>();
  storeToProductsMap.forEach((productIds, storeId) => {
    const ratings = productIds
      .map((pid) => productRatingMap.get(pid))
      .filter((r): r is number => typeof r === "number");
    if (ratings.length > 0) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      storeRatings.set(storeId, avg);
    } else {
      storeRatings.set(storeId, 0);
    }
  });

  // ✅ Merge all info
  const storesWithExtraData = stores.map((store) => {
    const productIds = storeToProductsMap.get(store._id.toString()) || [];
    const avgRating = storeRatings.get(store._id.toString()) || 0;

    return {
      ...store,
      listedProducts: productIds.length, // total number of listed products
      averageRating: Number(avgRating.toFixed(1)), // average store rating
    };
  });

  return {
    success: true,
    message: "Stores retrieved successfully",
    data: {
      stores: storesWithExtraData,
      page,
      limit,
      total: totalStores,
    },
  };
};

// Get Store by ID
export const getStoreByIdService = async (id: string, res: Response) => {
  const store = await storeModel.findById(id).select("-password");
  //TODO: return Total Revenue Generated, Most Sold Product,Total Products Listed,Products Sold and list of products
  if (!store) {
    return errorResponseHandler("Store not found", httpStatusCode.NOT_FOUND, res);
  }

  return {
    success: true,
    message: "Store retrieved successfully",
    data: store
  };
};
export const getStoreProfileService = async (id: string, res: Response) => {
  //TODO- get store id by the token
  const store = await storeModel.findById(id)
  if (!store) {
    return errorResponseHandler("Store not found", httpStatusCode.NOT_FOUND, res);
  }

  return {
    success: true,
    message: "Store retrieved successfully",
    data: store
  };
};

// Update Store
export const updateStoreService = async (id: string, payload: any, res: Response) => {
  const store = await storeModel.findById(id);
  
  if (!store) {
    return errorResponseHandler("Store not found", httpStatusCode.NOT_FOUND, res);
  }

  // If updating password, hash it
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const updatedStore = await storeModel.findByIdAndUpdate(id, payload, { new: true });

  return {
    success: true,
    message: "Store updated successfully",
    data: updatedStore
  };
};

// Delete Store
export const deleteStoreService = async (id: string, res: Response) => {
  const store = await storeModel.findById(id);
  
  if (!store) {
    return errorResponseHandler("Store not found", httpStatusCode.NOT_FOUND, res);
  }

  await storeModel.findByIdAndDelete(id);

  return {
    success: true,
    message: "Store deleted successfully"
  };
};