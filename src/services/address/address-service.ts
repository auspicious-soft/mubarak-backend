import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { AddressModel } from "../../models/address/address-schema";
import { usersModel } from "../../models/users/users-schema";

// Create a new address
export const createAddressService = async (
  userId: string,
  payload: any,
  res: Response
) => {
  if (!userId) {
    return errorResponseHandler(
      "User ID is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const newAddress = await AddressModel.create({
    userId,
    ...payload,
  });

  const user = await usersModel.findById(userId);
  if (user) {
    user.addressAdded = true;
    await user.save();
  }

  return {
    success: true,
    message: "Address created successfully",
    data: newAddress,
  };
};

// Get all addresses of a user
export const getUserAddressesService = async (
  userId: string,
  res: Response
) => {
  if (!userId) {
    return errorResponseHandler(
      "User ID is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const addresses = await AddressModel.find({ userId }).sort({ createdAt: -1 });

  return {
    success: true,
    message: "Addresses fetched successfully",
    data: addresses,
  };
};

// Update an address by its ID
export const updateAddressService = async (
  addressId: string,
  payload: any,
  res: Response
) => {
  const address = await AddressModel.findById(addressId);
  if (!address) {
    return errorResponseHandler(
      "Address not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  const updatedAddress = await AddressModel.findByIdAndUpdate(
    addressId,
    payload,
    { new: true }
  );

  return {
    success: true,
    message: "Address updated successfully",
    data: updatedAddress,
  };
};

// Delete an address by its ID
export const deleteAddressService = async (
  userId: string,
  addressId: string,
  res: Response
) => {
  const address = await AddressModel.findById(addressId);
  if (!address) {
    return errorResponseHandler(
      "Address not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // ✅ Check ownership
  if (address.userId.toString() !== userId.toString()) {
    return errorResponseHandler(
      "You are not authorized to delete this address",
      httpStatusCode.FORBIDDEN,
      res
    );
  }

  await AddressModel.findByIdAndDelete(addressId);

  return {
    success: true,
    message: "Address deleted successfully",
  };
};
