import { Response } from "express";
import bcrypt from "bcryptjs";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { usersModel } from "../../models/users/users-schema";
import { generatePasswordResetToken, getPasswordResetTokenByToken, generatePasswordResetTokenByPhone } from "../../utils/mails/token";
import { sendPasswordResetEmail } from "../../utils/mails/mail";
import { generateUserToken } from "../../utils/userAuth/signUpAuth";
import { passwordResetTokenModel } from "../../models/password-token-schema";
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms";

// Create User (Sign Up)
export const createUserService = async (payload: any, res: Response) => {
  const { email, phoneNumber } = payload;

  if (!phoneNumber) {
    return errorResponseHandler(
      "Phone number is required",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Check if user already exists
  const existingUser = await usersModel.findOne({
    $or: [
      { email: email || null },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    // If user exists but not verified, send OTP again
    if (!existingUser.isVerified) {
      const otp = await generatePasswordResetTokenByPhone(phoneNumber);
      await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

      const userObject = existingUser.toObject();
      // @ts-ignore

      return {
        success: true,
        message: "OTP sent to your phone number for verification.",
        data: userObject
      };
    }

    return errorResponseHandler(
      "User with this phone number already exists",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Create user without password initially
  const user = await usersModel.create({
    ...payload,
    isVerified: false
  });

  // Generate OTP for verification
  const otp = await generatePasswordResetTokenByPhone(phoneNumber);

  // Send OTP via SMS
  await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, otp.token);

  const userObject = user.toObject();
  // @ts-ignore

  return {
    success: true,
    message: "OTP sent to your phone number for verification.",
    data: userObject
  };
};

// User Login
export const loginUserService = async (payload: any, res: Response) => {
  const { phoneNumber } = payload;

  if (!phoneNumber) {
    return errorResponseHandler("Phone number is required", httpStatusCode.BAD_REQUEST, res);
  }

  // Find user by phone number
  const user = await usersModel.findOne({ phoneNumber });

  if (!user) {
    // If user doesn't exist, create a new unverified user
    // return createUserService(payload, res);
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
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
    data: userObject
  };
};

// Verify OTP
export const verifyOtpService = async (payload: any, res: Response) => {
  const { phoneNumber, otp } = payload;

  if (!phoneNumber) {
    return errorResponseHandler("Phone number is required", httpStatusCode.BAD_REQUEST, res);
  }

  // Find token
  const existingToken = await getPasswordResetTokenByToken(otp);

  if (!existingToken) {
    return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);
  }

  // Check if token is expired
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);
  }

  // Check if token belongs to the user
  if (existingToken.phoneNumber !== phoneNumber) {
    return errorResponseHandler("Invalid OTP for this phone number", httpStatusCode.BAD_REQUEST, res);
  }

  // Update user verification status
  const user = await usersModel.findOneAndUpdate(
    { phoneNumber },
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  }

  // Delete the used token
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  // Generate JWT token
  const token = generateUserToken(user);

  return {
    success: true,
    message: "Phone number verified successfully",
    data: {
      user,
      token
    }
  };
};

// Resend OTP
export const resendOtpService = async (payload: any, res: Response) => {
  const { phoneNumber } = payload;

  if (!phoneNumber) {
    return errorResponseHandler("Phone number is required", httpStatusCode.BAD_REQUEST, res);
  }

  // Check if user exists
  const user = await usersModel.findOne({ phoneNumber });

  if (!user) {
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
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
  let { query, sort } = queryBuilder(payload, ["fullName", "email","firstName", "lastName"]);
  //TODO add lastest date of order

  const totalUsers = await usersModel.countDocuments(query);
  const users = await usersModel
    .find(query)
    .sort(sort)
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
      total: totalUsers
    }
  };
};

// Get User by ID
export const getUserByIdService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id).select("-password");
  //TODO add orders
  //TODO: return Total Revenue Generated, Most Sold Product,Total Products Listed,Products Sold and list of products
  if (!user) {
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  }

  return {
    success: true,
    message: "User retrieved successfully",
    data: user
  };
};

// Update User
export const updateUserService = async (id: string, payload: any, res: Response) => {
  const user = await usersModel.findById(id);

  if (!user) {
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
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
    data: updatedUser
  };
};

// Delete User
export const deleteUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);

  if (!user) {
    return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  }

  await usersModel.findByIdAndDelete(id);

  return {
    success: true,
    message: "User deleted successfully"
  };
};

