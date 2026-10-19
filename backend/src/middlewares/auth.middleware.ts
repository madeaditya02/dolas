import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Memperluas interface Request Express agar TypeScript mengenali req.user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: 'not-authenticated',
      message: "Akses ditolak. Token autentikasi tidak ditemukan."
    });
  }

  const token = authHeader.split(" ")[1] ?? "";

  try {
    const decoded = (jwt.verify(token, JWT_SECRET) as unknown) as { id: string, name: string };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'not-authenticated',
      message: "Sesi telah berakhir atau token tidak valid. Silakan login kembali."
    });
  }
};