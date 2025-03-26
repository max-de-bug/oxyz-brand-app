import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api-client";
import { usePresetStore } from "@/app/store/presetStore";

// Define interfaces
export interface SavedImage {
  id: string;
  url: string;
  filename?: string;
  publicId?: string;
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
  isLoading: boolean;
  error: string | null;

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
  fetchCloudinaryImages: (userId: string) => Promise<void>;
  fetchUserImages: () => Promise<void>;
  clearError: () => void;
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
  isLoading: false,
  error: null,

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

  clearMainImage: () => {
    // Get the preset store actions
    const { setActivePreset, setSelectedPreset } = usePresetStore.getState();

    // Clear everything in one action
    set({
      imageUrl: null,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    });

    // Clear preset states
    setActivePreset(null);
    setSelectedPreset(null);
  },

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

  uploadImage: async (file: File): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.uploadFile<SavedImage>(
        "images/upload",
        file
      );
      set((state) => ({
        savedImages: [response, ...state.savedImages],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: "Failed to upload image", isLoading: false });
      throw error;
    }
  },

  deleteImage: async (publicId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`images/${publicId}`);
      set((state) => ({
        savedImages: state.savedImages.filter((img) => img.id !== publicId),
        imageUrl: state.imageUrl === publicId ? null : state.imageUrl,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: "Failed to delete image", isLoading: false });
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

  fetchCloudinaryImages: async (userId: string) => {
    try {
      const response = await apiClient.get<{ images: any[]; total: number }>(
        `/images/user/${userId}`
      );

      if (response && response.images) {
        const images = response.images.map((image) => ({
          id: image.id,
          url: image.url,
          publicId: image.publicId,
          filename: image.filename || image.publicId.split("/").pop(),
          mimeType: image.mimeType,
          size: image.size,
          width: image.width,
          height: image.height,
        }));

        set({ savedImages: images });
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      set({ savedImages: [] }); // Set empty array on error
      throw error;
    }
  },

  fetchUserImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<any>("images");
      set({
        savedImages: response.resources || [],
        isLoading: false,
      });
    } catch (error) {
      console.warn("No images found or error fetching images");
      set({
        savedImages: [],
        isLoading: false,
        error: null, // Don't set error for empty results
      });
    }
  },

  clearError: () => set({ error: null }),
}));
