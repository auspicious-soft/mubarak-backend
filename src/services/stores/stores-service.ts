import { Response } from "express";
import { storeModel } from "../../models/store/store-schema";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import bcrypt from "bcryptjs";
import { queryBuilder } from "../../utils";

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
 //TODO- return Store rating,Products sold and count of Products listed
  let { query, sort } = queryBuilder(payload, ["storeName", "ownerName", "email"]);

  const totalStores = await storeModel.countDocuments(query);
  const stores = await storeModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-password");

  return {
    success: true,
    message: "Stores retrieved successfully",
    data: {
      stores,
      page,
      limit,
      total: totalStores
    }
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

  const updatedStore = await storeModel
    .findByIdAndUpdate(id, payload, { new: true })
    .select("-password");

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