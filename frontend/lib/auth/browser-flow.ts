const PENDING_VERIFICATION_EMAIL_KEY = "finance.pending-verification-email";
const VERIFICATION_RESEND_AVAILABLE_AT_KEY = "finance.verification-resend-available-at";
const VERIFICATION_FLOW_EVENT = "finance-verification-flow-change";
export const VERIFICATION_RESEND_DELAY_MS = 30_000;

function notifyVerificationFlowChange(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(VERIFICATION_FLOW_EVENT));
}

/** Temporary UI flow data only; never use this value as authentication state. */
export function savePendingVerificationEmail(email: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
    notifyVerificationFlowChange();
  }
}

export function getPendingVerificationEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export function clearPendingVerificationEmail(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
    notifyVerificationFlowChange();
  }
}

export function setVerificationResendAvailableAt(timestamp: number): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(VERIFICATION_RESEND_AVAILABLE_AT_KEY, String(timestamp));
    notifyVerificationFlowChange();
  }
}

export function getVerificationResendAvailableAt(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(VERIFICATION_RESEND_AVAILABLE_AT_KEY);
  const timestamp = value ? Number(value) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getVerificationFlowSnapshot(): string {
  return JSON.stringify([getPendingVerificationEmail(), getVerificationResendAvailableAt()]);
}

export function subscribeVerificationFlow(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(VERIFICATION_FLOW_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(VERIFICATION_FLOW_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
