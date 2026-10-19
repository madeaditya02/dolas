export interface ApiSuccess {
  success: true;
  message?: string;
}

export interface ApiError {
  success?: false;
  error: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string | null;
  balance: number | null;
}

export type AuthUser = UserProfile;

export interface AuthSessionResponse {
  state:
  | "NOT_AUTHENTICATED"
  | "EMAIL_NOT_VERIFIED"
  | "SETUP_REQUIRED"
  | "AUTHENTICATED";
  user?: AuthUser;
}

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
}

export const AUTH_COOKIE_NAME = "finance_session";
