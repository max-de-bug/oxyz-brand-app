"use client";
import { Plus, Trash2, Loader2, Cloud } from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import { useImageStore } from "@/app/store/imageStore";
import { useState } from "react";
import { useAuth } from "@/app/store/auth-context";
import { signIn } from "next-auth/react";
import {
  useSaveDesign,
  useSavedDesigns,
  useDeleteSavedDesign,
} from "@/lib/api/queries";
import { toast } from "@/hooks/use-toast";
import { captureVisibleCanvas } from "./exportControls";
import Link from "next/link";

// Define the SavedDesign type
interface SavedDesign {
  id: string;
  name: string;
  imageUrl: string;
  filter?: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
    opacity: number;
  };
  textOverlay?: {
    text: string;
    isVisible: boolean;
    color: string;
    fontFamily: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
  };
  logos?: Array<{
    url: string;
    position: { x: number; y: number };
    size: number;
  }>;
  aspectRatio: string;
}

const SavedDesigns = () => {
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get access to the canvas capture function

  // Get current design state
  const {
    imageUrl,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    clearMainImage,
  } = useImageStore();

  const { textOverlay, aspectRatio, currentDesignId, setCurrentDesignId } =
    useDesignStore();

  // React Query hooks with type annotation
  const saveDesignMutation = useSaveDesign();
  const deleteDesignMutation = useDeleteSavedDesign();
  const { data: savedDesigns = [], isLoading: isLoadingDesigns } =
    useSavedDesigns();

  // Handle saving the current design
  const handleSaveDesign = async () => {
    if (!imageUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add an image to save a design",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Capture canvas as image using the imported function
      const capturedImage = await captureVisibleCanvas();

      if (!capturedImage) {
        throw new Error("Failed to capture canvas");
      }

      // Prepare the design payload
      const designPayload = {
        id: `design-${Date.now()}`, // Add generated id to fix the type error
        imageUrl: capturedImage, // Send the captured canvas image
        name: `Design ${(savedDesigns as SavedDesign[]).length + 1}`,
        filter: {
          brightness,
          contrast,
          saturation,
          sepia,
          opacity,
        },
        textOverlay: textOverlay.isVisible ? textOverlay : undefined,
        logos: logos.map((logo) => ({
          url: logo.url,
          position: logo.position,
          size: logo.size,
        })),
        aspectRatio,
      };

      // Save the design
      await saveDesignMutation.mutateAsync(designPayload);

      toast({
        title: "Success",
        description: "Design saved successfully!",
      });
    } catch (error) {
      console.error("Error saving design:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save design. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      // First click - show confirmation
      if (!showConfirmDelete || showConfirmDelete !== designId) {
        setShowConfirmDelete(designId);
        toast({
          title: "Confirm deletion",
          description: "Click the delete button again to confirm.",
          duration: 3000,
        });
        clearMainImage();
        return;
      }

      // Second click - delete immediately
      setShowConfirmDelete(null);

      // Clear the current design immediately if it was the one we're deleting
      if (currentDesignId === designId) {
        setCurrentDesignId(null);
      }

      // Start deletion process
      deleteDesignMutation.mutate(designId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Design deleted successfully!",
          });
        },
        onError: (error) => {
          console.error("Error deleting design:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete design. Please try again.",
          });
        },
      });
    } catch (error) {
      setShowConfirmDelete(null);
      console.error("Error in delete handler:", error);
    }
  };

  const handleLoadDesign = (design: SavedDesign) => {
    // Set current design ID in the store
    setCurrentDesignId(design.id);

    // Load the main image
    if (design.imageUrl) {
      useImageStore.getState().setImage(design.imageUrl);
    }

    // Apply filters if present
    if (design.filter) {
      useImageStore.getState().setFilter({
        brightness: design.filter.brightness,
        contrast: design.filter.contrast,
        saturation: design.filter.saturation,
        sepia: design.filter.sepia,
        opacity: design.filter.opacity,
      });
    }

    // Clear existing logos first
    useImageStore.getState().clearLogos();

    // Add logos if present

    // Set text overlay if present
    if (design.textOverlay) {
      useDesignStore.getState().setTextOverlay(design.textOverlay);
    } else {
      // Clear text overlay if not present in the design
      useDesignStore.getState().setTextOverlay({
        text: "",
        isVisible: false,
        color: "#FFFFFF",
        fontFamily: "Arial",
        fontSize: 24,
        isBold: false,
        isItalic: false,
      });
    }

    // Set aspect ratio if present
    if (design.aspectRatio) {
      useDesignStore.getState().setAspectRatio(design.aspectRatio);
    }

    // Show success toast
    toast({
      title: "Design Loaded",
      description: "The selected design has been loaded to the canvas.",
    });
  };

  // Return early if user is not authenticated
  if (!session) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Saved Designs</h2>
          <div className="text-xs text-gray-500">Sign in to save designs</div>
        </div>

        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Cloud size={24} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">
                Sign in to Save Your Designs
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                Sign in to save, manage, and access your designs across devices
              </p>
            </div>
            <Link
              href="/auth/sign-in"
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              aria-label="sign-in"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Preview Features */}
        {imageUrl && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Current Design</h3>
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 relative">
              <img
                src={imageUrl}
                alt="Current design"
                className="w-full h-full object-cover"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%)`,
                  opacity: opacity / 100,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <p className="text-white text-sm font-medium">
                  Sign in to save this design
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Saved Designs</h2>
        <button
          onClick={handleSaveDesign}
          disabled={isSaving || !imageUrl}
          className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 
            ${!imageUrl ? "opacity-50 cursor-not-allowed" : ""}`}
          title={
            imageUrl ? "Save current design" : "Add an image to save design"
          }
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {isLoadingDesigns ? (
          <div className="col-span-4 flex justify-center py-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (savedDesigns as SavedDesign[]).length > 0 ? (
          (savedDesigns as SavedDesign[]).map((design) => (
            <div
              key={design.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer
                ${
                  currentDesignId === design.id
                    ? "border-blue-500"
                    : "border-transparent"
                }
                transition-all duration-200 ease-in-out
                hover:shadow-md hover:scale-[1.02] hover:border-blue-300
                group
              `}
              onClick={() => handleLoadDesign(design)}
            >
              <img
                src={design.imageUrl}
                alt={design.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-white font-medium truncate">
                  {design.name}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDesign(design.id);
                }}
                disabled={deletingId === design.id}
                className={`
                  absolute top-1 right-1 p-1 rounded-full
                  ${
                    showConfirmDelete === design.id
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-500 hover:bg-red-600"
                  }
                  text-white transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100
                  transition-all duration-200 ease-in-out
                `}
                title={
                  showConfirmDelete === design.id
                    ? "Click again to confirm deletion"
                    : "Delete design"
                }
              >
                {deletingId === design.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-4 text-gray-500">
            No saved designs yet
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDesigns;
