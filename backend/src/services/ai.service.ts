import { GoogleGenAI } from "@google/genai";
import { receiptPrompt, systemInstruction, transactionReceiptSchema, transactionSchema } from "../utils/ai.config.js";
import "dotenv/config";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const parseTransactionText = async (userInput: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = await genAI.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: userInput,
        system_instruction: systemInstruction,
        response_format: {
          type: "text",
          mime_type: "application/json", // Memaksa output berupa JSON
          schema: transactionSchema,    // Memasangkan skema yang dibuat tadi
          // temperature: 0.1, // Dibuat rendah (0.1) agar model fokus pada ekstraksi fakta, bukan imajinasi
        },
      });

      // const result = await model.generateContent(userInput);
      const result = model.output_text
      return JSON.parse(result ?? "");
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || "";
      const isRateLimitOrDemand = errorMessage.includes("429") || errorMessage.includes("503") || errorMessage.includes("overloaded");

      if (isRateLimitOrDemand && attempt < maxRetries) {
        // Rumus Backoff: 2s, 4s, 8s ditambah waktu acak (Jitter) 0-1 detik
        const backoffTime = (Math.pow(2, attempt) * 1000) + (Math.random() * 1000);
        console.warn(`[AI Service] API sibuk. Mencoba lagi (Attempt ${attempt}/${maxRetries}) dalam ${Math.round(backoffTime)}ms...`);

        await delay(backoffTime);
        continue; // Lanjut ke iterasi retry berikutnya
      }
      console.error("AI Service Error:", error);
      throw new Error("Gagal memproses teks dengan AI");
    }
  }
};

export const parseReceiptImage = async (imageBuffer: Buffer, mimeType: string, maxRetries = 3) => {
  // const prompt = "Analisis gambar struk belanja ini. Ekstrak informasi total pengeluaran, nama merchant sebagai deskripsi, dan kategorikan jenis transaksinya. Jika ada pajak atau biaya admin, jumlahkan ke dalam total akhir. Cari kata kunci 'Total', 'Grand Total', atau 'Amount Due'. Nilai ini adalah 'amount' pengeluaran sebenarnya. Abaikan teks yang tidak relevan.";
  // const prompt = `
  // You are an expert financial data extractor analyzing Indonesian payment receipts.
  // Your task is to accurately extract the true FINAL COST of the transaction.

  // CRITICAL RULES FOR "AMOUNT" EXTRACTION:
  // 1. DO NOT extract the amount tendered by the customer. Avoid numbers next to: "Cash", "Tunai", "Bayar", "Dibayar", "Tendered".
  // 2. DO NOT extract the change given back. Avoid numbers next to: "Kembali", "Kembalian", "Change".
  // 3. LOOK FOR the actual cost of the items (including tax/admin fees). Target keywords: "Total", "Grand Total", "Total Belanja", "Subtotal", "Jumlah".
  // 4. If you see Total = 50.000, Cash = 100.000, Kembali = 50.000, the correct amount is 50000.

  // Extract the data into JSON with:
  // - merchant (string): Name of the store.
  // - amount (integer): The exact final cost, purely numbers (e.g., 50000).
  // - category (string): Best fit category for the items.
  // `;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: [
          { type: "text", text: receiptPrompt },
          {
            type: "image",
            data: imageBuffer.toString("base64"),
            mime_type: "image/jpeg"
          }
        ],
        // system_instruction: systemInstruction,
        response_format: {
          type: "text",
          mime_type: "application/json", // Memaksa output berupa JSON
          schema: transactionReceiptSchema,    // Memasangkan skema yang dibuat tadi
        },
      });
      const result = (await model).output_text
      return JSON.parse(result ?? "");
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || "";
      const isRateLimitOrDemand = errorMessage.includes("429") || errorMessage.includes("503") || errorMessage.includes("overloaded");

      if (isRateLimitOrDemand && attempt < maxRetries) {
        const backoffTime = (Math.pow(2, attempt) * 1000) + (Math.random() * 1000);
        await delay(backoffTime);
        continue;
      }
      throw new Error(isRateLimitOrDemand ? "Sistem AI sedang kelebihan beban. Coba lagi dalam beberapa menit." : `Gagal memproses gambar struk: ${error}`);
    }
  }
};