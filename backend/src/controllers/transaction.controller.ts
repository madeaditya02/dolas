import type { Response } from "express";
import { parseReceiptImage, parseTransactionText } from "@/services/ai.service";
import { checkTodayOcrUsage, deleteTransaction, getOneTransaction, getTransactions, invalidateTransactionSummaryCache, saveExtractedTransactions, updateTransaction } from "@/services/transaction.service";
import type { AuthRequest } from "@/middlewares/auth.middleware";
import { sendError } from "@/utils/error";
import { prisma } from "../utils/db";

export const getTransactionsHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, "unauthorized", "Sesi tidak valid");
    }

    const { page, limit, search, startDate, endDate, type, categories } = req.query as any;

    const result = await getTransactions({
      userId,
      page,
      limit,
      search,
      startDate,
      endDate,
      type,
      categories
    });

    return res.status(200).json({
      success: true,
      ...result // Membuka (spread) objek data, meta, dan summary ke response root
    });

  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return sendError(res, 500, "internal-server-error", "Gagal memuat daftar transaksi");
  }
};

export const getTransactionHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, 'not-authenticated', "User tidak terautentikasi");
    }
    if (id) {
      const transaction = await getOneTransaction(id as string)
      if (transaction) {
        if (transaction.userId == userId) {
          return res.json({
            success: true,
            data: transaction
          })
        }
        return sendError(res, 403, 'access-denied', "User tidak memiliki akses untuk data ini");
      }
    }
    return sendError(res, 404, 'not-found', 'Transaction tidak ditemukan')
  } catch (error) {
    console.error(error)
    return sendError(res, 500, 'server-error', 'Internal server error')
  }
}

export const processAndSaveTransaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, 'not-authenticated', "User tidak terautentikasi");
    }

    if (!text) {
      return sendError(res, 400, 'form-validation', "Teks input tidak boleh kosong");
    }

    // 1. Ekstraksi teks menggunakan Gemini API
    const extractedData = await parseTransactionText(text);
    const transactions = extractedData.transactions;

    // 2. Validasi apakah AI berhasil menemukan transaksi
    if (!transactions || transactions.length === 0) {
      return sendError(res, 401, 'transaction-not-found', "Tidak ada transaksi yang dikenali dari teks tersebut.");
    }

    // 3. Simpan hasil ekstraksi ke Database Neon via Prisma
    const savedCount = await saveExtractedTransactions(userId, transactions);

    // 4. Kembalikan respons sukses ke Frontend
    return res.status(201).json({
      success: true,
      message: `Berhasil mengekstrak dan menyimpan ${savedCount.count} transaksi`,
      data: transactions
    });

  } catch (error: any) {
    console.error("Error processing transaction:", error);
    return sendError(res, 500, 'server-error', error.message || "Terjadi kesalahan internal pada server");
  }
};

export const editTransactionHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, 'not-authenticated', "User tidak terautentikasi");
    }
    if (id) {
      const transaction = await getOneTransaction(id as string)
      if (transaction) {
        if (transaction.userId == userId) {
          const updated = updateTransaction(id as string, req.body)
          return res.status(200).json({
            success: true,
            message: `Berhasil mengubah transaksi`,
            data: updated
          });
        }
        return sendError(res, 403, 'access-denied', "User tidak memiliki akses untuk data ini");
      }
    }
    return sendError(res, 404, 'not-found', 'Transaction tidak ditemukan')
  } catch (error) {
    console.error(error)
    return sendError(res, 500, 'server-error', 'Internal server error')
  }
}

export const deleteTransactionHandler = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, 'not-authenticated', "User tidak terautentikasi");
    }
    if (id) {
      const transaction = await getOneTransaction(id as string)
      if (transaction) {
        if (transaction.userId == userId) {
          const deleted = deleteTransaction(id as string)
          return res.json({
            success: true,
            data: transaction
          })
        }
        return sendError(res, 403, 'access-denied', "User tidak memiliki akses untuk data ini");
      }
    }
  } catch (error) {

  }
}

export const processOcrTransaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, "unauthorized", "Sesi tidak valid");
    }

    if (!req.file) {
      return sendError(res, 400, "bad-request", "Foto struk tidak ditemukan");
    }

    // 1. Cek Limit Harian OCR (Maksimal 3)
    const ocrUsageCount = await checkTodayOcrUsage(userId);
    if (ocrUsageCount >= 3) {
      return sendError(res, 429, "limit-reached", "Anda telah mencapai batas maksimal 3 kali pemindaian struk hari ini.");
    }

    // 2. Ekstraksi Data via Gemini Vision
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const extractedData = await parseReceiptImage(imageBuffer, mimeType);
    const transactions = extractedData.transactions;

    if (!transactions || transactions.length === 0) {
      return sendError(res, 400, "extraction-failed", "Tidak ada transaksi yang dikenali dari gambar tersebut.");
    }

    // 3. Sisipkan label metadata OCR pada setiap transaksi sebelum disimpan
    const extractedTransactions = transactions.map((t: any) => ({
      type: t.type.toUpperCase(),
      amount: t.extracted_total,
      category: t.category,
      description: t.description,
    }));
    console.log(transactions);
    const transactionsWithMetadata = extractedTransactions.map((t: any) => ({
      ...t,
      userId,
      metadata: { source: "ocr" }
    }));

    // 4. Simpan ke Database dan update user's balance
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.createMany({
        data: transactionsWithMetadata,
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: transactionsWithMetadata.reduce((acc: number, t: any) => acc + (t.type === 'INCOME' ? t.amount : (-1 * t.amount)), 0) }
        }
      });
      return created
    }, {
      maxWait: 10000,
      timeout: 20000,
    });
    invalidateTransactionSummaryCache(userId);
    return res.status(201).json({
      success: true,
      message: `Berhasil mengekstrak ${result.count} transaksi dari struk (Sisa kuota: ${2 - ocrUsageCount})`,
      data: extractedTransactions
    });

  } catch (error: any) {
    console.error("OCR Processing Error:", error);
    return sendError(res, 500, "internal-server-error", error.message || "Gagal memproses gambar struk.");
  }
};