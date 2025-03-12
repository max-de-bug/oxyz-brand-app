import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api-client";

export interface SavedImage {
  id: string;
  url: string;
  filename?: string;
}

// Define the logo object type
export interface CanvasLogo {
  id: string;
  url: string;
  size: number;
  position: { x: number; y: number };
  isSelected: boolean;
}

interface ImageState {
  // Main image source
  imageUrl: string | null;

  // Multiple logos
  logos: CanvasLogo[];

  // Filter values
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;

  // Saved images
  savedImages: SavedImage[];

  // Actions
  setImage: (url: string | null) => void;
  clearMainImage: () => void;
  addLogo: (url: string) => void;
  updateLogo: (id: string, updates: Partial<Omit<CanvasLogo, "id">>) => void;
  selectLogo: (id: string | null) => void;
  deleteLogo: (id: string) => void;
  reorderLogos: (fromIndex: number, toIndex: number) => void;
  setFilter: (
    filter: Partial<{
      brightness: number;
      contrast: number;
      saturation: number;
      sepia: number;
    }>
  ) => void;
  resetFilter: () => void;
  clearLogos: () => void;
  reset: () => void;
  uploadImage: (file: File) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  fetchSavedImages: () => Promise<void>;
  fetchCloudinaryImages: (folder?: string) => Promise<void>;
}

export const useImageStore = create<ImageState>((set, get) => ({
  // Default values
  imageUrl: null,
  logos: [],
  savedImages: [],
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,

  // Actions
  setImage: (url) => set({ imageUrl: url }),

  clearMainImage: () => set({ imageUrl: null }),

  addLogo: (url) => {
    console.log("Adding logo to store:", url);

    // Create a new logo with a unique ID
    const newLogo: CanvasLogo = {
      id: uuidv4(),
      url,
      size: 20, // Default to 20% of canvas size
      position: { x: 50, y: 50 }, // Center position (percentage)
      isSelected: true,
    };

    set((state) => {
      // Deselect all other logos
      const updatedLogos = state.logos.map((logo) => ({
        ...logo,
        isSelected: false,
      }));

      // Add the new logo
      const newLogos = [...updatedLogos, newLogo];
      console.log("Updated logos array:", newLogos);

      return {
        logos: newLogos,
      };
    });
  },

  updateLogo: (id, updates) =>
    set((state) => ({
      logos: state.logos.map((logo) =>
        logo.id === id ? { ...logo, ...updates } : logo
      ),
    })),

  selectLogo: (id) =>
    set((state) => ({
      logos: state.logos.map((logo) => ({
        ...logo,
        isSelected: logo.id === id,
      })),
    })),

  deleteLogo: (id) =>
    set((state) => ({
      logos: state.logos.filter((logo) => logo.id !== id),
    })),

  reorderLogos: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.logos.length ||
        toIndex < 0 ||
        toIndex >= state.logos.length
      ) {
        return state;
      }

      const newLogos = [...state.logos];
      const [movedLogo] = newLogos.splice(fromIndex, 1);
      newLogos.splice(toIndex, 0, movedLogo);

      return { logos: newLogos };
    }),

  setFilter: (filter) =>
    set((state) => ({
      ...state,
      ...filter,
    })),

  resetFilter: () =>
    set((state) => ({
      ...state,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    })),

  clearLogos: () => set({ logos: [] }),

  reset: () => {
    set({
      imageUrl: null,
      logos: [],
      savedImages: [],
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    });
  },

  uploadImage: async (file: File) => {
    // Implementation of uploadImage
  },

  deleteImage: async (id: string) => {
    // Implementation of deleteImage
  },

  fetchSavedImages: async () => {
    // Implementation of fetchSavedImages
  },

  fetchCloudinaryImages: async (folder?: string) => {
    // Implementation of fetchCloudinaryImages
  },
}));
