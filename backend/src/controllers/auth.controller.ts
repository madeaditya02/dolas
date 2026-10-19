import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db.js";
import { sendVerificationEmail } from "../services/email.service.js";
import type { AuthRequest } from "@/middlewares/auth.middleware.js";
import { sendError } from "@/utils/error.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return sendError(res, 400, 'already-registered', 'Email sudah terdaftar')

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Buat token khusus verifikasi email (kedaluwarsa 1 jam)
    const verifyToken = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(user.email, verifyToken);

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.",
    });
  } catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 400, "token-not-found", "Token tidak ditemukan");

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    await prisma.user.update({
      where: { id: decoded.id },
      data: { email_verified_at: new Date() },
    });

    // Login setelah berhasil verifikasi
    const accessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ success: true, message: "Email berhasil diverifikasi", accessToken });
  } catch (error) {
    return sendError(res, 400, "invalid-token", "Token tidak valid atau sudah kedaluwarsa");
  }
};

export const getVerifyToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "user-not-found", "Email tidak ditemukan");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) return sendError(res, 400, 'user-not-found', "Email tidak ditemukan");
    const verifyToken = jwt.sign({ id: existingUser.id }, JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(existingUser.email, verifyToken);
    return res.status(200).json({
      success: true,
      message: "Token verifikasi berhasil dikirim ulang. Silakan cek email Anda untuk verifikasi.",
    });
  } catch (error) {
    console.error(error)
    return res.status(200).json({
      success: true,
      message: "Token verifikasi berhasil dikirim ulang. Silakan cek email Anda untuk verifikasi.",
    });
  }
}

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 401, "invalid-credentials", "Email atau password salah");

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return sendError(res, 401, "invalid-credentials", "Email atau password salah");

    if (!user.email_verified_at) return sendError(res, 403, "email-not-verified", "Silakan verifikasi email Anda terlebih dahulu");

    // Cek apakah user sudah mengisi saldo dan mata uang
    const needsSetup = user.currency === null || user.balance === null;
    // if (needsSetup) return sendError(res, 400, "need-setup", "Atur saldo awalmu terlebih dahulu");

    // Generate Access Token (Bisa digunakan di Header Authorization untuk request API)
    const token = jwt.sign({ id: user.id, name: user.name, currency: user.currency, balance: user.balance }, JWT_SECRET, { expiresIn: rememberMe ? "30d" : "7d" });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        balance: user.balance
      },
      needsSetup // Frontend Next.js akan membaca ini dan redirect ke halaman /setup
    });
  } catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
};

// 4. SETUP SALDO AWAL (Dipanggil setelah login jika needsSetup == true)
export const setupAccount = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { currency, balance } = req.body;

    if (!currency || balance === undefined) {
      return sendError(res, 400, 'form-validation', "Mata uang dan saldo wajib diisi");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { currency, balance: parseInt(balance) },
    });
    // Sign jwt lagi dengan data user yang sudah diupdate
    const token = jwt.sign({ id: user.id, name: user.name, currency: user.currency, balance: user.balance }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Setup akun berhasil. Selamat datang di Dashboard!",
      token
      // user: { id: user?.id, name: user?.name, email: user?.email, balance: user?.balance, currency: user?.currency }
    });
  } catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return res.status(200).json({
      success: true,
      message: "Data user berhasil dimuat",
      user: { id: user?.id, name: user?.name, email: user?.email, balance: user?.balance, currency: user?.currency }
    });
  } catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
}

export const updateDailyLimit = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { dailyLimit } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { dailyLimit: dailyLimit !== "" ? parseInt(dailyLimit) : null },
    });
    return res.status(200).json({
      success: true,
      message: "Batas harian berhasil diubah",
      // dailyLimit: user.dailyLimit
    });
  }
  catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name, currency, dailyLimit } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, currency, dailyLimit: dailyLimit !== "" ? parseInt(dailyLimit) : null },
    });
    return res.status(200).json({
      success: true,
      message: "Profil berhasil diubah",
      user: { id: user?.id, name: user?.name, email: user?.email, balance: user?.balance, currency: user?.currency }
    });
  }
  catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
}

export const updatePassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 400, "user-not-found", "User tidak ditemukan");
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) return res.status(400).json({
      error: "validation-error",
      message: "Terdapat kesalahan pada data yang diinputkan",
      errors: { currentPassword: ["Password saat ini salah"] }
    });
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
    return res.status(200).json({ success: true, message: "Password berhasil diubah" });
  } catch (error: any) {
    return sendError(res, 500, "server-error", error.message);
  }
};