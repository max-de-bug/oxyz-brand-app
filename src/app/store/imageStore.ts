import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "@/lib/api-client";
import { usePresetStore } from "@/app/store/presetStore";
import { useDesignStore } from "./designStore";

// Define interfaces
export interface SavedImage {
  id: string;
  url: string;
  filename?: string;
  publicId?: string;
  width?: number;
  height?: number;
}

export interface CanvasLogo {
  id: string;
  url: string;
  size: number;
  position: { x: number; y: number };
  rotation: number;
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
  addLogo: (url: string) => string;
  updateLogo: (id: string, updates: Partial<Omit<CanvasLogo, "id">>) => void;
  selectLogo: (id: string | null) => void;
  deleteLogo: (id: string) => void;
  reorderLogos: (fromIndex: number, toIndex: number) => void;
  setFilter: (filter: Partial<Filter>) => void;
  resetFilter: () => void;
  clearLogos: () => void;
  clearSavedImages: () => void;
  reset: () => void;
  uploadImage: (file: File) => Promise<SavedImage>;
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
    const {
      setCurrentDesignId,
      setTextOverlay,
      deleteText,
      selectTextById,
      clearTextOverlays,
    } = useDesignStore.getState();

    set({
      imageUrl: null,
      logos: [],
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    });

    // Clear legacy text overlay
    setTextOverlay({
      text: "",
      isVisible: false,
      color: "#FFFFFF",
      fontFamily: "Arial",
      fontSize: 24,
      isBold: false,
      isItalic: false,
      position: { x: 50, y: 50 },
      translationX: 0,
      translationY: 0,
      rotation: 0,
      spacing: 0,
      isSelected: false,
    });
    deleteText();

    // Clear all text overlays from the textOverlays array
    clearTextOverlays();

    // Ensure no text is selected
    selectTextById(null);

    setActivePreset(null);
    setSelectedPreset(null);
    setCurrentDesignId(null);
  },

  addLogo: (url) => {
    const newLogo = {
      id: uuidv4(),
      url,
      size: 20,
      position: { x: 50, y: 50 },
      rotation: 0,
      isSelected: false,
    };
    set((state) => ({
      logos: [...state.logos, newLogo],
    }));
    return newLogo.id;
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

  uploadImage: async (file: File): Promise<SavedImage> => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.uploadFile<SavedImage>(
        "images/upload",
        file
      );

      // Add the newly uploaded image to the savedImages array
      set((state) => ({
        savedImages: [response, ...state.savedImages],
        isLoading: false,
      }));

      // Return the uploaded image data
      return response;
    } catch (error) {
      set({ error: "Failed to upload image", isLoading: false });
      throw error;
    }
  },

  deleteImage: async (publicId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      console.log("Deleting image with ID/publicId:", publicId);

      // Check if the publicId includes users/ path format
      if (publicId.includes("users/")) {
        // This is a Cloudinary public_id - extract folder type
        const pathParts = publicId.split("/");
        // Format would be "users/[userId]/images/..."
        const folderType = pathParts.length > 2 ? pathParts[2] : "images";

        // Make sure we're always passing the folder parameter in the URL
        await apiClient.delete(
          `images/cloudinary/${encodeURIComponent(
            publicId
          )}?folder=${folderType}`
        );
      } else {
        // This is a DB ID - use the standard endpoint
        await apiClient.delete(`images/${publicId}`);
      }

      // Update state: remove the deleted image and clear main image if it was selected
      set((state) => {
        // Find the image that's being deleted to get its URL if needed
        const deletedImage = state.savedImages.find(
          (img) => img.id === publicId || img.publicId === publicId
        );

        return {
          // Remove the image from the savedImages list
          savedImages: state.savedImages.filter(
            (img) => img.id !== publicId && img.publicId !== publicId
          ),
          // Clear main image if it was the one deleted
          imageUrl:
            deletedImage?.url === state.imageUrl ? null : state.imageUrl,
          isLoading: false,
        };
      });

      console.log("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      set({
        error: "Failed to delete image",
        isLoading: false,
      });
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
