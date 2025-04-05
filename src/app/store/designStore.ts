import { create } from "zustand";
import {
  DesignsService,
  Design,
  CreateDesignDto,
} from "../services/designs.service";
import { ImagesService } from "../services/images.service";
import { LogosService } from "../services/logos.service";
import { apiClient } from "@/lib/api-client";

// Update the Design interface to include designState
declare module "../services/designs.service" {
  interface Design {
    designState?: any;
  }
}

export interface PresetFilter {
  name: string;
  filter: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    sepia?: number;
  };
}

export interface TextOverlay {
  id: string;
  text: string;
  isVisible: boolean;
  color: string;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  rotation: number;
  spacing: number;
  translationX: number;
  translationY: number;
  isSelected?: boolean;
  position: {
    x: number;
    y: number;
  };
}

interface DesignState {
  rotation: number;
  colorValue: string;
  translationX: number;
  translationY: number;
  minSize: number;
  maxSize: number;
  spacing: number;
  selectedPreset: PresetFilter;
  imageUrl: string;
  textOverlay: TextOverlay;
  savedDesigns: Design[];
  isLoading: boolean;
  imageId: string | null;
  logoId: string | null;
  currentDesignId: string | null;
  designs: Design[];
  loading: boolean;
  error: string | null;
  aspectRatio: string;
  setCurrentDesignId: (id: string | null) => void;

  setRotation: (rotation: number) => void;
  setColorValue: (colorValue: string) => void;
  setTranslationX: (translationX: number) => void;
  setTranslationY: (translationY: number) => void;
  setMinSize: (minSize: number) => void;
  setMaxSize: (maxSize: number) => void;
  setSpacing: (spacing: number) => void;
  setSelectedPreset: (preset: PresetFilter) => void;
  setImageUrl: (imageUrl: string, imageId: string | null) => void;
  setLogoId: (logoId: string | null) => void;
  setTextOverlay: (updates: Partial<TextOverlay>) => void;
  selectText: (selected: boolean) => void;
  deleteText: () => void;
  setAspectRatio: (ratio: string) => void;

  fetchSavedDesigns: () => Promise<void>;
  saveCurrentDesign: (name?: string) => Promise<Design>;
  loadSavedDesign: (designId: string) => Promise<void>;
  deleteSavedDesign: (designId: string) => Promise<void>;

  setTextRotation: (rotation: number) => void;
  setTextSpacing: (spacing: number) => void;
  setTextTranslationX: (translationX: number) => void;
  setTextTranslationY: (translationY: number) => void;

  textOverlays: TextOverlay[];
  addText: (text: string) => void;
  updateText: (id: string, updates: Partial<Omit<TextOverlay, "id">>) => void;
  deleteTextById: (id: string) => void;
  selectTextById: (id: string | null) => void;
  getSelectedText: () => TextOverlay | undefined;
}

export const presetFilters: PresetFilter[] = [
  { name: "Normal", filter: {} },
  { name: "Bright", filter: { brightness: 1.2 } },
  { name: "Vintage", filter: { sepia: 0.5, contrast: 1.1 } },
  { name: "B&W", filter: { saturation: 0 } },
  { name: "High Contrast", filter: { contrast: 1.4, brightness: 1.1 } },
  { name: "Warm", filter: { sepia: 0.3, brightness: 1.1 } },
  { name: "Cool", filter: { brightness: 1.05, saturation: 0.7 } },
];

export const useDesignStore = create<DesignState>((set, get) => {
  // Helper function to load a design from an object
  const loadDesignFromObject = async (design: Design) => {
    try {
      // Handle Cloudinary designs
      if (design.source === "cloudinary") {
        // For Cloudinary designs, we might already have the image URL
        set({
          imageId: design.imageId,
          logoId: design.logoId || null,
          currentDesignId: design.id,
          imageUrl: design.url || "",
        });

        // Parse design state if needed
        const designState =
          typeof design.designState === "string"
            ? JSON.parse(design.designState)
            : design.designState || {};

        // Set design properties
        set({
          rotation: designState.position?.rotation || 0,
          translationX: designState.position?.translationX || 0,
          translationY: designState.position?.translationY || 0,
          minSize: designState.position?.minSize || 0,
          maxSize: designState.position?.maxSize || 100,
          spacing: designState.position?.spacing || 0,
          selectedPreset: designState.preset || presetFilters[0],
          textOverlay: designState.textOverlay || {
            id: "default",
            text: "",
            isVisible: false,
            color: "#000000",
            fontFamily: "ABCDiatype-Regular",
            fontSize: 24,
            isBold: false,
            isItalic: false,
            rotation: 0,
            spacing: 0,
            translationX: 0,
            translationY: 0,
            position: { x: 50, y: 50 },
          },
          isLoading: false,
        });

        console.log("Cloudinary design loaded successfully:", design.id);
        return;
      }

      // Handle database designs
      // First, set the IDs
      set({
        imageId: design.imageId,
        logoId: design.logoId || null,
        currentDesignId: design.id,
      });

      // Then load the image
      try {
        const image = await ImagesService.getImage(design.imageId);
        set({ imageUrl: image.url });
        console.log("Image loaded:", image.url);
      } catch (imageError) {
        console.error("Error fetching image:", imageError);
        // Set a placeholder or default image URL
        set({ imageUrl: "" });
        throw new Error("Could not load the image for this design");
      }

      // If there's a logo, try to load it too
      if (design.logoId) {
        try {
          const logo = await LogosService.getLogo(design.logoId);
          // If you have a state property for logo URL, set it here
          console.log("Logo loaded:", logo.url);
        } catch (logoError) {
          console.warn(
            "Error fetching logo, continuing without it:",
            logoError
          );
          // We can continue without the logo
        }
      }

      // Set all the design properties
      set({
        rotation: design.position.rotation,
        translationX: design.position.translationX,
        translationY: design.position.translationY,
        minSize: design.position.minSize,
        maxSize: design.position.maxSize,
        spacing: design.position.spacing,
        selectedPreset: design.preset,
        textOverlay: { ...design.textOverlay }, // Create a copy to avoid reference issues
        isLoading: false,
      });

      console.log("Design loaded successfully:", design.id);
    } catch (error) {
      console.error("Error in loadDesignFromObject:", error);
      set({ isLoading: false });
      throw error;
    }
  };

  return {
  rotation: 0,
  colorValue: "#000000",
  translationX: -500,
  translationY: 10,
  minSize: 0,
  maxSize: 0,
  spacing: 0,
    selectedPreset: presetFilters[0],
    imageUrl: "",
    textOverlay: {
      id: "default",
      text: "",
      isVisible: false,
      color: "#000000",
      fontFamily: "ABCDiatype-Regular",
      fontSize: 24,
      isBold: false,
      isItalic: false,
      rotation: 0,
      spacing: 0,
      translationX: 0,
      translationY: 0,
      position: { x: 50, y: 50 },
    },
    savedDesigns: [],
    isLoading: false,
    imageId: null,
    logoId: null,
    currentDesignId: null,
    designs: [],
    loading: false,
    error: null,
    aspectRatio: "4:3",
    setCurrentDesignId: (id) => set({ currentDesignId: id }),

  setRotation: (rotation) => set({ rotation }),
  setColorValue: (colorValue) => set({ colorValue }),
  setTranslationX: (translationX) => set({ translationX }),
  setTranslationY: (translationY) => set({ translationY }),
  setMinSize: (minSize) => set({ minSize }),
  setMaxSize: (maxSize) => set({ maxSize }),
  setSpacing: (spacing) => set({ spacing }),
    setSelectedPreset: (preset) => set({ selectedPreset: preset }),
    setImageUrl: (imageUrl, imageId) => set({ imageUrl, imageId }),
    setLogoId: (logoId) => set({ logoId }),
    setTextOverlay: (updates) =>
      set((state) => {
        // If text is being updated, ensure visibility
        if ("text" in updates && updates.text && !state.textOverlay.isVisible) {
          return {
            textOverlay: {
              ...state.textOverlay,
              ...updates,
              isVisible: true,
            },
          };
        }
        return {
          textOverlay: { ...state.textOverlay, ...updates },
        };
      }),
    selectText: (selected) =>
      set((state) => ({
        textOverlay: { ...state.textOverlay, isSelected: selected },
      })),
    deleteText: () =>
      set((state) => ({
        textOverlay: {
          ...state.textOverlay,
          isVisible: false,
          text: "",
          isSelected: false,
        },
      })),
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

    fetchSavedDesigns: async () => {
      set({ loading: true, error: null });
      try {
        const response = await apiClient.get<Design[]>("/designs");
        set({ savedDesigns: response, loading: false });
      } catch (error) {
        console.error("Error fetching designs:", error);
        set({
          loading: false,
          error: "Failed to load designs. Please try again.",
          savedDesigns: [],
        });
      }
    },

    saveCurrentDesign: async (name?: string) => {
      try {
        set({ isLoading: true });
        const state = get();

        if (!state.imageId) {
          throw new Error("No image selected. Please add an image first.");
        }

        const designName =
          name ||
          `Design ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        // Capture the current canvas state if available
        let imageData = null;
        const canvas = document.querySelector("canvas");
        if (canvas) {
          try {
            imageData = canvas.toDataURL("image/png");
          } catch (e) {
            console.warn("Could not capture canvas:", e);
          }
        }

        // Create the design data object
        const designData: CreateDesignDto = {
          name: designName,
          imageId: state.imageId,
          logoId: state.logoId || undefined,
          preset: state.selectedPreset,
          textOverlay: state.textOverlay,
          position: {
            translationX: state.translationX,
            translationY: state.translationY,
            rotation: state.rotation,
            minSize: state.minSize,
            maxSize: state.maxSize,
            spacing: state.spacing,
          },
        };

        let savedDesign: Design;

        // If we have a current design ID, update it; otherwise create a new one
        if (state.currentDesignId) {
          try {
            const existingDesign = await DesignsService.getDesign(
              state.currentDesignId
            );

            if (existingDesign) {
              savedDesign = await DesignsService.updateDesign(
                state.currentDesignId,
                designData
              );
              console.log("Design updated successfully:", savedDesign.id);
            } else {
              savedDesign = await DesignsService.createDesign(designData);
              console.log(
                "Design created successfully (previous design not found):",
                savedDesign.id
              );
            }
          } catch (error) {
            console.warn(
              "Error updating design, creating new one instead:",
              error
            );
            savedDesign = await DesignsService.createDesign(designData);
            console.log("New design created as fallback:", savedDesign.id);
          }
        } else {
          savedDesign = await DesignsService.createDesign(designData);
          console.log("New design created:", savedDesign.id);
        }

        // If we have image data, also save to Cloudinary
        if (imageData) {
          try {
            // Convert base64 to blob
            const response = await fetch(imageData);
            const blob = await response.blob();

            // Create a file from the blob
            const file = new File([blob], `${designName}.png`, {
              type: "image/png",
            });

            // Prepare additional data for the upload
            const additionalData = {
              name: designName,
              designState: JSON.stringify({
                preset: state.selectedPreset,
                textOverlay: state.textOverlay,
                position: {
                  translationX: state.translationX,
                  translationY: state.translationY,
                  rotation: state.rotation,
                  minSize: state.minSize,
                  maxSize: state.maxSize,
                  spacing: state.spacing,
                },
              }),
            };

            // Upload the design image using the uploadFile method
            await apiClient.uploadFile("designs/upload", file, additionalData);

            console.log("Design also saved to Cloudinary");
          } catch (cloudinaryError) {
            console.warn("Error saving to Cloudinary:", cloudinaryError);
            // Continue even if Cloudinary save fails
          }
        }

        // Refresh the designs list
        await get().fetchSavedDesigns();

        set({
          currentDesignId: savedDesign.id,
          isLoading: false,
        });

        return savedDesign;
      } catch (error) {
        console.error("Error saving design:", error);
        set({ isLoading: false });

        // Rethrow with a more user-friendly message
        if (error instanceof Error) {
          throw new Error(`Failed to save design: ${error.message}`);
        } else {
          throw new Error("Failed to save design. Please try again.");
        }
      }
    },

    loadSavedDesign: async (designId) => {
      try {
        set({ isLoading: true });

        // First check if we're already loading this design
        if (get().currentDesignId === designId && !get().isLoading) {
          console.log("Design already loaded:", designId);
          set({ isLoading: false });
          return;
        }

        console.log("Loading design:", designId);

        // First check if the design is in the local state
        const savedDesigns = get().savedDesigns;
        const localDesign = savedDesigns.find((d) => d.id === designId);

        // If we have the design locally, use it directly
        if (localDesign) {
          console.log("Loading design from local state:", designId);
          await loadDesignFromObject(localDesign);
          return;
        }

        // Otherwise, fetch it from the API
        const design = await DesignsService.getDesign(designId);

        if (!design) {
          throw new Error("Design not found");
        }

        await loadDesignFromObject(design);
      } catch (error) {
        console.error("Error loading design:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    deleteSavedDesign: async (designId) => {
      try {
        set({ isLoading: true });

        // Find the design in the local state
        const design = get().savedDesigns.find((d) => d.id === designId);

        if (!design) {
          throw new Error("Design not found");
        }

        // Handle deletion based on the source
        if (design.source === "cloudinary") {
          // For Cloudinary designs, delete the asset from Cloudinary
          if (design.publicId) {
            await apiClient.delete(
              `designs/asset/${encodeURIComponent(design.publicId)}`
            );
          } else {
            throw new Error("Cannot delete design: missing publicId");
          }
        } else {
          // For database designs, use the regular delete endpoint
          await DesignsService.deleteDesign(designId);
        }

        // Update local state
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((d) => d.id !== designId),
          currentDesignId:
            state.currentDesignId === designId ? null : state.currentDesignId,
          isLoading: false,
        }));

        console.log("Design deleted successfully:", designId);
      } catch (error) {
        console.error("Error deleting design:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    setTextRotation: (rotation: number) =>
      set((state) => ({
        textOverlay: { ...state.textOverlay, rotation },
      })),
    setTextSpacing: (spacing: number) =>
      set((state) => ({
        textOverlay: { ...state.textOverlay, spacing },
      })),
    setTextTranslationX: (translationX: number) =>
      set((state) => ({
        textOverlay: { ...state.textOverlay, translationX },
      })),
    setTextTranslationY: (translationY: number) =>
      set((state) => ({
        textOverlay: { ...state.textOverlay, translationY },
      })),

    textOverlays: [],
    addText: (text) =>
      set((state) => {
        const id = `text-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newText: TextOverlay = {
          id,
          text,
          isVisible: true,
          color: "#000000",
          fontFamily: "ABCDiatype-Regular",
          fontSize: 24,
          isBold: false,
          isItalic: false,
          rotation: 0,
          spacing: 0,
          translationX: 0,
          translationY: 0,
          isSelected: true,
          position: { x: 50, y: 50 },
        };

        // Deselect any previously selected text
        const updatedTexts = state.textOverlays.map((text) => ({
          ...text,
          isSelected: false,
        }));

        return {
          textOverlays: [...updatedTexts, newText],
        };
      }),

    updateText: (id, updates) =>
      set((state) => {
        const updatedTexts = state.textOverlays.map((text) =>
          text.id === id ? { ...text, ...updates } : text
        );

        return { textOverlays: updatedTexts };
      }),

    deleteTextById: (id) =>
      set((state) => ({
        textOverlays: state.textOverlays.filter((text) => text.id !== id),
      })),

    selectTextById: (id) =>
      set((state) => ({
        textOverlays: state.textOverlays.map((text) => ({
          ...text,
          isSelected: text.id === id,
        })),
      })),

    getSelectedText: () => {
      return get().textOverlays.find((text) => text.isSelected);
    },
  };
});
