import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
interface Logo {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  publicId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  tags: string[];
}

interface CloudinaryResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
  rate_limit_allowed?: number;
  rate_limit_remaining?: number;
  rate_limit_reset_at?: string;
}

interface LogoStore {
  logos: Logo[];
  cloudinaryLogos: Logo[];
  selectedLogo: Logo | null;
  loading: boolean;
  loadingCloudinary: boolean;
  uploading: boolean;
  error: string | null;
  logoSize: number;
  nextCursor: string | null;

  fetchLogos: () => Promise<void>;
  fetchCloudinaryLogos: (folder?: string) => Promise<void>;
  loadMoreCloudinaryLogos: () => Promise<void>;
  setSelectedLogo: (logo: Logo | null) => void;
  setDefault: (logo: Logo) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  deleteLogo: (id: string) => Promise<void>;
  setLogoSize: (size: number) => void;
}

export const useLogoStore = create<LogoStore>((set, get) => ({
  logos: [],
  cloudinaryLogos: [],
  selectedLogo: null,
  loading: false,
  loadingCloudinary: false,
  uploading: false,
  error: null,
  logoSize: 100,
  nextCursor: null,

  fetchLogos: async () => {
    try {
      set({ loading: true, error: null });
      const data = await apiClient.get<Logo[]>("/logos");
      set({ logos: data });

      // Set the first default logo as selected, or the first logo if no default exists
      const defaultLogo = data.find((logo) => logo.isDefault) || data[0];
      if (defaultLogo && !get().selectedLogo) {
        set({ selectedLogo: defaultLogo });
      }
    } catch (err) {
      console.error("Error fetching logos:", err);
      set({ error: "Failed to load logos" });
    } finally {
      set({ loading: false });
    }
  },

  fetchCloudinaryLogos: async (folder = "logos") => {
    try {
      set({ loadingCloudinary: true, error: null });

      // First try to get logos from the logos endpoint with cloudinary source
      try {
        const data = await apiClient.getFromCloudinary<{
          resources: Logo[];
          next_cursor: string | null;
        }>("/logos", folder);
        console.log("data", data);
        set({
          cloudinaryLogos: data.resources,
          nextCursor: data.next_cursor,
        });
      } catch (endpointErr) {
        console.warn(
          "Endpoint-specific Cloudinary fetch failed, falling back to general resource fetch"
        );

        // Fallback to general Cloudinary resources endpoint
        const response =
          await apiClient.getCloudinaryResources<CloudinaryResponse>(folder);

        // Convert Cloudinary resources to our Logo format
        const logos = response.resources.map((resource) => ({
          id: resource.public_id,
          url: resource.secure_url,
          filename: resource.public_id.split("/").pop() || resource.public_id,
          mimeType: `image/${resource.format}`,
          size: resource.bytes,
          width: resource.width,
          height: resource.height,
          publicId: resource.public_id,
          isDefault:
            resource.public_id.includes("/defaults/") ||
            resource.tags?.includes("default") ||
            false,
          createdAt: resource.created_at,
          updatedAt: resource.created_at,
        }));

        set({
          cloudinaryLogos: logos,
          nextCursor: response.next_cursor || null,
        });
      }
    } catch (err) {
      console.error("Error fetching logos from Cloudinary:", err);
      set({ error: "Failed to load logos from Cloudinary" });
    } finally {
      set({ loadingCloudinary: false });
    }
  },

  loadMoreCloudinaryLogos: async () => {
    const { nextCursor, cloudinaryLogos, loadingCloudinary } = get();

    if (!nextCursor || loadingCloudinary) return;

    try {
      set({ loadingCloudinary: true, error: null });
      const response =
        await apiClient.getCloudinaryResources<CloudinaryResponse>(
          "logos",
          100,
          nextCursor
        );

      // Convert Cloudinary resources to our Logo format
      const newLogos = response.resources.map((resource) => ({
        id: resource.public_id,
        url: resource.secure_url,
        filename: resource.public_id.split("/").pop() || resource.public_id,
        mimeType: `image/${resource.format}`,
        size: resource.bytes,
        width: resource.width,
        height: resource.height,
        publicId: resource.public_id,
        isDefault: resource.tags?.includes("default") || false,
        createdAt: resource.created_at,
        updatedAt: resource.created_at,
      }));

      set({
        cloudinaryLogos: [...cloudinaryLogos, ...newLogos],
        nextCursor: response.next_cursor || null,
      });
    } catch (err) {
      console.error("Error loading more logos from Cloudinary:", err);
      set({ error: "Failed to load more logos from Cloudinary" });
    } finally {
      set({ loadingCloudinary: false });
    }
  },

  setSelectedLogo: (logo) => {
    set({ selectedLogo: logo });
  },

  setDefault: async (logo) => {
    try {
      set({ error: null });
      await apiClient.put(`/logos/${logo.id}`, { isDefault: true });
      set({ selectedLogo: logo });
      await get().fetchLogos();
    } catch (err) {
      console.error("Error setting default logo:", err);
      set({ error: "Failed to set default logo" });
    }
  },

  uploadLogo: async (file) => {
    try {
      set({ uploading: true, error: null });

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      await apiClient.uploadFile("/logos", file, { isDefault: false });
      await get().fetchLogos();
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      set({ error: err.message || "Failed to upload logo" });
    } finally {
      set({ uploading: false });
    }
  },

  deleteLogo: async (id) => {
    try {
      set({ error: null });
      await apiClient.delete(`/logos/${id}`);
      if (get().selectedLogo?.id === id) {
        set({ selectedLogo: null });
      }
      await get().fetchLogos();
    } catch (err) {
      console.error("Error deleting logo:", err);
      set({ error: "Failed to delete logo" });
    }
  },

  setLogoSize: (size) => {
    set({ logoSize: size });
  },
}));
