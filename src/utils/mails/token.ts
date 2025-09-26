import { customAlphabet } from "nanoid";
import { passwordResetTokenModel } from "../../models/password-token-schema"



export const generatePasswordResetToken = async (email: string) => {
  const genId = customAlphabet('0123456789', 6)
  const token = genId()
  const expires = new Date(new Date().getTime() + 3600 * 1000)

  const existingToken = await passwordResetTokenModel.findOne({ email })
  if (existingToken) {
    await passwordResetTokenModel.findByIdAndDelete(existingToken._id)
  }
  const newPasswordResetToken = new passwordResetTokenModel({
    email,
    token,
    expires
  })
  const response = await newPasswordResetToken.save()
  return response
}

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await passwordResetTokenModel.findOne({ token });
    return passwordResetToken;
  } catch {
    return null;
  }
}

export const generatePasswordResetTokenByPhone = async (phoneNumber: string) => {
  // Generate a 6-digit numeric token
  const genId = customAlphabet('0123456789', 6);
  const token = genId();

  // Set expiration 1 hour from now
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  // Delete any existing token for this phone number
  await passwordResetTokenModel.deleteMany({ phoneNumber });

  // Create and save the new token
  const response = await passwordResetTokenModel.create({
    phoneNumber,
    token,
    expires,
  });

  return response;
};