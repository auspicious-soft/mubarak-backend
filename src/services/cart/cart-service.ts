import { Response } from 'express';
import { cartModel } from '../../models/cart/cart-schema';
import { errorResponseHandler } from '../../lib/errors/error-response-handler';
import { httpStatusCode } from '../../lib/constant';
import { storeProductModel } from '../../models/store-products/store-products-schema';
import { AddressModel } from '../../models/address/address-schema';

interface CartItemInput {
  storeProduct: string;
  selectedPriceDetail: string;
  quantity: number;
}

// Add item to cart
export const addToCartService = async (
  userId: string,
  itemData: CartItemInput,
  res: Response
) => {
  if (!userId) {
    return errorResponseHandler(
      "User ID is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }
  const storeProduct = await storeProductModel.findById(itemData.storeProduct);
  if (!storeProduct) {
    return errorResponseHandler(
      "Store product not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Find or create cart for user
  let cart = await cartModel.findOne({ userId });

  if (!cart) {
    cart = new cartModel({
      userId,
      items: []
    });
  }

  // Check if item with same product and price detail already exists
  const existingItemIndex = cart.items.findIndex(
    (item: any) =>
      item.storeProduct.toString() === itemData.storeProduct &&
      item.selectedPriceDetail.toString() === itemData.selectedPriceDetail
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    cart.items[existingItemIndex].quantity += itemData.quantity;
  } else {
    // Add new item to cart
    cart.items.push(itemData as any);
  }

  await cart.save();

  // Populate product details
  await cart.populate('items.storeProduct');

  return {
    success: true,
    message: "Item added to cart successfully",
    data: cart
  };
};

// Get user cart
export const getCartService = async (userId: string, res: Response) => {
  if (!userId) {
    return errorResponseHandler(
      "User ID is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const cart = await cartModel
    .findOne({ userId })
    .populate({
      path: "items.storeProduct",
      populate: {
        path: "storeId",
        model: "store",
        select: "storeName discount",
      },
    })
    .lean();

  if (!cart) {
    return {
      success: true,
      message: "Cart is empty",
      data: {
        userId,
        items: [],
        totalItems: 0,
        totalOriginalPrice: 0,
        totalDiscountedPrice: 0,
        totalSavings: 0,
      },
    };
  }

  let totalOriginalPrice = 0;
  let totalDiscountedPrice = 0;

  (cart as any).items = cart.items.map((item: any) => {
    const storeProduct = item.storeProduct;
    const storeDiscount = storeProduct?.storeId?.discount || 0;

    // find selected price detail
    const selectedDetail = storeProduct?.priceDetails.find(
      (pd: any) => pd._id.toString() === item.selectedPriceDetail.toString()
    );

    const basePrice = selectedDetail ? selectedDetail.price : 0;
    const quantity = item.quantity || 1;

    // price calculations
    const originalItemTotal = Number((basePrice * quantity).toFixed(2));
    const discountedUnitPrice =
      basePrice - (basePrice * storeDiscount) / 100;
    const discountedItemTotal = Number(
      (discountedUnitPrice * quantity).toFixed(2)
    );

    totalOriginalPrice += originalItemTotal;
    totalDiscountedPrice += discountedItemTotal;

    return {
      ...item,
      selectedPriceDetail: selectedDetail || null,
      basePrice,
      storeDiscount,
      discountedPrice: Number(discountedUnitPrice.toFixed(2)),
      totalPrice: discountedItemTotal,
      originalTotal: originalItemTotal,
      savings: Number((originalItemTotal - discountedItemTotal).toFixed(2)),
    };
  });

  const totalSavings = Number(
    (totalOriginalPrice - totalDiscountedPrice).toFixed(2)
  );

  return {
    success: true,
    message: "Cart fetched successfully",
    data: {
      ...cart,
      totalPrice: Number(totalOriginalPrice.toFixed(2)),
      totalDiscountedPrice: Number(totalDiscountedPrice.toFixed(2)),
      totalSavings,
    },
  };
};

// Update cart item quantity
export const updateCartItemService = async (
  userId: string,
  itemId: string,
  quantity: number,
  res: Response
) => {
  if (!userId || !itemId) {
    return errorResponseHandler(
      "User ID and Item ID are required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  if (quantity < 1) {
    return errorResponseHandler(
      "Quantity must be at least 1",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const cart = await cartModel.findOne({ userId });

  if (!cart) {
    return errorResponseHandler(
      "Cart not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  const item = cart.items.find((item: any) => item._id.toString() === itemId);

  if (!item) {
    return errorResponseHandler(
      "Item not found in cart",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  item.quantity = quantity;
  await cart.save();

  await cart.populate('items.storeProduct');

  return {
    success: true,
    message: "Cart item updated successfully",
    data: cart
  };
};

// Remove item from cart
export const removeCartItemService = async (
  userId: string,
  itemId: string,
  quantity: number,
  res: Response
) => {
  if (!userId || !itemId || quantity === undefined) {
    return errorResponseHandler(
      "User ID, Item ID, and quantity are required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const cart = await cartModel.findOne({ userId });

  if (!cart) {
    return errorResponseHandler(
      "Cart not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  const itemIndex = cart.items.findIndex(
    (item: any) => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    return errorResponseHandler(
      "Item not found in cart",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  const cartItem = cart.items[itemIndex];

  // Decrease quantity or remove item
  if (cartItem.quantity > quantity) {
    cartItem.quantity -= quantity;
  } else {
    // quantity to remove >= current quantity, remove item from array
    cart.items.splice(itemIndex, 1);
  }

  await cart.save();
  await cart.populate("items.storeProduct"); // populate if needed

  return {
    success: true,
    message: "Cart updated successfully",
    data: cart,
  };
};

// Clear entire cart
export const clearCartService = async (userId: string, res: Response) => {
  if (!userId) {
    return errorResponseHandler(
      "User ID is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const cart = await cartModel.findOne({ userId });

  if (!cart) {
    return errorResponseHandler(
      "Cart not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  (cart as any).items = [];
  await cart.save();

  return {
    success: true,
    message: "Cart cleared successfully",
    data: cart
  };
};
export const addOrUpdateCartAddressService = async (
  userId: string,
  addressId: string,
  res: Response
) => {
    if (!userId || !addressId) {
      return errorResponseHandler(
        "User ID and Address ID are required",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }

    // ✅ Check if the address exists and belongs to the same user
    const address = await AddressModel.findOne({ _id: addressId, userId });
    if (!address) {
      return errorResponseHandler(
        "Address not found or does not belong to the user",
        httpStatusCode.NOT_FOUND,
        res
      );
    }

    // ✅ Find or create user's cart
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = new cartModel({
        userId,
        items: [],
        addressId,
      });
    } else {
      // Update existing cart with selected address
      (cart as any).addressId = addressId;
    }

    await cart.save();

    // ✅ Populate address details before returning
    await cart.populate("addressId");

    return {
      success: true,
      message: "Address added to cart successfully",
      data: cart,
    };
  }