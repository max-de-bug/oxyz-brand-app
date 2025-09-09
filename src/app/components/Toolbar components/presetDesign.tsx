"use client";

import React, { useEffect, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Cloud,
  Upload,
  Check,
  Trash2,
  Sliders,
  Plus,
} from "lucide-react";
import { usePresetStore, Preset } from "@/app/store/presetStore";
import { useImageStore } from "@/app/store/imageStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/store/auth-context";
import { Badge } from "@/components/ui/badge";
import { Carousel } from "@/components/ui/carousel";
import {
  useCloudinaryPresets,
  useDeletePreset,
} from "@/lib/api/queries/preset-queries";
import Link from "next/link";

const PresetDesigns = () => {
  const { session } = useAuth();
  const {
    addImage,
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    reset,
  } = useImageStore();
  const {
    cloudinaryPresets: displayPresets,
    selectedPreset,
    activePreset,
    loading,
    error,
    nextCursor,
    fetchCloudinaryPresets,
    loadMoreCloudinaryPresets,
    setSelectedPreset,
    setActivePreset,
    deletePreset,
  } = usePresetStore();

  // React Query hooks
  const {
    data: presetsData,
    isLoading: loadingPresets,
    error: presetsError,
    refetch: refetchPresets,
  } = useCloudinaryPresets();

  const deletePresetMutation = useDeletePreset();

  // Use the data from React Query
  const displayPresetsData = presetsData?.resources || [];
  const nextCursorData = presetsData?.next_cursor;

  // useEffect(() => {
  //   if (session) {
  //     fetchCloudinaryPresets();
  //   }
  // }, [session, fetchCloudinaryPresets]);

  const isPresetSelected = useCallback(
    (presetId: string) => {
      return activePreset?.id === presetId;
    },
    [activePreset]
  );

  const handlePresetClick = (preset: Preset, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Prevent unnecessary renders by checking if this preset is already active
    if (activePreset?.id === preset.id) {
      console.log("Preset already active, no need to re-apply");
      return;
    }

    // Create a stable filter copy
    const filterSettings = preset.filter
      ? {
          brightness: preset.filter.brightness || 100,
          contrast: preset.filter.contrast || 100,
          saturation: preset.filter.saturation || 100,
          sepia: preset.filter.sepia || 0,
          opacity:
            preset.filter.opacity !== undefined ? preset.filter.opacity : 100,
        }
      : null;

    // Use React batch update to apply changes simultaneously
    // This ensures a single render cycle for all state updates
    setActivePreset(preset);
    setSelectedPreset(preset);

    // If we have filter settings, apply them
    if (filterSettings) {
      setBrightness(filterSettings.brightness);
      setContrast(filterSettings.contrast);
      setSaturation(filterSettings.saturation);
      setSepia(filterSettings.sepia);
      setOpacity(filterSettings.opacity);
    }

    // Apply image if present
    if (preset.url) {
      addImage(preset.url);
    }
  };

  const handleRemovePreset = () => {
    reset();
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this preset?")) {
      try {
        await deletePresetMutation.mutateAsync(id);
        await refetchPresets();
      } catch (error) {
        console.error("Error deleting preset:", error);
      }
    }
  };

  const renderPresetCard = useCallback(
    (preset: Preset) => {
      const isSelected = isPresetSelected(preset.id);

      return (
        <div
          key={preset.id}
          onClick={() => handlePresetClick(preset)}
          className={`relative p-2 border rounded transition-all cursor-pointer w-[140px] h-[200px] flex flex-col
          ${
            isSelected
              ? "border-blue-500"
              : "border-gray-200 dark:border-gray-700"
          }
          ${
            preset.isDefault
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-white dark:bg-gray-800"
          }
          ${!isSelected ? "hover:border-blue-300 hover:shadow-md" : ""}`}
        >
          <div
            className="flex justify-between mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs truncate max-w-[80%]">
              {preset.name || preset.id.split("/").pop() || "Preset"}
            </div>
            {!session && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePreset(preset.id);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="group flex-grow">
            {preset.url ? (
              <div className="flex justify-center items-center p-2 bg-gray-50 dark:bg-gray-900 rounded mb-2 h-[100px]">
                <img
                  src={preset.url}
                  alt={preset.name || "Preset"}
                  className="object-contain max-h-24 max-w-[90%] transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/preset-placeholder.jpg";
                  }}
                />
              </div>
            ) : (
              <div
                className="h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded mb-2 transition-transform group-hover:scale-105"
                style={{
                  filter: `
                  brightness(${preset.filter?.brightness || 100}%) 
                  contrast(${preset.filter?.contrast || 100}%) 
                  saturate(${preset.filter?.saturation || 100}%) 
                  sepia(${preset.filter?.sepia || 0}%)
                `,
                  opacity: `${(preset.filter?.opacity || 100) / 100}`,
                }}
              ></div>
            )}
          </div>

          <button
            onClick={(e) => handlePresetClick(preset, e)}
            className={`w-full text-xs p-2 rounded flex items-center justify-center gap-1 mt-auto
            ${
              isSelected
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            {isSelected ? (
              <>
                <Check size={12} /> Selected
              </>
            ) : (
              <>
                <Plus size={12} /> Add to Canvas
              </>
            )}
          </button>
        </div>
      );
    },
    [isPresetSelected, handlePresetClick, session, handleDeletePreset]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading presets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-500">Error loading presets</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCloudinaryPresets()}
            className="mt-2"
          >
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Preset Designs</h2>
          <div className="text-xs text-gray-500">Sign in to manage presets</div>
        </div>

        {/* Active Preset Section - Keep visible for all users */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">
            Active Preset {activePreset ? "(1)" : "(0)"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {activePreset ? (
              <Badge
                key={activePreset.id}
                variant="default"
                className="group flex items-center gap-2 cursor-pointer pr-2"
              >
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-purple-500" />
                <span className="max-w-[60px] truncate">
                  {activePreset.name || "Preset"}
                </span>
                <button
                  onClick={() => handleRemovePreset()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={12} />
                </button>
              </Badge>
            ) : (
              <span className="text-xs text-gray-500">
                No preset applied to canvas
              </span>
            )}
          </div>
        </div>

        {/* Sign in prompt */}
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Sliders size={24} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">
                Sign in to Access Presets
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px]">
                Sign in to create, manage, and save your favorite presets
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
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Preset Designs</h2>
        <button
          onClick={() => refetchPresets()}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
          disabled={loadingPresets}
        >
          {loadingPresets ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">
          Active Preset {activePreset ? "(1)" : "(0)"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {activePreset ? (
            <Badge
              key={activePreset.id}
              variant="default"
              className="group flex items-center gap-2 cursor-pointer pr-2"
            >
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-purple-500" />
              <span className="max-w-[60px] truncate">
                {activePreset.name || "Preset"}
              </span>
              <button
                onClick={() => handleRemovePreset()}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={12} />
              </button>
            </Badge>
          ) : (
            <span className="text-xs text-gray-500">
              No preset applied to canvas
            </span>
          )}
        </div>
      </div>

      {presetsError && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
          {presetsError.message}
        </div>
      )}

      {loadingPresets ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-6">
          {displayPresetsData && displayPresetsData.length > 0 ? (
            <>
              <h3 className="text-sm font-medium mb-4">
                Available Presets ({displayPresetsData.length})
              </h3>
              <Carousel
                items={displayPresetsData.map((preset: any) =>
                  renderPresetCard(preset)
                )}
                itemsPerView={2}
                spacing={16}
                className="py-3"
              />
            </>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No presets found.
            </div>
          )}
        </div>
      )}

      {nextCursorData && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMoreCloudinaryPresets}
            className="px-4 py-2 text-sm bg-gray-800 rounded hover:bg-gray-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetDesigns;
