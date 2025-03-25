import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api-client";

// Define interfaces
export interface SavedImage {
  id: string;
  url: string;
  filename?: string;
}

export interface CanvasLogo {
  id: string;
  url: string;
  size: number;
  position: { x: number; y: number };
  isSelected: boolean;
}

export interface Filter {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;
}

interface ImageState {
  imageUrl: string | null;
  logos: CanvasLogo[];
  savedImages: SavedImage[];
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;

  // Actions
  setImage: (url: string) => void;
  clearMainImage: () => void;
  addLogo: (url: string) => void;
  updateLogo: (id: string, updates: Partial<Omit<CanvasLogo, "id">>) => void;
  selectLogo: (id: string | null) => void;
  deleteLogo: (id: string) => void;
  reorderLogos: (fromIndex: number, toIndex: number) => void;
  setFilter: (filter: Partial<Filter>) => void;
  resetFilter: () => void;
  clearLogos: () => void;
  clearSavedImages: () => void;
  reset: () => void;
  uploadImage: (file: File) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  fetchSavedImages: () => Promise<void>;
  fetchCloudinaryImages: (folder?: string) => Promise<void>;
}

export const useImageStore = create<ImageState>((set, get) => ({
  // Initial state
  imageUrl: null,
  logos: [],
  savedImages: [],
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  opacity: 100,

  // Actions
  setImage: (url) => {
    console.log("ImageStore: setImage called with URL:", url);
    console.log("ImageStore: URL type:", typeof url);
    console.log("ImageStore: URL details:", {
      length: url.length,
      startsWith: url.startsWith("http"),
      containsCloudinary: url.includes("cloudinary.com"),
    });

    set((state) => {
      console.log("ImageStore: Current state before setImage:", state);
      const newState = { imageUrl: url };
      console.log("ImageStore: New state after setImage:", newState);
      return newState;
    });
  },

  clearMainImage: () => set({ imageUrl: null }),

  addLogo: (url) => {
    set((state) => ({
      logos: [
        ...state.logos,
        {
          id: uuidv4(),
          url,
          size: 20,
          position: { x: 50, y: 50 },
          isSelected: false,
        },
      ],
    }));
  },

  updateLogo: (id, updates) => {
    set((state) => ({
      logos: state.logos.map((logo) =>
        logo.id === id ? { ...logo, ...updates } : logo
      ),
    }));
  },

  selectLogo: (id) => {
    set((state) => ({
      logos: state.logos.map((logo) => ({
        ...logo,
        isSelected: logo.id === id,
      })),
    }));
  },

  deleteLogo: (id) => {
    set((state) => ({
      logos: state.logos.filter((logo) => logo.id !== id),
    }));
  },

  reorderLogos: (fromIndex, toIndex) => {
    set((state) => {
      const logos = [...state.logos];
      const [removed] = logos.splice(fromIndex, 1);
      logos.splice(toIndex, 0, removed);
      return { logos };
    });
  },

  setFilter: (filter: Partial<Filter>) =>
    set((state) => ({
      brightness:
        filter.brightness !== undefined ? filter.brightness : state.brightness,
      contrast:
        filter.contrast !== undefined ? filter.contrast : state.contrast,
      saturation:
        filter.saturation !== undefined ? filter.saturation : state.saturation,
      sepia: filter.sepia !== undefined ? filter.sepia : state.sepia,
      opacity: filter.opacity !== undefined ? filter.opacity : state.opacity,
    })),

  resetFilter: () => {
    set({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    });
  },

  clearLogos: () => {
    set({ logos: [] });
  },

  clearSavedImages: () => {
    set({ savedImages: [] });
  },

  reset: () => {
    set({
      imageUrl: null,
      logos: [],
      savedImages: [],
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    });
  },

  uploadImage: async (file: File) => {
    try {
      console.log("ImageStore: Starting upload for file:", file.name);
      console.log("ImageStore: File details:", {
        type: file.type,
        size: file.size,
      });

      const data = await apiClient.uploadFile<{
        id: string;
        url: string;
        secure_url: string;
        public_id: string;
        filename: string;
      }>("/images/upload", file);

      console.log("ImageStore: Upload response:", data);

      const imageUrl = data.secure_url || data.url;
      console.log("ImageStore: Extracted imageUrl:", imageUrl);

      set((state) => {
        console.log("ImageStore: Current state before update:", state);
        const newState = {
          savedImages: [
            ...state.savedImages,
            {
              id: data.public_id || data.id,
              url: imageUrl,
              filename: file.name,
            },
          ],
          imageUrl: imageUrl,
        };
        console.log("ImageStore: New state after update:", newState);
        return newState;
      });

      console.log("ImageStore: Upload and state update completed successfully");
    } catch (error) {
      console.error("ImageStore: Error uploading image:", error);
      throw error;
    }
  },

  deleteImage: async (id: string) => {
    try {
      await apiClient.delete(`/${id}?source=cloudinary`);

      set((state) => ({
        savedImages: state.savedImages.filter((img) => img.id !== id),
        imageUrl:
          state.savedImages.find((img) => img.id === id)?.url === state.imageUrl
            ? null
            : state.imageUrl,
      }));
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  fetchSavedImages: async () => {
    try {
      const images = await apiClient.get<SavedImage[]>("/images");
      set({ savedImages: images });
    } catch (error) {
      console.error("Error fetching saved images:", error);
      throw error;
    }
  },

  fetchCloudinaryImages: async (folder: string = "images") => {
    try {
      const images = await apiClient.get<
        {
          id: string;
          public_id: string;
          secure_url: string;
          url: string;
          filename?: string;
        }[]
      >(`/images?source=cloudinary&folder=${folder}`);

      set((state) => ({
        savedImages: images.map((image) => ({
          id: image.public_id || image.id,
          url: image.secure_url || image.url,
          filename:
            image.filename || image.public_id?.split("/").pop() || "Image",
        })),
      }));
    } catch (error) {
      console.error("Error fetching Cloudinary images:", error);
      throw error;
    }
  },
}));
