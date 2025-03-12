import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

interface Typography {
  id: string;
  name: string;
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

interface TypographyStore {
  typography: Typography[];
  cloudinaryTypography: Typography[];
  selectedTypography: Typography | null;
  loading: boolean;
  loadingCloudinary: boolean;
  uploading: boolean;
  error: string | null;
  textSize: number;
  nextCursor: string | null;

  fetchTypography: () => Promise<void>;
  fetchCloudinaryTypography: (folder?: string) => Promise<void>;
  loadMoreCloudinaryTypography: () => Promise<void>;
  setSelectedTypography: (typography: Typography | null) => void;
  setDefault: (typography: Typography) => Promise<void>;
  uploadTypography: (file: File) => Promise<void>;
  deleteTypography: (id: string) => Promise<void>;
  setTextSize: (size: number) => void;
}

export const useTypographyStore = create<TypographyStore>((set, get) => ({
  typography: [],
  cloudinaryTypography: [],
  selectedTypography: null,
  loading: false,
  loadingCloudinary: false,
  uploading: false,
  error: null,
  textSize: 100,
  nextCursor: null,

  fetchTypography: async () => {
    try {
      set({ loading: true, error: null });
      const data = await apiClient.get<Typography[]>("/typography");
      set({ typography: data });

      // Set the first default typography as selected, or the first typography if no default exists
      const defaultTypography = data.find((typo) => typo.isDefault) || data[0];
      if (defaultTypography && !get().selectedTypography) {
        set({ selectedTypography: defaultTypography });
      }
    } catch (err) {
      console.error("Error fetching typography:", err);
      set({ error: "Failed to load typography designs" });
    } finally {
      set({ loading: false });
    }
  },

  fetchCloudinaryTypography: async (folder = "typography") => {
    try {
      set({ loadingCloudinary: true, error: null });

      // First try to get typography from the typography endpoint with cloudinary source
      try {
        const data = await apiClient.getFromCloudinary<Typography[]>(
          "/typography",
          folder
        );
        set({ cloudinaryTypography: data, nextCursor: null });
      } catch (endpointErr) {
        console.warn(
          "Endpoint-specific Cloudinary fetch failed, falling back to general resource fetch"
        );

        // Fallback to general Cloudinary resources endpoint
        const response =
          await apiClient.getCloudinaryResources<CloudinaryResponse>(folder);

        // Convert Cloudinary resources to our Typography format
        const typographyItems = response.resources.map((resource) => ({
          id: resource.public_id,
          name: resource.public_id.split("/").pop() || resource.public_id,
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
          cloudinaryTypography: typographyItems,
          nextCursor: response.next_cursor || null,
        });
      }
    } catch (err) {
      console.error("Error fetching typography from Cloudinary:", err);
      set({ error: "Failed to load typography from Cloudinary" });
    } finally {
      set({ loadingCloudinary: false });
    }
  },

  loadMoreCloudinaryTypography: async () => {
    const { nextCursor, cloudinaryTypography, loadingCloudinary } = get();

    if (!nextCursor || loadingCloudinary) return;

    try {
      set({ loadingCloudinary: true, error: null });
      const response =
        await apiClient.getCloudinaryResources<CloudinaryResponse>(
          "typography",
          100,
          nextCursor
        );

      // Convert Cloudinary resources to our Typography format
      const newTypography = response.resources.map((resource) => ({
        id: resource.public_id,
        name: resource.public_id.split("/").pop() || resource.public_id,
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
        cloudinaryTypography: [...cloudinaryTypography, ...newTypography],
        nextCursor: response.next_cursor || null,
      });
    } catch (err) {
      console.error("Error loading more typography from Cloudinary:", err);
      set({ error: "Failed to load more typography from Cloudinary" });
    } finally {
      set({ loadingCloudinary: false });
    }
  },

  setSelectedTypography: (typography) => {
    set({ selectedTypography: typography });
  },

  setDefault: async (typography) => {
    try {
      set({ error: null });
      await apiClient.put(`/typography/${typography.id}`, { isDefault: true });
      set({ selectedTypography: typography });
      await get().fetchTypography();
    } catch (err) {
      console.error("Error setting default typography:", err);
      set({ error: "Failed to set default typography" });
    }
  },

  uploadTypography: async (file) => {
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

      await apiClient.uploadFile("/typography", file, { isDefault: false });
      await get().fetchTypography();
    } catch (err: any) {
      console.error("Error uploading typography:", err);
      set({ error: err.message || "Failed to upload typography" });
    } finally {
      set({ uploading: false });
    }
  },

  deleteTypography: async (id) => {
    try {
      set({ error: null });
      await apiClient.delete(`/typography/${id}`);
      if (get().selectedTypography?.id === id) {
        set({ selectedTypography: null });
      }
      await get().fetchTypography();
    } catch (err) {
      console.error("Error deleting typography:", err);
      set({ error: "Failed to delete typography" });
    }
  },

  setTextSize: (size) => {
    set({ textSize: size });
  },
}));
