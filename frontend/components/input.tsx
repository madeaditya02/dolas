export default function Input({ className, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm leading-5 text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus-visible:ring-2 focus-visible:ring-primary ${error ? "border-error" : "border-surface-container-high"} ${className}`} {...props} />
  )
}