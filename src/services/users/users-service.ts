import { Response } from "express";
import bcrypt from "bcryptjs";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { usersModel } from "../../models/users/users-schema";
import {
  generatePasswordResetToken,
  getPasswordResetTokenByToken,
  generatePasswordResetTokenByPhone,
} from "../../utils/mails/token";
import { sendPasswordResetEmail } from "../../utils/mails/mail";
import { generateUserToken } from "../../utils/userAuth/signUpAuth";
import { passwordResetTokenModel } from "../../models/password-token-schema";
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms";
import { storeProductModel } from "../../models/store-products/store-products-schema";
import { storeModel } from "../../models/stores/stores-schema";
import { wishlistModel } from "../../models/wishlist/wishlist-schema";
import mongoose, { Types } from "mongoose";
import { productReviewModel } from "../../models/review/review-schema";
import { promotionsModel } from "../../models/promotion/promotion-schema";
interface PaginationParams {
  page?: number;
  limit?: number;
}
// Create User (Sign Up)
export const createUserService = async (payload: any, res: Response) => {
  let { email, phoneNumber } = payload;

  email =
    typeof email === "string" && email.trim() !== ""
      ? email.trim().toLowerCase()
      : undefined;

  if (!phoneNumber) {
    return errorResponseHandler(
      "Phone number is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return errorResponseHandler(
      "Invalid phone number format",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponseHandler(
        "Invalid email format",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }
  }

  const [existingUserByEmail, existingUserByPhone] = await Promise.all([
    email ? usersModel.findOne({ email }).lean() : null,
    usersModel.findOne({ phoneNumber }).lean(),
  ]);

  if (existingUserByEmail || existingUserByPhone) {
    if (existingUserByPhone && !existingUserByPhone.isVerified) {
      const otp = await generatePasswordResetTokenByPhone(phoneNumber);
      await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

      return {
        success: true,
        message: "OTP sent to your phone number for verification.",
        data: existingUserByPhone,
      };
    }

    let message = "User with ";
    if (existingUserByEmail && existingUserByPhone) {
      message += "this email and phone number already exists.";
    } else if (existingUserByEmail) {
      message += "this email already exists.";
    } else {
      message += "this phone number already exists.";
    }

    return errorResponseHandler(message, httpStatusCode.BAD_REQUEST, res);
  }

  // Create userData object without email if it's not provided
  const userData: any = {
    ...payload,
    isVerified: false,
  };

  // Only include email if it exists and is valid
  if (email) {
    userData.email = email;
  } else {
    // Completely remove email field instead of setting to null/undefined
    delete userData.email;
  }

  console.log("Creating user:", userData); // Debug log

  const user = await usersModel.create(userData);

  const otp = await generatePasswordResetTokenByPhone(phoneNumber);
  await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

  return {
    success: true,
    message: "OTP sent to your phone number for verification.",
    data: user.toObject(),
  };
};
// User Login
export const loginUserService = async (payload: any, res: Response) => {
  const { phoneNumber } = payload;

  if (!phoneNumber) {
    return errorResponseHandler(
      "Phone number is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Find user by phone number
  const user = await usersModel.findOne({ phoneNumber });

  if (!user) {
    // If user doesn't exist, create a new unverified user
    // return createUserService(payload, res);
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Generate OTP for verification
  const otp = await generatePasswordResetTokenByPhone(phoneNumber);

  // Send OTP via SMS
  await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

  const userObject = user.toObject();
  // @ts-ignore

  return {
    success: true,
    message: "OTP sent to your phone number for verification",
    data: userObject,
  };
};

// Verify OTP
export const verifyOtpService = async (payload: any, res: Response) => {
  const { phoneNumber, otp, fcmToken } = payload; // frontend sends fcmToken here

  if (!phoneNumber) {
    return errorResponseHandler(
      "Phone number is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Find OTP token
  const existingToken = await getPasswordResetTokenByToken(otp);
  if (!existingToken) {
    return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);
  }

  // Check expiration
  if (new Date(existingToken.expires) < new Date()) {
    return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);
  }

  // Check ownership
  if (existingToken.phoneNumber !== phoneNumber) {
    return errorResponseHandler(
      "Invalid OTP for this phone number",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Update user: mark verified AND add/update fcmToken
  const update: any = { isVerified: true };
  if (fcmToken) {
    update.$addToSet = { fcmToken }; // ✅ adds to array if not already present
  }

  const user = await usersModel.findOneAndUpdate({ phoneNumber }, update, {
    new: true,
  });

  if (!user) {
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Delete used OTP
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  // Generate JWT token
  const token = generateUserToken(user);

  return {
    success: true,
    message: "Phone number verified successfully",
    data: {
      user,
      token,
    },
  };
};

// Resend OTP
export const resendOtpService = async (payload: any, res: Response) => {
  const { phoneNumber } = payload;

  if (!phoneNumber) {
    return errorResponseHandler(
      "Phone number is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Check if user exists
  const user = await usersModel.findOne({ phoneNumber });

  if (!user) {
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Generate new OTP
  const otp = await generatePasswordResetTokenByPhone(phoneNumber);

  // Send OTP via SMS
  await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

  return {
    success: true,
    message: "OTP sent successfully to your phone number",
  };
};

// Get All Users
export const getAllUsersService = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 10;
  const offset = (page - 1) * limit;

  // Get search query from queryBuilder
  let { query, sort } = queryBuilder(payload, [
    "fullName",
    "email",
    "firstName",
    "lastName",
  ]);
  //TODO add lastest date of order

  const totalUsers = await usersModel.countDocuments(query);
  const users = await usersModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select("-password");

  return {
    success: true,
    message: "Users retrieved successfully",
    data: {
      users,
      page,
      limit,
      total: totalUsers,
    },
  };
};

// Get User by ID
export const getUserByIdService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id).select("-password");
  //TODO add orders
  //TODO: return Total Revenue Generated, Most Sold Product,Total Products Listed,Products Sold and list of products
  if (!user) {
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  return {
    success: true,
    message: "User retrieved successfully",
    data: user,
  };
};

// Update User
export const updateUserService = async (
  id: string,
  payload: any,
  res: Response
) => {
  const user = await usersModel.findById(id);

  if (!user) {
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // If updating password, hash it
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  // If updating email, set verification status to false
  if (payload.email && payload.email !== user.email) {
    payload.isVerified = false;
  }

  const updatedUser = await usersModel
    .findByIdAndUpdate(id, payload, { new: true })
    .select("-password");

  return {
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  };
};

// Delete User
export const deleteUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);

  if (!user) {
    return errorResponseHandler(
      "User not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  await usersModel.findByIdAndDelete(id);

  return {
    success: true,
    message: "User deleted successfully",
  };
};

export const getUserHomeService = async (
  userId: string,
  res: Response,
  pagination: PaginationParams = {},
  payload: any
) => {
  const { page = 1, limit = 10 } = pagination;
  const { minPrice, maxPrice, description, order, orderColumn } = payload;

  const { query: baseQuery, sort } = queryBuilder(
    { description, order, orderColumn },
    ["name", "shortDescription"]
  );

  const additionalFilters: any = {};

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceConditions: any = {};
    if (minPrice !== undefined) priceConditions.$gte = minPrice;
    if (maxPrice !== undefined) priceConditions.$lte = maxPrice;
    additionalFilters["priceDetails.price"] = priceConditions;
  }

  const finalQuery = { ...baseQuery, ...additionalFilters };
  let products;
  let totalProducts;

  if (description) {
    const aggregationPipeline: any[] = [
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: "$store" },
      {
        $match: {
          $and: [
            additionalFilters,
            {
              $or: [
                { name: { $regex: description, $options: "i" } },
                { shortDescription: { $regex: description, $options: "i" } },
                { "store.storeName": { $regex: description, $options: "i" } },
                { "store.ownerName": { $regex: description, $options: "i" } },
              ],
            },
          ],
        },
      },
      {
        $project: {
          "store.password": 0,
          "store.phoneNumber": 0,
          "store.email": 0,
          "store.role": 0,
        },
      },
    ];

    if (Object.keys(sort).length > 0) aggregationPipeline.push({ $sort: sort });
    else aggregationPipeline.push({ $sort: { createdAt: -1 } });

    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    const countResult = await storeProductModel.aggregate(countPipeline);
    totalProducts = countResult[0]?.total || 0;

    aggregationPipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    products = await storeProductModel.aggregate(aggregationPipeline);
    products = products.map((product) => ({
      ...product,
      storeId: product.store,
      store: undefined,
    }));
  } else {
    products = await storeProductModel
      .find(finalQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(Object.keys(sort).length > 0 ? sort : { createdAt: -1 })
      .populate("storeId", "-password -phoneNumber -email -role")
      .lean();

    totalProducts = await storeProductModel.countDocuments(finalQuery);
  }

  const totalPages = Math.ceil(totalProducts / limit);

  // ✅ Fetch wishlist if authenticated
  let wishlistProductIds = new Set<string>();
  if (userId) {
    const wishlistItems = await wishlistModel
      .find({
        userId: new Types.ObjectId(userId),
        productType: "storeProduct",
        productId: { $in: products.map((p) => p._id) },
      })
      .select("productId");

    wishlistProductIds = new Set(
      wishlistItems.map((item) => item.productId.toString())
    );
  }

  // ✅ Fetch ratings for all product IDs
  const productIds = products.map((p) => p._id);
  const ratingData = await productReviewModel.aggregate([
    { $match: { productId: { $in: productIds } } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap = new Map(
    ratingData.map((r) => [
      r._id.toString(),
      { averageRating: r.averageRating, totalReviews: r.totalReviews },
    ])
  );

  // ✅ Merge wishlist + rating info
  const productsWithExtras = products.map((product) => {
    const ratingInfo = ratingMap.get(product._id.toString()) || {
      averageRating: 0,
      totalReviews: 0,
    };
    return {
      ...product,
      isWishlisted: wishlistProductIds.has(product._id.toString()),
      averageRating: Number(ratingInfo.averageRating.toFixed(1)) || 0,
      totalReviews: ratingInfo.totalReviews || 0,
    };
  });

  // ✅ Fetch latest promotions
  const promotions = await promotionsModel
    .find({})
    .sort({ createdAt: -1 })
    .populate("storeName", "-password")
    .lean();

  return {
    success: true,
    message: "Home data fetched successfully",
    data: {
      products: productsWithExtras,
      promotions, // ✅ include promotions here
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  };
};

export const getUserHomeStoresService = async (
  userId: string,
  res: Response,
  pagination: PaginationParams = {},
  query: any = {}
) => {
  const { page = 1, limit = 10, description, sortBy } = query;

  // ✅ Sorting logic
  let sort: any = { createdAt: -1 };
  if (sortBy) {
    switch (sortBy) {
      case "alphaAsc":
        sort = { storeName: 1 };
        break;
      case "alphaDesc":
        sort = { storeName: -1 };
        break;
      case "latest":
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  }

  // ✅ Build search query
  const searchQuery: any = {};
  if (description) {
    searchQuery.storeName = { $regex: description, $options: "i" }; // case-insensitive search
  }

  // ✅ Fetch stores with search + pagination + sorting
  const stores = await storeModel
    .find(searchQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort)
    .lean();

  const totalStores = await storeModel.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalStores / limit);

  // ✅ Fetch all product IDs per store
  const storeIds = stores.map((s) => s._id);
  const storeProducts = await storeProductModel
    .find({ storeId: { $in: storeIds } })
    .select("_id storeId")
    .lean();

  const storeToProductIdsMap = new Map<string, Types.ObjectId[]>();
  storeProducts.forEach((p) => {
    const key = p.storeId.toString();
    if (!storeToProductIdsMap.has(key)) storeToProductIdsMap.set(key, []);
    storeToProductIdsMap.get(key)!.push(p._id);
  });

  // ✅ Aggregate reviews for all products from these stores
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

  // Map each product's rating
  const productRatingMap = new Map<string, number>();
  reviewAgg.forEach((r) => {
    productRatingMap.set(r._id.toString(), r.avgRating);
  });

  // ✅ Compute store average rating (from all its product ratings)
  const storeRatings = new Map<string, { avg: number; count: number }>();
  storeToProductIdsMap.forEach((productIds, storeId) => {
    const ratings = productIds
      .map((id) => productRatingMap.get(id.toString()))
      .filter((r): r is number => typeof r === "number");
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      storeRatings.set(storeId, { avg, count: ratings.length });
    } else {
      storeRatings.set(storeId, { avg: 0, count: 0 });
    }
  });

  // ✅ Merge store rating info into store list
  const storesWithRatings = stores.map((store) => {
    const ratingData = storeRatings.get(store._id.toString()) || {
      avg: 0,
      count: 0,
    };
    return {
      ...store,
      averageRating: Number(ratingData.avg.toFixed(1)),
      totalRatedProducts: ratingData.count,
    };
  });

  return {
    success: true,
    message: "Stores fetched successfully",
    data: {
      products: storesWithRatings,
      pagination: {
        totalStores,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  };
};

export const getStoreAndProductsByidService = async (
  userId: string | null,
  pagination: any,
  storeId: string,
  res: Response
) => {
  const { page = 1, limit = 10, sortBy, minPrice, maxPrice } = pagination;

  // ✅ Validate store
  const store = await storeModel.findById(storeId).lean();
  if (!store) {
    return errorResponseHandler("Store not found", httpStatusCode.NOT_FOUND, res);
  }

  // ✅ Base query
  const query: any = { storeId: new mongoose.Types.ObjectId(storeId) };

  // ✅ Filter by min/max price (nested field in priceDetails array)
  if (minPrice != null || maxPrice != null) {
    const priceFilter: any = {};
    if (minPrice != null) priceFilter.$gte = Number(minPrice);
    if (maxPrice != null) priceFilter.$lte = Number(maxPrice);

    query["priceDetails.price"] = priceFilter;
  }

  // ✅ Sort logic
  let sortQuery: any = { createdAt: -1 }; // default: latest

  switch (sortBy) {
    case "mostPopular":
      sortQuery = { totalSold: -1 }; // assuming you track this
      break;
    case "latest":
      sortQuery = { createdAt: -1 };
      break;
    case "priceLowToHigh":
      sortQuery = { "priceDetails.price": 1 };
      break;
    case "priceHighToLow":
      sortQuery = { "priceDetails.price": -1 };
      break;
    case "alphaAsc":
      sortQuery = { name: 1 };
      break;
    case "alphaDesc":
      sortQuery = { name: -1 };
      break;
  }

  let products: any[] = [];

  // ✅ Handle bestRated separately (needs aggregation)
  if (sortBy === "bestRated") {
    const ratingAgg = await productReviewModel.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const ratingMap = new Map(ratingAgg.map((r) => [r._id.toString(), r.averageRating]));

    products = await storeProductModel.find(query).lean();

    products = products.map((p) => ({
      ...p,
      averageRating: ratingMap.get(p._id.toString()) || 0,
    }));

    products.sort((a, b) => b.averageRating - a.averageRating);

    const start = (page - 1) * limit;
    const end = start + limit;
    products = products.slice(start, end);
  } else {
    // ✅ Sort directly in MongoDB
    products = await storeProductModel
      .find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  const totalProducts = await storeProductModel.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  // ✅ Collect productIds
  const productIds = products.map((p) => p._id);

  // ✅ Wishlist (only for logged-in users)
  let wishlistProductIds = new Set<string>();
  if (userId && Types.ObjectId.isValid(userId)) {
    try {
      const wishlist = await wishlistModel
        .find({
          userId: new Types.ObjectId(userId),
          productType: "storeProduct",
          productId: { $in: productIds },
        })
        .select("productId");
      wishlistProductIds = new Set(wishlist.map((w) => w.productId.toString()));
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  }

  // ✅ Aggregate product reviews
  const productReviewAgg = await productReviewModel.aggregate([
    { $match: { productId: { $in: productIds } } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const productReviewMap = new Map(
    productReviewAgg.map((r) => [
      r._id.toString(),
      { averageRating: r.averageRating, totalReviews: r.totalReviews },
    ])
  );

  // ✅ Merge wishlist + reviews
  const productsWithData = products.map((p) => {
    const review = productReviewMap.get(p._id.toString()) || {
      averageRating: 0,
      totalReviews: 0,
    };
    const allPrices = p.priceDetails?.map((d: any) => d.price) || [];
    const minProductPrice = Math.min(...allPrices);
    const maxProductPrice = Math.max(...allPrices);

    return {
      ...p,
      minProductPrice: isFinite(minProductPrice) ? minProductPrice : 0,
      maxProductPrice: isFinite(maxProductPrice) ? maxProductPrice : 0,
      isWishlisted: wishlistProductIds.has(p._id.toString()),
      averageRating: Number(review.averageRating?.toFixed(1)) || 0,
      totalReviews: review.totalReviews,
    };
  });

  // ✅ Store rating
  const allStoreProducts = await storeProductModel.find({ storeId }).select("_id").lean();
  const allProductIds = allStoreProducts.map((p) => p._id);
  const storeRatingAgg = await productReviewModel.aggregate([
    { $match: { productId: { $in: allProductIds } } },
    {
      $group: {
        _id: null,
        overallAverageRating: { $avg: "$rating" },
        totalStoreReviews: { $sum: 1 },
      },
    },
  ]);
  const storeRatingData = storeRatingAgg[0] || {
    overallAverageRating: 0,
    totalStoreReviews: 0,
  };

  return {
    success: true,
    message: "Store and products fetched successfully",
    data: {
      store: {
        ...store,
        overallRating: Number(storeRatingData.overallAverageRating?.toFixed(1)) || 0,
        totalReviews: storeRatingData.totalStoreReviews,
      },
      products: productsWithData,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  };
};