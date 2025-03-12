import { API_BASE_URL } from "@/config";
import { getSession } from "next-auth/react";

// Helper to format the endpoint
const formatEndpoint = (endpoint: string): string => {
  // If the endpoint already starts with http, return it as is
  if (endpoint.startsWith("http")) {
    return endpoint;
  }

  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
};

// Helper to get the auth token from the session
const getAuthToken = (session: any): string | null => {
  // Debug logging
  console.log("Session object:", JSON.stringify(session, null, 2));

  // Try to get the token from different possible locations in the session object
  if (session?.accessToken) {
    console.log("Using session.accessToken:", session.accessToken);
    return session.accessToken;
  }
  if (session?.user?.accessToken) {
    console.log("Using session.user.accessToken:", session.user.accessToken);
    return session.user.accessToken;
  }

  // Additional checks for other possible token locations
  if (session?.token) {
    console.log("Using session.token:", session.token);
    return session.token;
  }
  if (session?.access_token) {
    console.log("Using session.access_token:", session.access_token);
    return session.access_token;
  }
  if (session?.user?.token) {
    console.log("Using session.user.token:", session.user.token);
    return session.user.token;
  }

  // Check if we have a token in localStorage as last resort
  const storedToken = localStorage.getItem("auth_token");
  if (storedToken) {
    console.log("Using token from localStorage");
    return storedToken;
  }

  // If we have an email, try to get a token from the backend
  if (session?.user?.email) {
    console.log(
      "No token found, but have email. Will try to get token from backend."
    );

    // We'll try to get a token asynchronously, but for now return the email as fallback
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: session.user.email }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.access_token) {
            console.log("Got access token from backend:", data.access_token);
            // Store the token for future use
            localStorage.setItem("auth_token", data.access_token);
            // Force a page refresh to use the new token
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Error getting access token from backend:", error);
      }
    })();

    return session.user.email; // Fallback to email as token
  }

  console.log("No token found in session");
  return null;
};

export const apiClient = {
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    const headers: Record<string, string> = {};

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Request URL:", url);
      console.log("Request headers:", headers);
    } else {
      console.log("No authorization header added - no token found");
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Make a PUT request to the API
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    const headers: Record<string, string> = {};

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Upload a file to the API
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    const headers: Record<string, string> = {};

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Add any additional data to the form
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Make a custom request to the API
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = formatEndpoint(endpoint);
    const session = await getSession();

    // Define headers with a more flexible type
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add auth header if we have a session
    const token = getAuthToken(session);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  },

  // Fetch resources from Cloudinary by folder
  getCloudinaryResources: async <T>(
    folder: string,
    maxResults?: number,
    nextCursor?: string
  ): Promise<T> => {
    const params = new URLSearchParams();
    params.append("folder", folder);
    if (maxResults) params.append("max_results", maxResults.toString());
    if (nextCursor) params.append("next_cursor", nextCursor);

    return apiClient.get<T>(`/cloudinary/resources?${params.toString()}`);
  },

  // List all folders in Cloudinary
  getCloudinaryFolders: async <T>(): Promise<T> => {
    return apiClient.get<T>("/cloudinary/folders");
  },

  // List subfolders in a specific folder
  getCloudinarySubFolders: async <T>(folder: string): Promise<T> => {
    return apiClient.get<T>(`/cloudinary/folders/${folder}`);
  },

  // Search for resources in Cloudinary
  searchCloudinary: async <T>(
    query: string,
    maxResults?: number,
    nextCursor?: string
  ): Promise<T> => {
    const params = new URLSearchParams();
    params.append("query", query);
    if (maxResults) params.append("max_results", maxResults.toString());
    if (nextCursor) params.append("next_cursor", nextCursor);

    return apiClient.get<T>(`/cloudinary/search?${params.toString()}`);
  },

  // Get resources from specific endpoints with Cloudinary source
  getFromCloudinary: async <T>(
    endpoint: string,
    folder?: string
  ): Promise<T> => {
    const params = new URLSearchParams();
    params.append("source", "cloudinary");
    if (folder) params.append("folder", folder);

    return apiClient.get<T>(`${endpoint}?${params.toString()}`);
  },
};
