import { Request, Response } from "express"
import { formatZodErrors } from "../../validation/format-zod-errors";
import { loginService, newPassswordAfterOTPVerifiedService, forgotPasswordService,
     getNewUsersService, getAdminDetailsService,
     verifyOtpPasswordResetService,
     getAdminDetailsServiceById} from "../../services/admin/admin-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

//Auth Controllers
export const login = async (req: Request, res: Response) => {
    try {
        const response = await loginService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        // Clear the token cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), // Set expiration to past date to delete the cookie
            secure: process.env.COOKIE_SECURE === 'true', // Controlled by environment variable
            sameSite: 'strict'
        });

        return res.status(httpStatusCode.OK).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
export const getAdminDetails = async (req: Request, res: Response) => {
    try {

        const response = await getAdminDetailsService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)

    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
export const getAdminDetailsById = async (req: Request, res: Response) => {
    try {

        const response = await getAdminDetailsServiceById(req.user.id, res)
        return res.status(httpStatusCode.OK).json(response)

    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const forgotPassword = async (req: Request, res: Response) => {  
 
    try {
        const response = await forgotPasswordService(req.body.phoneNumber, res)
        return res.status(httpStatusCode.OK).json(response)
    }
    catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
export const verifyOtpPasswordReset = async (req: Request, res: Response) => {
    const { otp } = req.body;
    try {
      const response = await verifyOtpPasswordResetService(otp, res);
      return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
      const { code, message } = errorParser(error);
      return res
        .status(code || httpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: message || "An error occurred" });
    }
  };

export const newPassswordAfterOTPVerified = async (req: Request, res: Response) => {
    try {
        const response = await newPassswordAfterOTPVerifiedService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)
    }
    catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

// export const getNewUsers = async (req: Request, res: Response) => {
//     try {
//         const response = await getNewUsersService(req.query)
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }


// export const getDashboardStats = async (req: Request, res: Response) => {
//     try {
//         const response = await getDashboardStatsService(req.query, res)
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }

