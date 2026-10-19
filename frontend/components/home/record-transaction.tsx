"use client";

import { useEffect, useRef, useState } from "react";
import { FiCamera, FiCheckCircle, FiFileText, FiImage, FiMessageSquare, FiUpload, FiZap } from "react-icons/fi";
import { parseReceipt, parseTransactionText } from "@/app/actions/transactions";
import { useForm } from "@/lib/form";
import { FaXmark } from "react-icons/fa6";
import { FaRegSave } from "react-icons/fa";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { UserProfile } from "@/lib/api/types";
import { useToast } from "../toast";


const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export function RecordTransaction({ user }: { user: UserProfile }) {
  const toast = useToast();
  const userLang = user.currency?.split(" ")[0] || "en-EN";
  const suggestions = userLang == "id-ID" ? [
    { label: "+ Beli kopi 30000", text: "Beli kopi 30000" },
    { label: "+ Naik gojek 15k", text: "Naik gojek 15k" },
    { label: "+ Isi bensin 30k dan makan lalapan 25k", text: "Isi bensin 30k dan makan lalapan 25k" },
    { label: "+ Gaji 10jt", text: "Gaji 10jt" }
  ] : [
    { label: "+ Coffee $8.20", text: "Coffee $8.20" },
    { label: "+ Gas fill-up $46.50", text: "Gas fill-up $46.50" },
    // { label: "+ Grocery haul", text: "Grocery haul" },
    { label: "+ Uber ride $24.75", text: "Uber ride $24.75" },
    { label: "+ Inflow $1,250", text: "Inflow $1,250" },
  ];
  const [mode, setMode] = useState<"text" | "ocr">("text");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { values, errors, isPending, handleChange, changeValue, setError, resetForm, handleSubmit } = useForm({
    text: "",
  });

  useEffect(() => {
    if (file || !fileInputRef.current) return;
    fileInputRef.current.value = "";
  }, [file]);

  function acceptFile(next: File | undefined) {
    setNotice("");
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setFile(null);
      setError("receipt", "File harus berupa gambar.");
      return;
    }
    if (next.size > MAX_RECEIPT_BYTES) {
      setFile(null);
      setError("receipt", "Ukuran struk maksimal 5 MB.");
      return;
    }
    setError("receipt", []);
    setFile(next);
  }

  const submit = handleSubmit(async (form) => {
    setNotice("");
    if (mode === "text") {
      const text = form.text.trim();
      if (!text) {
        setError("text", "Tuliskan transaksi terlebih dahulu.");
        return;
      }
      const result = await parseTransactionText(text);
      if (!result.success) {
        // setError("message", result.message);
        toast.error(result.message);
        return;
      }
      resetForm();
      // setNotice(result.message);
      toast.success(result.message);
      return;
    }

    if (!file) {
      setError("receipt", "Pilih file struk terlebih dahulu.");
      return;
    }
    const body = new FormData();
    body.set("receipt", file);
    const result = await parseReceipt(body);
    if (!result.success) {
      // setError("message", result.message);
      toast.error(result.message);
      return;
    }
    setFile(null);
    setNotice(result.message);
  });

  const message = errors?.message?.[0] || errors?.text?.[0] || errors?.receipt?.[0] || "";

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[22px] font-bold leading-7 tracking-[-0.55px] text-on-surface">Record a transaction</h2>
          <p className="text-sm leading-5 text-on-surface-variant">
            Describe your income or expense naturally, or drop in a receipt snapshot.
          </p>
        </div>
        <div role="tablist" aria-label="Cara mencatat transaksi" className="flex w-full rounded-xl bg-surface-container-low p-1 sm:w-auto">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "text"}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold leading-4 tracking-[0.13px] sm:flex-none ${mode === "text" ? "bg-surface-container-lowest text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]" : "text-on-surface-variant"}`}
            onClick={() => setMode("text")}
          >
            <FiMessageSquare aria-hidden className="size-[15px]" />
            Describe it
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "ocr"}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold leading-4 tracking-[0.13px] sm:flex-none ${mode === "ocr" ? "bg-surface-container-lowest text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]" : "text-on-surface-variant"}`}
            onClick={() => setMode("ocr")}
          >
            <FiFileText aria-hidden className="size-[15px]" />
            Upload Receipt (OCR)
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        {mode === "text" ? (
          <>
            <div className="rounded-xl bg-surface-container-low">
              <textarea
                name="text"
                value={values.text}
                onChange={handleChange}
                rows={6}
                placeholder="e.g.: Bought lunch with Sarah at Sweetgreen for $18.45 using Chase Sapphire"
                className="min-h-[174px] w-full resize-none bg-transparent px-5 pt-5 text-base leading-6 text-on-surface outline-none"
              />
              <div className="flex items-center justify-between px-4 pb-3 pt-1">
                {/* <p className="inline-flex items-center gap-1.5 text-[11px] font-bold leading-[14px] tracking-[0.44px] text-secondary">
                  <FiZap aria-hidden className="size-[15px]" />
                  Gemini 1.5 Flash auto-detection enabled
                </p> */}
                <button
                  type="button"
                  className="text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant"
                  onClick={() => changeValue("text", "")}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="pr-1 text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant">
                Quick Suggestions:
              </span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button" 
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold leading-[14px] tracking-[0.44px] ${suggestion.text == values.text ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}
                  onClick={() => changeValue("text", suggestion.text)}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div
            className={`flex flex-col items-center rounded-xl bg-surface px-4 py-6 text-center shadow-[0_1px_1px_rgba(0,0,0,0.05)] ${dragging ? "outline outline-2 outline-secondary" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptFile(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-surface-container text-secondary">
              <FiCamera aria-hidden className="size-6" />
            </div>
            <h3 className="text-base font-semibold leading-6 tracking-[-0.08px] text-on-surface">
              Pindai Struk / Bukti Pembayaran
            </h3>
            <p className="mt-1 max-w-[420px] text-sm leading-5 text-on-surface-variant">
              {file ? file.name : "Drag & drop foto struk belanja, restoran, atau transfer ATM ke sini"}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-medium leading-4 tracking-[0.33px] text-on-surface-variant">
                <FiImage aria-hidden className="size-3" />
                JPG · PNG · WEBP ≤ 8 MB
              </span>
              {/* <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-medium leading-4 tracking-[0.33px] text-on-surface-variant">
                <FiZap aria-hidden className="size-3" />
                OCR Instant Parse
              </span> */}
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-surface-dim px-3 py-2 text-[13px] font-medium leading-4.5 tracking-[0.13px] text-primary-container shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload aria-hidden className="size-[15px]" />
              Pilih File / Struk
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>
        )}

        {message && (
          <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            {message}
          </p>
        )}
        {notice && (
          <div role="status" className="flex justify-between gap-2 rounded-lg bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
            {notice}
            <FaXmark className="size-4 shrink-0" onClick={() => setNotice("")} />
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-[13px] leading-4.5 text-on-surface-variant">
            <FiCheckCircle aria-hidden className="size-3.75 shrink-0" />
            Zero manual tagging required • Auto-matches accounts and recurrent bills
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary disabled:opacity-60"
          >
            {/* <FiZap aria-hidden className="size-4" /> */}
            <FaRegSave aria-hidden className="size-4" />
            {isPending ? "Saving..." : "Save Transaction"}
          </button>
        </div>
      </form>
    </section>
  );
}
