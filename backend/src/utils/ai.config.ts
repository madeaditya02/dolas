import { type Schema, Type } from "@google/genai";

// Skema JSON yang memaksa Gemini mengembalikan format yang seragam
export const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      description: "Daftar transaksi yang diekstrak dari teks",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "Jenis transaksi. Gunakan 'expense' atau 'income'. Top up tergolong sebagai 'income'",
            enum: ["expense", "income"]
          },
          amount: {
            type: Type.INTEGER,
            description: "Nominal uang dalam angka bulat tanpa titik/koma"
          },
          category: {
            type: Type.STRING,
            description: "Kategori transaksi. Untuk expense antara lain: Makan & Minum, Transportasi, Tagihan, Kesehatan, Hiburan, dan Lainnya. Untuk income antara lain: Gaji, 'Transfer & Top Up'"
          },
          description: {
            type: Type.STRING,
            description: "Deskripsi singkat mengenai transaksi tersebut"
          }
        },
        required: ["type", "amount", "category", "description"]
      }
    }
  },
  required: ["transactions"]
};

// System Prompt untuk memberikan konteks pada AI
export const systemInstruction = `
Anda adalah asisten pencatat keuangan pribadi yang sangat cerdas. 
Tugas Anda adalah mengekstrak transaksi keuangan dari teks bahasa Indonesia sehari-hari, termasuk bahasa gaul atau singkatan (contoh: rb/k = ribu).
Pisahkan berbagai transaksi jika pengguna menyebutkan lebih dari satu transaksi dalam satu kalimat.
Abaikan kalimat sapaan atau curhatan yang tidak berhubungan dengan nominal uang.
`;

export const transactionReceiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["expense", "income"]
          },
          // 3 Field ini adalah "Chain of Thought" agar LLM tidak salah tebak
          extracted_total: {
            type: Type.INTEGER,
            description: "Angka mutlak yang berada di sebelah kata 'Total', 'Subtotal', atau 'Jumlah'."
          },
          extracted_cash: {
            type: Type.INTEGER,
            description: "Uang yang diserahkan pembeli, biasanya tertulis 'Cash', 'Tunai', atau 'Pay'. BISA JADI KOSONG."
          },
          extracted_change: {
            type: Type.INTEGER,
            description: "Uang kembalian, biasanya tertulis 'Change' atau 'Kembali'. BISA JADI KOSONG."
          },
          // Field utama yang akan disimpan ke database
          // amount: {
          //   type: Type.INTEGER,
          //   description: "NILAI PENGELUARAN ASLI. Harus sama persis dengan 'extracted_total'. DILARANG KERAS menggunakan nilai 'extracted_cash' di sini."
          // },
          category: { type: Type.STRING, description: "Kategori transaksi. Untuk expense antara lain: Makan & Minum, Transportasi, Tagihan, Kesehatan, Hiburan, dan Lainnya. Untuk income antara lain: Gaji, 'Transfer & Top Up'" },
          description: { type: Type.STRING }
        },
        required: ["type", "extracted_total", "category", "description"]
      }
    }
  },
  required: ["transactions"]
};

export const receiptPrompt = `
Anda adalah sistem ekstraksi data struk belanja. Terapkan aturan ketat ini terlepas dari seberapa berantakan struknya:
1. TARGET UTAMA: Cari kata kunci "Total", "Grand Total", atau "Amount Due". Nilai ini adalah 'amount' pengeluaran sebenarnya.
2. NEGATIVE PROMPT: JANGAN TERTIPU oleh kata "Cash", "Tunai", "Tendered", atau "Bayar". Itu hanyalah uang fisik yang diserahkan, bukan harga barang.
3. LOGIKA MATEMATIKA: Jika Total belanja adalah 45.000, pengguna membayar Cash 50.000, dan ada Kembali 5.000, maka 'amount' WAJIB diisi 45000.
4. MERCHANT: Isi 'description' dengan nama toko yang biasanya dicetak tebal di bagian paling atas struk.
`;