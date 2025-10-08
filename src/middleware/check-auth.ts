import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { decode } from 'next-auth/jwt'
import { httpStatusCode } from "../lib/constant";
// import { usersModel } from "src/models/user/user-schema";
configDotenv()
declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload
        }
    }
}
 
export const checkWebAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token
    if (!token) return res.status(httpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized token missing" })
 
    try {
        const decoded = jwt.verify(token, process.env.AUTH_SECRET as string)
            if (!decoded) return res.status(httpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized token invalid or expired" })
            req.user = decoded
        next()
    } catch (error) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
    }
}
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = req.headers["role"];
    console.log('🔍 Middleware - role header:', role); // Add this
    console.log('🔍 Middleware - all headers:', req.headers); // Add this

    // ✅ If role is "guest", skip token validation
    if (role && role.toString().toLowerCase() === "guest") {
      console.log('✅ Guest detected, skipping auth'); // Add this
      return next();
    }

    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header:', authHeader); // Add this

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No token provided'); // Add this
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.AUTH_SECRET as string
    ) as JwtPayload;

    (req as any).user = decoded;
    console.log('✅ Token verified'); // Add this

    next();
  } catch (error) {
    console.log('❌ Middleware error:', error); // Add this
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};