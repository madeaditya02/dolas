// src/controllers/dashboard.controller.ts
import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { getDashboardSummary } from "../services/dashboard.service.js";
import { sendError } from "../utils/error.js";

export const getDashboardData = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "unauthorized", "Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const dashboardData = await getDashboardSummary(userId, month);

    return res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error: any) {
    if (error.message === "user-not-found") {
      return sendError(res, 404, "user-not-found", "Data pengguna tidak ditemukan di sistem.");
    }

    console.error("Dashboard Error:", error);
    return sendError(res, 500, "server-error", "Terjadi kesalahan saat memuat data dasbor.");
  }
};