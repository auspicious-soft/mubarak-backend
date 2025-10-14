// controllers/notification.controller.ts
import { Request, Response } from "express";
import { sendNotificationService } from "../../services/notification/notification-service";
import { httpStatusCode } from "../../lib/constant";
import { errorParser } from "../../lib/errors/error-response-handler";
 
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { type, title, description, storeIds, sendToSpecific } = req.body;

    if (!type || !title || !description) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Type, title, and description are required",
      });
    }
  
    const response = await sendNotificationService({
      type,
      title,
      description,
      storeIds,
      sendToSpecific,
    });

    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "An error occurred",
    });
  }
};
