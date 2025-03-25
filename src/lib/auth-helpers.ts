import { API_BASE_URL } from "@/config";
import { Session } from "next-auth";

// Function to authenticate with the backend using NextAuth session
export async function authenticateWithBackend(session: Session) {
  if (!session?.user || !session.accessToken) {
    console.log("No valid session or access token");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        username: session.user.name,
        avatar: session.user.image,
        access_token: session.accessToken,
        token_type: "Bearer",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend authentication failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Store the JWT in localStorage for future API calls
    localStorage.setItem("jwt_token", data.access_token);

    return data;
  } catch (error) {
    console.error("Error authenticating with backend:", error);
    return null;
  }
}

// Function to get the auth token for API calls
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("jwt_token");
}
