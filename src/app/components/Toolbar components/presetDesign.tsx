"use client";

import React, { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

const PresetDesigns = () => {
  const { session } = useAuth();
  const { setImage, setFilter } = useImageStore();
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

  useEffect(() => {
    if (session) {
      fetchCloudinaryPresets();
    }
  }, [session, fetchCloudinaryPresets]);

  useEffect(() => {
    if (selectedPreset) {
      if (selectedPreset.filter) {
        setFilter({
          brightness: selectedPreset.filter.brightness || 100,
          contrast: selectedPreset.filter.contrast || 100,
          saturation: selectedPreset.filter.saturation || 100,
          sepia: selectedPreset.filter.sepia || 0,
          opacity:
            selectedPreset.filter.opacity !== undefined
              ? selectedPreset.filter.opacity
              : 100,
        });
      }

      if (selectedPreset.url) {
        setImage(selectedPreset.url);
      }
    }
  }, [selectedPreset, setFilter, setImage]);

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

    setActivePreset(preset);
    setSelectedPreset(preset);

    if (preset.filter) {
      setFilter({
        brightness: preset.filter.brightness || 100,
        contrast: preset.filter.contrast || 100,
        saturation: preset.filter.saturation || 100,
        sepia: preset.filter.sepia || 0,
        opacity:
          preset.filter.opacity !== undefined ? preset.filter.opacity : 100,
      });
    }

    if (preset.url) {
      setImage(preset.url);
    }
  };

  const handleRemovePreset = () => {
    const { clearMainImage } = useImageStore.getState();
    clearMainImage();
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this preset?")) {
      await deletePreset(id);
    }
  };

  const renderPresetCard = useCallback(
    (preset: Preset) => {
      const isSelected = isPresetSelected(preset.id);

      return (
        <div
          key={preset.id}
          onClick={() => handlePresetClick(preset)}
          className={`relative p-2 border rounded transition-all cursor-pointer
          ${isSelected ? "border-blue-500" : "border-gray-200"}
          ${preset.isDefault ? "bg-blue-50" : ""}
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

          <div className="group">
            {preset.url ? (
              <div className="flex justify-center p-2 bg-gray-50 rounded mb-2">
                <img
                  src={preset.url}
                  alt={preset.name || "Preset"}
                  className="object-contain max-h-24 transition-transform group-hover:scale-105"
                  style={{
                    maxWidth: "100%",
                    filter: `
                    brightness(${preset.filter?.brightness || 100}%) 
                    contrast(${preset.filter?.contrast || 100}%) 
                    saturate(${preset.filter?.saturation || 100}%) 
                    sepia(${preset.filter?.sepia || 0}%)
                  `,
                    opacity: `${(preset.filter?.opacity || 100) / 100}`,
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
            className={`w-full text-xs p-2 rounded flex items-center justify-center gap-1
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

  if (!session) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Preset Designs</h2>
        <button
          onClick={(e) => fetchCloudinaryPresets()}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
          disabled={loading}
        >
          {loading ? (
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

      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-6">
          {displayPresets && displayPresets.length > 0 ? (
            <>
              <h3 className="text-sm font-medium mb-4">
                Available Presets ({displayPresets.length})
              </h3>
              <Carousel
                items={displayPresets.map((preset) => renderPresetCard(preset))}
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

      {nextCursor && (
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
