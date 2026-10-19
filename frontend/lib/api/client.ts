import axios from "axios";

/** Shared backend HTTP client. Set NEXT_PUBLIC_API_BASE_URL for non-local deployments. */
// Set header authorization with bearer token from cookie
export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    Accept: "application/json",
  },
});