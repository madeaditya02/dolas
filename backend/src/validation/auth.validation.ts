// src/validations/auth.validation.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(8, "Password minimal 8 karakter")
    .regex(/[\d]|[^\p{L}\p{N}\s]/u, "Password harus mengandung angka atau simbol"),
});

export const loginSchema = z.object({
  email: z
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const setupAccountSchema = z.object({
  currency: z.string().min(1, "Mata uang wajib dipilih (misal: IDR)"),
  balance: z
    .number({
      error: "Saldo wajib diisi dan harus berupa angka",
    })
    .min(0, "Saldo tidak boleh minus"),
});

export const dailyLimitSchema = z.object({
  dailyLimit: z.number({
    error: "Batas harian wajib diisi dan harus berupa angka",
  }).min(0, "Batas harian tidak boleh minus"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  currency: z.string().min(1, "Mata uang wajib dipilih"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(1, "Password baru wajib diisi")
  .min(8, "Password minimal 8 karakter")
  .regex(/[\d]|[^\p{L}\p{N}\s]/u, "Password harus mengandung angka atau simbol"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi password harus sama",
  path: ["confirmPassword"],
});