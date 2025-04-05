import { API_BASE_URL } from "@/config";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const formatEndpoint = (endpoint: string) => {
  // Make sure endpoint starts with a slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

const getAuthHeaders = async () => {
  const supabase = createClientComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
};

export const apiClient = {
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      const response = await fetch(url, { headers });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: url,
        });
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a POST request to the API
   */
  async post<T>(
    endpoint: string,
    data: any,
    p0?: { headers: { "Content-Type": string } }
  ): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      console.log(`POST request to ${url}:`, data);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
        });
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`POST response from ${url}:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a PUT request to the API
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error putting to ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Upload a file to the API
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Remove Content-Type from headers as it's set automatically for FormData
      delete headers["Content-Type"];

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error uploading file to ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Make a PATCH request to the API
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const url = formatEndpoint(endpoint);
      const headers = await getAuthHeaders();

      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error);
      throw error;
    }
  },
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
