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

export interface CanvasImage {
  id: string;
  url: string;
  position: { x: number; y: number };
  scale: number;
  isSelected: boolean;
  zIndex: number;
}

export interface CanvasLogo {
  id: string;
  url: string;
  position: { x: number; y: number };
  size: number;
  rotation: number;
  isSelected: boolean;
}

export interface Filter {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;
  blur: number;
}

interface ImageState {
  images: CanvasImage[];
  logos: CanvasLogo[];
  savedImages: SavedImage[];
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;
  blur: number;
  isLoading: boolean;
  error: string | null;
  selectedImageId: string | null;

  // Actions
  addImage: (url: string) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, updates: Partial<Omit<CanvasImage, "id">>) => void;
  selectImage: (id: string | null) => void;
  reorderImage: (id: string, newZIndex: number) => void;
  addLogo: (url: string) => void;
  removeLogo: (id: string) => void;
  updateLogo: (id: string, updates: Partial<Omit<CanvasLogo, "id">>) => void;
  selectLogo: (id: string | null) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setSepia: (value: number) => void;
  setOpacity: (value: number) => void;
  setBlur: (value: number) => void;
  reset: () => void;
  uploadImage: (file: File) => Promise<SavedImage>;
  deleteImage: (id: string) => Promise<void>;
  fetchSavedImages: () => Promise<void>;
  fetchCloudinaryImages: (userId: string) => Promise<void>;
  fetchUserImages: () => Promise<void>;
  clearError: () => void;
  setImage: (url: string) => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
  // Initial state
  images: [],
  logos: [],
  savedImages: [],
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  opacity: 100,
  blur: 0,
  isLoading: false,
  error: null,
  selectedImageId: null,

  // Actions
  addImage: (url) =>
    set((state) => ({
      images: [
        ...state.images,
        {
          id: crypto.randomUUID(),
          url,
          position: { x: 50, y: 50 },
          scale: 1,
          isSelected: true,
          zIndex: state.images.length,
        },
      ],
    })),

  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImageId:
        state.selectedImageId === id ? null : state.selectedImageId,
    })),

  updateImage: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),

  selectImage: (id) =>
    set((state) => ({
      images: state.images.map((img) => ({
        ...img,
        isSelected: img.id === id,
      })),
      selectedImageId: id,
    })),

  reorderImage: (id, newZIndex) =>
    set((state) => {
      const images = [...state.images];
      const oldIndex = images.findIndex((img) => img.id === id);
      if (oldIndex === -1) return state;

      const [movedImage] = images.splice(oldIndex, 1);
      images.splice(newZIndex, 0, movedImage);

      return {
        images: images.map((img, index) => ({
          ...img,
          zIndex: index,
        })),
      };
    }),

  addLogo: (url) =>
    set((state) => ({
      logos: [
        ...state.logos,
        {
          id: crypto.randomUUID(),
          url,
          position: { x: 50, y: 50 },
          size: 20,
          rotation: 0,
          isSelected: true,
        },
      ],
    })),

  removeLogo: (id) =>
    set((state) => ({
      logos: state.logos.filter((logo) => logo.id !== id),
    })),

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

  setBrightness: (value) => set({ brightness: value }),
  setContrast: (value) => set({ contrast: value }),
  setSaturation: (value) => set({ saturation: value }),
  setSepia: (value) => set({ sepia: value }),
  setOpacity: (value) => set({ opacity: value }),
  setBlur: (value) => set({ blur: value }),

  reset: () => {
    set({
      images: [],
      logos: [],
      savedImages: [],
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
      blur: 0,
    });
  },

  setImage: (url) =>
    set((state) => ({
      images: [
        {
          id: crypto.randomUUID(),
          url,
          position: { x: 50, y: 50 },
          scale: 1,
          isSelected: true,
          zIndex: 0,
        },
        ...state.images.map((img) => ({
          ...img,
          isSelected: false,
          zIndex: img.zIndex + 1,
        })),
      ],
    })),

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

      // Update state: remove the deleted image and clear selected image if it was selected
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
          // Remove the image from the images array if it exists
          images: state.images.filter((img) => img.url !== deletedImage?.url),
          // Clear selected image if it was the one deleted
          selectedImageId:
            state.selectedImageId === deletedImage?.id
              ? null
              : state.selectedImageId,
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
