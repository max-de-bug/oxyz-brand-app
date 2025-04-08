// API configuration
export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SITE_BACKEND || "https://oxyz-server.vercel.app"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

// Log the API base URL for debugging
if (typeof window !== "undefined") {
  console.log("Current API Base URL:", API_BASE_URL);
  console.log("Current Environment:", process.env.NODE_ENV);
}
