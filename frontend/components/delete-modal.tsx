"use client";

import Form from 'next/form'
import { FiLoader } from 'react-icons/fi';
export default function DeleteModal({ title, handleCancel, handleSubmit, loading, children }: { title: string, handleCancel: () => void, handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void, loading: boolean, children: React.ReactNode }) {
  return (
    <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-4" onClick={() => {
          if (!loading) {
            handleCancel();
          }
        }}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-12px_rgba(19,27,46,0.3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {/* <FiShield aria-hidden className="size-4 text-secondary" /> */}
              <h2 className="text-lg font-semibold leading-6 text-on-surface">{title}</h2>
            </div>
            {/* <p className="mt-1 text-sm leading-5 text-on-surface-variant">
              Set a daily spending cap so Dolas can show what is safe to spend today.
            </p> */}
            {/* <form action={action} method="post">
              <button
                type="submit"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-[13px] font-semibold text-error hover:bg-error-container"
              >
                Logout
              </button>
            </form> */}
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} method="POST">
              {children}
              <div className="flex justify-end gap-2">
                <button type="button" disabled={loading} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-on-surface-variant disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex gap-1 items-center rounded-lg bg-error px-4 py-2 text-[13px] font-semibold text-on-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <FiLoader className="size-4 animate-spin" /> : "Delete"} {loading && "Deleting..."}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  );
}
