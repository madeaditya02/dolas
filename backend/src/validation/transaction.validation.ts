// src/validations/transaction.validation.ts
import { z } from "zod";

export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().min(1, "Halaman minimal 1").default(1).optional(),
  limit: z.coerce.number().min(1).max(100, "Maksimal 100 baris per halaman").default(10).optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  // Kategori bisa dikirim sebagai string yang dipisahkan koma (misal: "Makan & Minum,Gaji")
  categories: z.string().optional(),
});

export const editTransactionSchema = z.object({
  amount: z.number("Nominal wajib diisi dan harus berupa angka"),
  description: z.string("Deskripsi wajib diisi"),
  date: z.coerce.date("Waktu transaksi wajib diisi"),
  metadata: z.json().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"], "Jenis transaksi wajib diisi").optional(),
  category: z.string("Kategori wajib diisi"),
});