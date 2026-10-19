"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiEdit2, FiEye, FiMoreHorizontal, FiTrash2 } from "react-icons/fi";
import DeleteModal from "../delete-modal";
import { FaCircleExclamation } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/app/actions/transactions";
import Link from "next/link";
import { flashSession } from "@/app/actions/session";
import { toast } from "../toast";

export function TransactionMenu({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const [isDelete, setIsDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const result = await deleteTransaction(transactionId);
    if (result.success) {
      toast.success(result.message);
      // await flashSession('toast', JSON.stringify({ status: 'success', message: result.message }));
      router.refresh();
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex size-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
        onClick={() => setOpen((current) => !current)}
      >
        <FiMoreHorizontal aria-hidden className="size-4" />
        <span className="sr-only">Transaction actions</span>
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest py-1 shadow-[0_12px_24px_-8px_rgba(19,27,46,0.18)]">
          {/* <a href="#" role="menuitem" className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low">
            <FiEye aria-hidden className="size-4" />
            View Details
          </a> */}
          <Link href={`/dashboard/transactions/${transactionId}/edit`} role="menuitem" className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low">
            <FiEdit2 aria-hidden className="size-4" />
            Edit Transaction
          </Link>
          <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-error hover:bg-error-container" onClick={() => setIsDelete((current) => !current)}>
            <FiTrash2 aria-hidden className="size-4" />
            Delete
          </button>
        </div>
      )}
    </div>
    {isDelete && 
      <DeleteModal title="Delete Transaction"
      handleSubmit={handleDelete}
      loading={loading}
      // action={`/dashboard/transactions/${transactionId}/delete`}
      handleCancel={() => setIsDelete(false)}
      >
        <FaCircleExclamation aria-hidden className="size-10 text-error mx-auto mt-2" />
        <p className="text-on-surface-variant text-lg font-medium text-center">Are you sure you want to delete this transaction?</p>
      </DeleteModal>
      }
    </>
  );
}
