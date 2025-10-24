import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import {
  createUserService,
  loginUserService,
  verifyOtpService,
  resendOtpService,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  getUserHomeService,
  getUserHomeStoresService,
  getStoreAndProductsByidService,
  deactivateAccountService,
  logoutUserService,
 
} from "../../services/users/users-service";

// User Signup
export const userSignup = async (req: Request, res: Response) => {
  try {
    const response = await createUserService(req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// User Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const response = await loginUserService(req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const response = await verifyOtpService(req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const response = await resendOtpService(req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const response = await getAllUsersService(req.query);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const response = await getUserByIdService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Update User
export const updateUser = async (req: Request, res: Response) => {
  try {
     const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await updateUserService(userId, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await deleteUserService(userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getUserHome = async (req: Request, res: Response) => {
  try {
     const role = req.headers.role?.toString().toLowerCase();
    const userId = role === "guest" ? null  : (req as any).user?.id ;
    const response = await getUserHomeService(userId, res,req.body,req.body);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getUserHomeStores = async (req: Request, res: Response) => {
  try {
     const role = req.headers.role?.toString().toLowerCase();
    const userId = role === "guest" ? null  : (req as any).user?.id ;
    const response = await getUserHomeStoresService(userId, res,req.body,req.body);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getStoreAndProductsByid = async (req: Request, res: Response) => {
  try {
    const role = req.headers.role?.toString().toLowerCase();
    const userId = role === "guest" ? null  : (req as any).user?.id ;
    const response = await getStoreAndProductsByidService(userId,req.body,req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await deactivateAccountService(userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const getUserByToken = async (req: Request, res: Response) => {
  try {
     const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(httpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "User ID is required"
          });
        }
    const response = await getUserByIdService(userId, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { fcmToken } = req.body;

    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!fcmToken) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "FCM token is required for logout",
      });
    }

    const response = await logoutUserService(userId, fcmToken, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res
      .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: message || "An error occurred" });
  }
};