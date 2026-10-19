"use server";

import axios from "axios";
import { readSessionToken } from "@/app/actions/session";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ApiError, TransactionType } from "@/lib/api/types";

export interface TransactionActionResult {
  success: boolean;
  message: string;
}

async function authorizationHeader(): Promise<Record<string, string> | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function parseTransactionText(text: string): Promise<TransactionActionResult> {
  const headers = await authorizationHeader();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.post<{ success: true; message?: string }>(
      "/transactions/parse",
      { text },
      { headers },
    );
    return { success: true, message: data.message || "Transaksi tersimpan." };
  } catch (error) {
    return { success: false, message: getApiErrorMessage(error, "Transaksi tidak dapat disimpan.") };
  }
}

export async function parseReceipt(formData: FormData): Promise<TransactionActionResult> {
  const headers = await authorizationHeader();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.post<{ success: true; message?: string }>(
      "/transactions/parse-ocr",
      formData,
      { headers },
    );
    return { success: true, message: data.message || "Struk berhasil dipindai." };
  } catch (error) {
    return { success: false, message: getApiErrorMessage(error, "Struk tidak dapat dipindai.") };
  }
}


export interface EditableTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
}

export interface UpdateTransactionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export async function getTransactionForEdit(transactionId: string): Promise<{
  transaction: EditableTransaction | null;
  categories: string[];
}> {
  const headers = await authorizationHeader();
  if (!headers) return { transaction: null, categories: [] };

  try {
    const { data } = await apiClient.get<{ success: true; data: EditableTransaction }>(`/transactions/${transactionId}`, { headers });
    if (data?.data?.id) return { transaction: data.data, categories: [] };
  } catch {
    // The list endpoint is the available source when a single-record route is not mounted.
  }

  let categories: string[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data } = await apiClient.get<{
      data: EditableTransaction[];
      categories?: string[];
      meta: { totalPages: number };
    }>("/transactions", { headers, params: { page, limit: 100 } });
    if (page === 1) categories = data.categories ?? [];
    const transaction = data.data.find((item) => item.id === transactionId) ?? null;
    if (transaction) return { transaction, categories };
    if (page >= data.meta.totalPages) break;
  }

  return { transaction: null, categories };
}

export async function updateTransaction(
  transactionId: string,
  payload: {
    amount: number | string;
    description: string;
    date: string;
    category: string;
    type: TransactionType;
  },
): Promise<UpdateTransactionResult> {
  const headers = await authorizationHeader();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.put<{ success: true; message?: string }>(`/transactions/${transactionId}`, payload, { headers });
    return { success: true, message: data.message || "Transaksi berhasil diperbarui." };
  } catch (error) {
    if (axios.isAxiosError<ApiError>(error)) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Transaksi tidak dapat diperbarui."),
        errors: error.response?.data?.errors,
      };
    }
    return { success: false, message: "Transaksi tidak dapat diperbarui." };
  }
}

export async function deleteTransaction(transactionId: string): Promise<TransactionActionResult> {
  const headers = await authorizationHeader();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    await apiClient.delete(`/transactions/${transactionId}`, { headers });
    return { success: true, message: "Transaksi berhasil dihapus." };
  } catch (error) {
    return { success: false, message: getApiErrorMessage(error, "Transaksi tidak dapat dihapus.") };
  }
}