"use client";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import { useState, useEffect } from "react";

const SavedDesigns = () => {
  const {
    savedDesigns,
    saveCurrentDesign,
    loadSavedDesign,
    deleteSavedDesign,
    fetchSavedDesigns,
    isLoading,
    imageId,
    currentDesignId,
  } = useDesignStore();
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );

  // Fetch saved designs on component mount
  useEffect(() => {
    fetchSavedDesigns();
  }, [fetchSavedDesigns]);

  // Handle saving the current design
  const handleSaveDesign = async () => {
    if (!imageId) {
      alert("No image selected. Please add an image first.");
      return;
    }

    try {
      await saveCurrentDesign();
    } catch (error) {
      console.error("Error saving design:", error);
      alert("Failed to save design. Please try again.");
    }
  };

  // Handle loading a saved design
  const handleLoadDesign = async (designId: string) => {
    try {
      await loadSavedDesign(designId);
    } catch (error) {
      console.error("Error loading design:", error);
      alert("Failed to load design. Please try again.");
    }
  };

  // Handle deleting a saved design with confirmation
  const handleDeleteDesign = async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the load design action

    if (showConfirmDelete === designId) {
      try {
        await deleteSavedDesign(designId);
        setShowConfirmDelete(null);
      } catch (error) {
        console.error("Error deleting design:", error);
        alert("Failed to delete design. Please try again.");
      }
    } else {
      setShowConfirmDelete(designId);
    }
  };

  // Generate a color for the design thumbnail based on its properties
  const getDesignColor = (design: {
    preset?: { filter?: { sepia?: number; saturation?: number } };
    textOverlay?: { color?: string };
    source?: string;
    url?: string;
  }) => {
    if (design.preset?.filter?.sepia) {
      return `rgba(210, 167, 106, ${design.preset.filter.sepia})`;
    }
    if (design.preset?.filter?.saturation === 0) {
      return "#888888"; // B&W filter
    }
    return design.textOverlay?.color || "#000000";
  };

  return (
    <div className="my-4">
      <h2 className="text-xs font-medium mb-2">Saved Designs:</h2>
      <div className="flex gap-2 flex-wrap">
        {isLoading ? (
          <div className="flex items-center justify-center w-8 h-8">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <>
            {savedDesigns.map((design) => (
              <div key={design.id} className="relative">
                <button
                  className={`w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 ${
                    currentDesignId === design.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => handleLoadDesign(design.id)}
                  title={design.name}
                  disabled={isLoading}
                  style={{
                    backgroundColor: getDesignColor(design),
                    backgroundImage: design.url ? `url(${design.url})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Visual representation of the design */}
                  {design.textOverlay?.text &&
                    design.textOverlay.isVisible &&
                    !design.url && (
                      <span className="text-xs truncate text-white">
                        {design.textOverlay.text.charAt(0)}
                      </span>
                    )}
                </button>
                <button
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    showConfirmDelete === design.id
                      ? "bg-red-700"
                      : "bg-red-500"
                  }`}
                  onClick={(e) => handleDeleteDesign(design.id, e)}
                  title={
                    showConfirmDelete === design.id
                      ? "Click again to confirm delete"
                      : "Delete this design"
                  }
                  disabled={isLoading}
                >
                  {isLoading && showConfirmDelete === design.id ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
            ))}
            <button
              className="w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center"
              onClick={handleSaveDesign}
              title="Save current design"
              disabled={isLoading || !imageId}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SavedDesigns;
