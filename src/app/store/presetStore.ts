import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import axios from "axios";

// Export the Preset interface
export interface Preset {
  url: string | undefined;
  id: string;
  name: string;
  filter: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    sepia?: number;
    opacity?: number;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CloudinaryResource {
  updatedAt: string;
  isDefault: boolean;
  id: string;
  secure_url: string;
  filename: string | undefined;
  public_id: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  tags: string[];
  context?: Record<string, any>;
}

interface CloudinaryResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
  rate_limit_allowed?: number;
  rate_limit_remaining?: number;
  rate_limit_reset_at?: string;
}

interface PresetStore {
  presets: Preset[];
  cloudinaryPresets: Preset[];
  selectedPreset: Preset | null;
  activePreset: Preset | null;
  loading: boolean;
  loadingCloudinary: boolean;
  error: string | null;
  nextCursor: string | null;

  setActivePreset: (preset: Preset | null) => void;
  fetchPresets: () => Promise<void>;
  fetchCloudinaryPresets: (folder?: string) => Promise<void>;
  loadMoreCloudinaryPresets: () => Promise<void>;
  setSelectedPreset: (preset: Preset | null) => void;
  setDefault: (preset: Preset) => Promise<void>;
  createPreset: (preset: Partial<Preset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  presets: [],
  cloudinaryPresets: [],
  selectedPreset: null,
  activePreset: null,
  loading: false,
  loadingCloudinary: false,
  error: null,
  nextCursor: null,

  setActivePreset: (preset) => set({ activePreset: preset }),

  fetchPresets: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<{ data: Preset[] }>("/presets");
      set({ presets: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching presets:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch presets",
        loading: false,
      });
    }
  },

  fetchCloudinaryPresets: async (folder = "presets") => {
    try {
      set({ loadingCloudinary: true, error: null });
      console.log("Fetching Cloudinary presets...");

      // Use the correct URL with query parameters
      const url = `/presets?source=cloudinary&folder=${folder}&includeDefaults=true`;
      const response = await apiClient.get<CloudinaryResponse>(url);

      console.log("Cloudinary response:", response);

      // Check if the response has the expected structure
      if (!response || !response.resources) {
        console.error("Invalid response structure:", response);
        set({
          error: "Invalid response from server",
          loadingCloudinary: false,
          cloudinaryPresets: [],
        });
        return;
      }

      // Map Cloudinary resources to Preset format
      const cloudinaryPresets = response.resources
        .map((resource: CloudinaryResource) => {
          try {
            // Extract filter values from context if available
            const filter = resource.context?.custom || {};

            // Log the resource to debug
            console.log("Processing resource:", resource);

            // Use the id or publicId property, with fallbacks
            const identifier = resource.public_id || resource.public_id || "";
            const name =
              identifier.split("/").pop() ||
              resource.filename ||
              "Unnamed Preset";

            // Get the URL - prioritize the property that actually exists in your data
            const imageUrl = resource.url || resource.secure_url || "";
            console.log("Image URL:", imageUrl);

            return {
              id:
                resource.id ||
                `preset-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              name: name,
              filter: {
                brightness: parseFloat(filter.brightness) || 100,
                contrast: parseFloat(filter.contrast) || 100,
                saturation: parseFloat(filter.saturation) || 100,
                sepia: parseFloat(filter.sepia) || 0,
                opacity: parseFloat(filter.opacity) || 100,
              },
              isDefault:
                resource.isDefault ||
                resource.tags?.includes("default") ||
                false,
              createdAt:
                resource.created_at ||
                resource.created_at ||
                new Date().toISOString(),
              updatedAt:
                resource.updatedAt ||
                resource.created_at ||
                new Date().toISOString(),
              url: imageUrl, // Use the correctly extracted URL
              publicId: resource.public_id || resource.public_id || "",
            };
          } catch (err) {
            console.error("Error mapping resource:", resource, err);
            return null;
          }
        })
        .filter(Boolean) as Preset[]; // Remove any null entries

      console.log("Mapped presets:", cloudinaryPresets);

      set({
        cloudinaryPresets,
        nextCursor: response.next_cursor || null,
        loadingCloudinary: false,
      });
    } catch (error) {
      console.error("Error fetching Cloudinary presets:", error);
      // Log more details about the error
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data: any; status: number };
        };
        if (axiosError.response) {
          console.error("Response data:", axiosError.response.data);
          console.error("Response status:", axiosError.response.status);
        }
      }

      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Cloudinary presets",
        loadingCloudinary: false,
        cloudinaryPresets: [],
      });
    }
  },

  loadMoreCloudinaryPresets: async () => {
    const { nextCursor, cloudinaryPresets } = get();
    if (!nextCursor) return;

    try {
      set({ loadingCloudinary: true, error: null });
      console.log("Loading more Cloudinary presets with cursor:", nextCursor);

      // Use the correct URL with query parameters
      const url = `/presets?source=cloudinary&folder=presets&maxResults=10&nextCursor=${nextCursor}&includeDefaults=true`;
      const response = await apiClient.get<CloudinaryResponse>(url);

      console.log("Paginated response:", response);

      // Check if the response has the expected structure
      if (!response || !response.resources) {
        console.error("Invalid paginated response structure:", response);
        set({
          error: "Invalid response from server",
          loadingCloudinary: false,
        });
        return;
      }

      // Map Cloudinary resources to Preset format
      const newPresets = response.resources
        .map((resource: CloudinaryResource) => {
          try {
            // Extract filter values from context if available
            const filter = resource.context?.custom || {};

            return {
              id: resource.public_id,
              name: resource.public_id.split("/").pop() || "Unnamed Preset",
              filter: {
                brightness: parseFloat(filter.brightness) || 100,
                contrast: parseFloat(filter.contrast) || 100,
                saturation: parseFloat(filter.saturation) || 100,
                sepia: parseFloat(filter.sepia) || 0,
                opacity: parseFloat(filter.opacity) || 100,
              },
              isDefault: resource.tags?.includes("default") || false,
              createdAt: resource.created_at,
              updatedAt: resource.created_at,
            };
          } catch (err) {
            console.error("Error mapping paginated resource:", resource, err);
            return null;
          }
        })
        .filter(Boolean) as Preset[]; // Remove any null entries

      console.log("New mapped presets:", newPresets);

      set({
        cloudinaryPresets: [...cloudinaryPresets, ...newPresets],
        nextCursor: response.next_cursor || null,
        loadingCloudinary: false,
      });
    } catch (error) {
      console.error("Error loading more Cloudinary presets:", error);
      // Log more details about the error
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data: any; status: number };
        };
        if (axiosError.response) {
          console.error("Response data:", axiosError.response.data);
          console.error("Response status:", axiosError.response.status);
        }
      }

      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more Cloudinary presets",
        loadingCloudinary: false,
      });
    }
  },

  setSelectedPreset: (preset) => {
    set({ selectedPreset: preset });
  },

  setDefault: async (preset) => {
    try {
      // Use axios directly since apiClient doesn't have patch
      await axios.patch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/presets/${preset.id}/default`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      // Refresh presets to get updated default status
      get().fetchPresets();
    } catch (error) {
      console.error("Error setting default preset:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to set default preset",
      });
    }
  },

  createPreset: async (preset) => {
    try {
      await apiClient.post("/presets", preset);
      // Refresh presets after creation
      get().fetchPresets();
    } catch (error) {
      console.error("Error creating preset:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to create preset",
      });
    }
  },

  deletePreset: async (id) => {
    try {
      await apiClient.delete(`/presets/${id}`);

      // Clear activePreset if it matches the deleted preset
      const currentActivePreset = get().activePreset;
      if (currentActivePreset?.id === id) {
        set({ activePreset: null });
      }

      // Refresh presets after deletion
      get().fetchPresets();
    } catch (error) {
      console.error("Error deleting preset:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete preset",
      });
    }
  },
}));
