import { adminModel } from "../../models/admin/admin-schema";
import bcrypt from "bcryptjs";
import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
// import { usersModel } from "src/models/user/user-schema";
import { passwordResetTokenModel } from './../../models/password-token-schema';
import { sendPasswordResetEmail } from './../../utils/mails/mail';
import { generatePasswordResetToken, getPasswordResetTokenByToken } from './../../utils/mails/token';
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms";
import { storeModel } from "../../models/stores/stores-schema";
import jwt from "jsonwebtoken";
import { usersModel } from "../../models/users/users-schema";
import { storeProductModel } from "../../models/store-products/store-products-schema";
 
 
export const loginService = async (payload: any, res: Response) => {
  const { email, password } = payload;
  const countryCode = "+45";
  const toNumber = Number(email);
  const isEmail = isNaN(toNumber);
  let user: any = null;
 
  if (isEmail) {
    user = await adminModel.findOne({ email: email }).select("+password");
    if (!user) {
      user = await storeModel.findOne({ email: email }).select("+password");
    }
  }
 
 
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return errorResponseHandler("Invalid password", httpStatusCode.UNAUTHORIZED, res);
  }
  const userObject = user.toObject();
  delete userObject.password;
 
  // Generate JWT token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email || undefined
    },
    process.env.AUTH_SECRET as string,
    { expiresIn: '1d' }
  );
 
  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true', // Controlled by environment variable
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'strict'
  });
 
  return {
    success: true,
    message: "Login successful",
    data: {
      user: userObject,
      token: token // Include token in response for clients that don't use cookies
    },
  };
};
 
export const forgotPasswordService = async (phoneNumber: string, res: Response) => {
  // Check in both admin and store collections
  const admin = await adminModel.findOne({ phoneNumber }).select("-password");
  const store = await storeModel.findOne({ phoneNumber }).select("-password");

  // ❌ If not found in either collection, return error
  if (!admin && !store) {
    return errorResponseHandler(
      "Phone number not found in our records",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // ✅ Generate reset token
  const passwordResetToken = await generatePasswordResetToken(phoneNumber);
  console.log("passwordResetToken: ", passwordResetToken);

  if (passwordResetToken !== null) {
    await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, passwordResetToken.token);
    return { success: true, message: "Password reset OTP sent successfully", status: 200 };
  }

  // In case something goes wrong
  return errorResponseHandler("Failed to generate OTP", httpStatusCode.INTERNAL_SERVER_ERROR, res);
};
export const verifyOtpPasswordResetService = async (
  token: string,
  res: Response
) => {
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken)
    return errorResponseHandler(
      "Invalid token",
      httpStatusCode.BAD_REQUEST,
      res
    );
 
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired)
    return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);
  return { success: true, message: "Token verified successfully", status:200 };
};
 
export const newPassswordAfterOTPVerifiedService = async (
  payload: { password: string; otp: string },
  res: Response
) => {
  const { password, otp } = payload;

  // Fetch the token
  const existingToken = await getPasswordResetTokenByToken(otp);
  if (!existingToken)
    return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);

  // Check if token has expired
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired)
    return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);

  let existingAdmin: any;
  let existingStore: any;

  // Try finding admin by email if present
  if (existingToken.email) {
    existingAdmin = await adminModel.findOne({ email: existingToken.email });
  }

  // If admin not found, try finding store
  if (!existingAdmin && existingToken.email) {
    existingStore = await storeModel.findOne({ phoneNumber: existingToken.email });
  }

  // If neither exists, return error
  if (!existingAdmin && !existingStore) {
    return errorResponseHandler(
      "Account not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  let updatedAccount;
  if (existingAdmin) {
    updatedAccount = await adminModel.findByIdAndUpdate(
      existingAdmin._id,
      { password: hashedPassword },
      { new: true }
    );
  } else if (existingStore) {
    updatedAccount = await storeModel.findByIdAndUpdate(
      existingStore._id,
      { password: hashedPassword },
      { new: true }
    );
  }

  // Delete the used token
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  return {
    success: true,
    message: "Password updated successfully",
    data: updatedAccount,
    status: 200,
  };
};
 
export const getAdminDetailsService = async (payload: any, res: Response) => {
  const results = await adminModel.find();
  return {
    success: true,
    data: results,
  };
};
export const getAdminDetailsServiceById = async (id: string, res: Response) => {
  const result = await adminModel.findById(id);
  if (!result) {
    return errorResponseHandler("Admin not found", httpStatusCode.NOT_FOUND, res);
  }
  return {
    success: true,
    data: result,
  };
};
 
export const getNewUsersService = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  let { query, sort } = queryBuilder(payload, ["fullName"]);
  if (payload.duration) {
    const durationDays = parseInt(payload.duration);
    if (durationDays === 30 || durationDays === 7) {
      const date = new Date();
      date.setDate(date.getDate() - durationDays);
      (query as any) = { ...query, createdAt: { $gte: date } };
    }
  }
 
 
 
 
  // const totalDataCount = Object.keys(query).length < 1 ? await usersModel.countDocuments() : await usersModel.countDocuments(query);
  // const results = await usersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
  // if (results.length)
  //   return {
  //     success: true,
  //     message: "Users retrieved successfully",
  //     page,
  //     limit,
  //     total: totalDataCount,
  //     data: results,
  //   };
  // else {
  //   return {
  //     data: [],
  //     page,
  //     limit,
  //     success: false,
  //     total: 0,
  //   };
  // }
};

// export const getAUserService = async (id: string, res: Response) => {
//   const user = await usersModel.findById(id);
//   if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

//   return {
//     success: true,
//     message: "User retrieved successfully",
//     data: {
//       user,
//     },
//   };
// };

// export const updateAUserService = async (id: string, payload: any, res: Response) => {
//   const user = await usersModel.findById(id);
//   if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
//   const countryCode = "+45";
//   payload.phoneNumber = `${countryCode}${payload.phoneNumber}`;
//   const updateduser = await usersModel.findByIdAndUpdate(id, { ...payload }, { new: true });

//   return {
//     success: true,
//     message: "User updated successfully",
//     data: updateduser,
//   };
// };

// export const deleteAUserService = async (id: string, res: Response) => {
//   // const user = await usersModel.findById(id);
//   // if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
//   // // Delete user projects ----
//   // const userProjects = await projectsModel.deleteMany({ userId: id })
//   // // Delete user ----
//   // await usersModel.findByIdAndDelete(id)
//   // return {
//   //     success: true,
//   //     message: "User Deleted successfully",
//   //     data: {
//   //         user,
//   //         projects: userProjects
//   //     }
//   // }
// };

// // Dashboard
export const getDashboardStatsService = async (req: any, res: Response) => {
  const userCount = await usersModel.countDocuments();
  const storeCount = await storeModel.countDocuments();
  const storeProducts = await storeProductModel.countDocuments();
   
  return{
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: { userCount, storeCount, storeProducts }
  }
};
