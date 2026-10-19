import { prisma } from "../utils/db";
import { Prisma, TransactionType } from "../../prisma/generated/prisma/client";
import type { JsonValue } from "@prisma/client/runtime/client";

export interface ParsedTransaction {
  type: "expense" | "income" | "transfer";
  amount: number;
  category: string;
  description: string;
}

interface TransactionEditPayload {
  type?: TransactionType;
  amount?: number;
  category?: string;
  description?: string;
  date?: Date;
  metadata?: JsonValue;
}

// import type { Prisma } from "@prisma/client";
interface GetTransactionsParams {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  categories?: string;
}

interface TransactionSummarySnapshot {
  totalItems: number;
  aggregations: { type: string; _sum: { amount: number | null } }[];
  categories: string[];
  expiresAt: number;
}

const SUMMARY_CACHE_TTL_MS = 60_000;
const summaryCache = new Map<string, TransactionSummarySnapshot>();

function summaryCacheKey(userId: string, where: Record<string, unknown>) {
  return `${userId}:${JSON.stringify(where)}`;
}

/** Drop cached totals after a write so the next filtered read is fresh. */
export function invalidateTransactionSummaryCache(userId: string) {
  for (const key of summaryCache.keys()) {
    if (key.startsWith(`${userId}:`)) summaryCache.delete(key);
  }
}

export const getTransactions = async (params: GetTransactionsParams) => {
  const { userId, page, limit, search, startDate, endDate, type, categories } = params;

  // 1. Merakit kondisi filter dinamis
  const where: any = { userId };

  if (search) {
    where.description = { contains: search, mode: "insensitive" };
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  if (type) {
    where.type = type;
  }

  if (categories) {
    // Memecah string "Kategori A,Kategori B" menjadi array ["Kategori A", "Kategori B"]
    where.category = { in: categories.split(",").map(c => c.trim()) };
  }

  // Page and limit only change which rows are read. Totals stay cached per filter.
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const cacheKey = summaryCacheKey(userId, where);
  const cached = summaryCache.get(cacheKey);
  const summary = cached && cached.expiresAt > Date.now() ? cached : null;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      date: true,
      description: true,
      category: true,
      type: true,
      amount: true,
    },
  });

  let totalItems = summary?.totalItems;
  let aggregations = summary?.aggregations;
  let categoryOptions = summary?.categories;

  if (totalItems === undefined || !aggregations || !categoryOptions) {
    const [count, groups, categoryRows] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
    ], {
      maxWait: 10000,
      timeout: 20000,
    });

    totalItems = count;
    aggregations = groups.map((group: { type: string; _sum: { amount: number | null } }) => ({
      type: group.type,
      _sum: { amount: group._sum.amount },
    }));
    categoryOptions = categoryRows.map((row: { category: string }) => row.category);
    summaryCache.set(cacheKey, {
      totalItems,
      aggregations,
      categories: categoryOptions,
      expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS,
    });
  }

  // 3. Merapikan data untuk bagian "Filtered Total"
  let filteredIncome = 0;
  let filteredExpense = 0;

  aggregations.forEach((agg: { type: string; _sum: { amount: number | null } }) => {
    if (agg.type === "INCOME") filteredIncome = agg._sum.amount || 0;
    if (agg.type === "EXPENSE") filteredExpense = agg._sum.amount || 0;
  });

  return {
    data: transactions,
    meta: {
      currentPage: pageNumber,
      limit: pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
    summary: {
      income: filteredIncome,
      expense: filteredExpense,
      net: filteredIncome - filteredExpense,
    },
    categories: categoryOptions,
  };
};

export const saveExtractedTransactions = async (userId: string, transactions: ParsedTransaction[]) => {
  let netBalanceChange = 0;
  const dataToInsert = transactions.map((t: ParsedTransaction) => {
    if (t.type.toUpperCase() === "INCOME") netBalanceChange += t.amount;
    if (t.type.toUpperCase() === "EXPENSE") netBalanceChange -= t.amount;
    return {
      userId,
      type: t.type.toUpperCase() as TransactionType,
      amount: t.amount,
      category: t.category,
      description: t.description,
    }
  });

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdTransactions = await tx.transaction.createMany({
      data: dataToInsert,
    });

    if (netBalanceChange !== 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: netBalanceChange
          }
        }
      });
    }

    return createdTransactions;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
  // const result = await prisma.transaction.createMany({
  //   data: dataToInsert,
  // });
  invalidateTransactionSummaryCache(userId);
  return result;
};

export const getOneTransaction = async (transactionId: string) => {
  return await prisma.transaction.findUnique({ where: { id: transactionId } })
}
export const updateTransaction = async (transactionId: string, data: TransactionEditPayload) => {
  // update balance
  const oldTransaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedTransaction = await tx.transaction.update({
      where: { id: transactionId },
      data: data as Prisma.TransactionUpdateInput
    });
    const difference = data.amount! - (oldTransaction?.amount || 0);
    // update balance
    const updateBalance = difference > 0 ? { decrement: difference } : { increment: difference };
    await tx.user.update({
      where: { id: oldTransaction?.userId as string },
      data: {
        balance: updateBalance
      }
    });
    return updatedTransaction;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
  if (oldTransaction?.userId) invalidateTransactionSummaryCache(oldTransaction.userId);
  data.type = data.type?.toUpperCase() as TransactionType
  data.date = new Date(data.date as unknown as string)
  return result;
}

export const deleteTransaction = async (transactionId: string) => {
  // update balance
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const deletedTransaction = await tx.transaction.delete({ where: { id: transactionId } });
    // const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
    const difference = deletedTransaction?.amount || 0;
    const updateBalance = difference > 0 ? { decrement: difference } : { increment: difference };
    await tx.user.update({
      where: { id: deletedTransaction?.userId as string },
      data: {
        balance: updateBalance
      }
    });
    return deletedTransaction;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
  if (result.userId) invalidateTransactionSummaryCache(result.userId);
  return result;
  // const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  // if (transaction) {
  //   const updateBalance = transaction?.type === "INCOME" ? { decrement: transaction.amount } : { increment: transaction.amount };
  //   await prisma.$transaction(async (tx) => {
  //     await tx.user.update({
  //       where: { id: transaction.userId },
  //       data: {
  //         balance: updateBalance
  //       }
  //     });
  //   });
  // }
  // return await prisma.transaction.delete({ where: { id: transactionId } })
}

export const checkTodayOcrUsage = async (userId: string): Promise<number> => {
  const startOfServerDay = new Date();
  startOfServerDay.setUTCHours(0, 0, 0, 0); // Reset ke 00:00 UTC hari ini

  const count = await prisma.transaction.count({
    where: {
      userId,
      createdAt: { gte: startOfServerDay },
      // Mencari transaksi yang memiliki objek metadata { "source": "ocr" }
      metadata: {
        equals: { source: "ocr" },
      },
    },
  });

  return count;
};