import type { Response } from "express";
import { success } from "zod";

export const sendError = (res: Response, statusCode: number, errorType: string, message: string) => {
  return res.status(statusCode).json({
    success: false,
    error: errorType,
    message: message
  });
};