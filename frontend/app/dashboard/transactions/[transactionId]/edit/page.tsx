import type { Metadata } from "next";
import Link from "next/link";
import { getServerAuthState } from "@/app/actions/session";
import { getTransactionForEdit } from "@/app/actions/transactions";
import { EditTransactionForm } from "@/components/dashboard/edit-transaction-form";

export const metadata: Metadata = {
  title: "Edit Transaction · Dolas Finance",
};

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;
  const [auth, record] = await Promise.all([
    getServerAuthState(),
    getTransactionForEdit(transactionId),
  ]);
  const currency = auth.state === "AUTHENTICATED" ? auth.user.currency : "IDR";

  if (!record.transaction) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-12">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-on-surface">Edit Transaction</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Transaksi tidak ditemukan.</p>
        <Link href="/dashboard/transactions" className="mt-6 inline-flex text-[13px] font-semibold text-secondary">
          Back to transactions
        </Link>
      </div>
    );
  }

  return (
    <EditTransactionForm
      transaction={record.transaction}
      categories={record.categories}
      currency={currency}
    />
  );
}
