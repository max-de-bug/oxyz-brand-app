"use client";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import { useImageStore } from "@/app/store/imageStore";
import { useState } from "react";
import { useAuth } from "@/app/store/auth-context";
import {
  useSaveDesign,
  useSavedDesigns,
  useDeleteSavedDesign,
} from "@/lib/api/queries";
import { toast } from "@/hooks/use-toast";

// Define the SavedDesign type
interface SavedDesign {
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

  // Get current design state
  const { imageUrl, logos, brightness, contrast, saturation, sepia, opacity } =
    useImageStore();

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
      // Prepare the design payload
      const designPayload = {
        imageUrl,
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

  // Return early if user is not authenticated
  if (!session) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Saved Designs</h2>
        <div className="text-center p-4 border border-dashed rounded">
          <p className="text-sm text-gray-500">
            Please sign in to save designs
          </p>
        </div>
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
              className={`relative aspect-square rounded-lg overflow-hidden border-2
                ${
                  currentDesignId === design.id
                    ? "border-blue-500"
                    : "border-transparent"
                }
              `}
            >
              <img
                src={design.imageUrl}
                alt={design.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDeleteDesign(design.id)}
                disabled={deletingId === design.id}
                className={`absolute top-1 right-1 p-1 rounded-full 
                  ${
                    showConfirmDelete === design.id
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white`}
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
