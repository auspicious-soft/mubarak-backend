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
  const admin = await adminModel.findOne({ phoneNumber: phoneNumber }).select("+password");
  // if (!admin) return errorResponseHandler("Phone number not found", httpStatusCode.NOT_FOUND, res);
  const passwordResetToken = await generatePasswordResetToken(phoneNumber);
  console.log('passwordResetToken: ', passwordResetToken);

  if (passwordResetToken !== null) {
    await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, passwordResetToken.token);
    return { success: true, message: "Password reset email sent with otp", status:200 };
  }
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

export const newPassswordAfterOTPVerifiedService = async (payload: { password: string; otp: string }, res: Response) => {
  const { password, otp } = payload;

  const existingToken = await getPasswordResetTokenByToken(otp);
  if (!existingToken) return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);

  let existingAdmin: any;

  if (existingToken.email) {
    existingAdmin = await adminModel.findOne({ phoneNumber: existingToken.email });
  }
  if (!existingAdmin) {  
    return errorResponseHandler("Admin account not found", httpStatusCode.NOT_FOUND, res);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const response = await adminModel.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword }, { new: true });
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  return {
    success: true,
    message: "Password updated successfully",
    data: response,
    status:200,
  };
};

export const getAdminDetailsService = async (payload: any, res: Response) => {
  const results = await adminModel.find();
  return {
    success: true,
    data: results,
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
// export const getDashboardStatsService = async (payload: any, res: Response) => {
//   try {
//     const overviewDuration = payload.overviewDuration ? parseInt(payload.overviewDuration) : null;
//     const usersDuration = payload.usersDuration ? parseInt(payload.usersDuration) : null;

//     let overviewDate: Date | null = new Date();
//     if (overviewDuration === 30 || overviewDuration === 7) {
//       overviewDate.setDate(overviewDate.getDate() - overviewDuration);
//     } else {
//       overviewDate = null;
//     }

//     let usersDate: Date | null = new Date();
//     if (usersDuration === 30 || usersDuration === 7) {
//       usersDate.setDate(usersDate.getDate() - usersDuration);
//     } else {
//       usersDate = null;
//     }

//     const users = await usersModel   .find(usersDate ? { createdAt: { $gte: usersDate } } : {})
//     .sort({ createdAt: -1 })
//     .limit(10).select("-__v -password -otp -token -fcmToken -whatsappNumberVerified -emailVerified");

//       const userIds = users.map((user) => user._id);
//       const awards = await awardsModel.find({ userId: { $in: userIds } }).select("userId level badge");

//       const awardsMap = new Map(awards.map((award) => [award.userId.toString(), award]));

//       const newestUsers = users.map((user) => ({
//         ...user.toObject(),
//         award: awardsMap.get(user._id.toString()) || null,
//       }));

//     const newestEvents = await eventsModel
//       .find(usersDate ? { createdAt: { $gte: usersDate } } : {})
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .select("-__v");
//     const newUsersCount = await usersModel.countDocuments(overviewDate ? { createdAt: { $gte: overviewDate } } : {});
//     const eventsCount = await eventsModel.countDocuments(overviewDate ? { createdAt: { $gte: overviewDate } } : {});
//     const newBooks = await productsModel.countDocuments(overviewDate ? { createdAt: { $gte: overviewDate } } : {});
//     const totalRevenueResult = await ordersModel.aggregate([{ $match: overviewDate ? { createdAt: { $gte: overviewDate } } : {} }, { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }]);

//     const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

//     return {
//       success: true,
//       message: "Dashboard stats fetched successfully",
//       data: {
//         newestUsers,
//         newestEvents,
//         newUsersCount,
//         eventsCount,
//         newBooks,
//         totalRevenue,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error); // Log the error for debugging
//     return errorResponseHandler("Failed to fetch dashboard stats", httpStatusCode.INTERNAL_SERVER_ERROR, res);
//   }
// };
