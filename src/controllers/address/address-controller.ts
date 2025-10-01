import { Request, Response } from "express";
import { createAddressService, deleteAddressService, getUserAddressesService, updateAddressService } from "../../services/address/address-service";
import { httpStatusCode } from "../../lib/constant";
import { errorParser } from "../../lib/errors/error-response-handler";

export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const response = await createAddressService(userId, req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const response = await getUserAddressesService(userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const addressId = req.params.id;
    const response = await updateAddressService(addressId, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const addressId = req.params.id;
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await deleteAddressService(userId,addressId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
