import { Types } from "mongoose";
import { storeProductModel } from "../../models/store-products/store-products-schema";
import { userProductModel } from "../../models/user-products/user-products-schema";
import { wishlistModel } from "../../models/wishlist/wishlist-schema";

export const toggleWishlistService = async (
  userId: string,
  productId: string,
  productType: "storeProduct" | "userProduct"
) => {
  // Validate product existence
  let product;
  if (productType === "storeProduct") {
    product = await storeProductModel.findById(productId);
  } else {
    product = await userProductModel.findById(productId);
  }

  if (!product) {
    throw new Error("Product not found");
  }

  // Check if already in wishlist
  const existing = await wishlistModel.findOne({
    userId: new Types.ObjectId(userId),
    productId: new Types.ObjectId(productId),
    productType,
  });

  if (existing) {
    // Remove it
    await wishlistModel.findByIdAndDelete(existing._id);
    return {
      success: true,
      message: "Product removed from wishlist",
    };
  } else {
    // Add it
    const wishlistItem = await wishlistModel.create({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      productType,
    });
    return {
      success: true,
      message: "Product added to wishlist",
      data: wishlistItem,
    };
  }
};

export const getUserWishlistService = async (userId: string) => {
  return wishlistModel
    .find({ userId: new Types.ObjectId(userId) })
    .populate("productId") // dynamic refPath is used automatically
    .lean() // optional, returns plain objects instead of Mongoose docs
    .exec();
};


export const removeFromWishlistService = async (userId: string, productId: string, productType: "storeProduct" | "userProduct") => {
  const deletedItem = await wishlistModel.findOneAndDelete({
    userId,
    productId,
    productType,
  });

  if (!deletedItem) {
    throw new Error("Item not found in wishlist");
  }

  return deletedItem;
};
