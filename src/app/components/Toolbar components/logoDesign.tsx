"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  Cloud,
  Upload,
  Check,
  Trash2,
  Plus,
  LogIn,
} from "lucide-react";
import { useLogoStore } from "@/store/logoStore";
import { useImageStore } from "@/app/store/imageStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/store/auth-context";
import { Carousel } from "@/components/ui/carousel";
import { useCloudinaryLogos, useDeleteLogo } from "@/lib/api/queries";

const LogoDesigns = () => {
  const { session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { logos, addLogo } = useImageStore();

  // Separate the query and mutation hooks
  const {
    data: logosData,
    isLoading: loading,
    error,
    refetch: refetchLogos,
  } = useCloudinaryLogos();

  // Use the delete mutation hook separately
  const deleteLogoMutation = useDeleteLogo();

  const {
    fetchCloudinaryLogos,
    loadMoreCloudinaryLogos,
    setSelectedLogo,
    setDefault,
    uploadLogo,
    selectedLogo,
  } = useLogoStore();

  // Use the data from React Query
  const displayLogos = logosData?.resources || [];
  const nextCursor = logosData?.next_cursor;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setSelectedFile(file);
    setUploading(true);

    try {
      await uploadLogo(file);
      setSelectedFile(null);
      // Reset the file input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
    }
  };
  const isLogoOnCanvas = useCallback((logoUrl: string) => {
    const { logos: canvasLogos } = useImageStore.getState();
    return canvasLogos.some((logo) => logo.url === logoUrl);
  }, []);

  const handleLogoClick = useCallback(
    (logo: any) => {
      setSelectedLogo(logo);
      // Get the URL from the logo object
      const logoUrl = logo.url || (logo as any).secure_url;

      if (logoUrl && !isLogoOnCanvas(logoUrl)) {
        addLogo(logoUrl);
      }
    },
    [setSelectedLogo, addLogo, isLogoOnCanvas]
  );

  const handleAddLogoToCanvas = useCallback(
    (logo: any) => {
      // Get the URL from the logo object
      const logoUrl = logo.url || (logo as any).secure_url;

      if (logoUrl) {
        console.log("Adding logo to canvas:", logoUrl);
        addLogo(logoUrl);
      } else {
        console.error("Logo URL is undefined:", logo);
      }
    },
    [addLogo]
  );

  const handleDeleteLogo = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this logo?")) {
        try {
          await deleteLogoMutation.mutateAsync(id);
          await refetchLogos();
        } catch (error) {
          console.error("Error deleting logo:", error);
        }
      }
    },
    [deleteLogoMutation, refetchLogos]
  );

  // Add this function to remove logo from canvas
  const handleRemoveFromCanvas = useCallback((logoId: string) => {
    const {
      logos: canvasLogos,
      updateLogo,
      deleteLogo: removeFromCanvas,
    } = useImageStore.getState();
    removeFromCanvas(logoId);
  }, []);

  // Add this function to check if logo is on canvas

  const renderLogoCard = useCallback(
    (logo: any) => {
      const logoUrl = logo.url || (logo as any).secure_url;
      const isOnCanvas = isLogoOnCanvas(logoUrl);

      return (
        <div
          key={logo.id}
          className={`relative p-2 border rounded transition-all cursor-pointer
          ${
            selectedLogo?.id === logo.id ? "border-blue-500" : "border-gray-200"
          }
          ${logo.isDefault ? "bg-blue-50" : ""}
          ${!isOnCanvas ? "hover:border-blue-300 hover:shadow-md" : ""}
        `}
          onClick={() => handleLogoClick(logo)}
        >
          <div
            className="flex justify-between mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs truncate max-w-[80%]">
              {logo.filename || logo.publicId?.split("/").pop() || "Logo"}
            </div>
            <button
              onClick={() => handleDeleteLogo(logo.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex justify-center p-2 bg-gray-50 rounded group">
            <img
              src={logoUrl}
              alt={logo.filename || "Logo"}
              className="object-contain max-h-24 transition-transform group-hover:scale-105"
              style={{ maxWidth: "100%" }}
            />
          </div>
          <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddLogoToCanvas(logo);
              }}
              className={`flex-1 text-xs p-1 rounded flex items-center justify-center gap-1
              ${
                isOnCanvas
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isOnCanvas ? (
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
        </div>
      );
    },
    [
      selectedLogo,
      isLogoOnCanvas,
      handleLogoClick,
      handleDeleteLogo,
      handleAddLogoToCanvas,
    ]
  );

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Logo Designs</h2>
        <button
          onClick={() => refetchLogos()}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
          {error.message || String(error)}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="logo-upload" className="block mb-2 cursor-pointer">
          <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-600">
            <Upload size={16} />
            <span>Upload Logo</span>
          </div>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </Label>
        {uploading && (
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {/* Updated Canvas Logos Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">
          Active Logos ({logos.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {logos.length > 0 ? (
            logos.map((logo) => (
              <Badge
                key={logo.id}
                variant={logo.isSelected ? "default" : "outline"}
                className="group flex items-center gap-2 cursor-pointer pr-2"
              >
                <img
                  src={logo.url || (logo as any).secure_url || ""}
                  alt="Logo"
                  className="w-4 h-4 object-contain"
                />
                <span className="max-w-[60px] truncate">Logo</span>
                <button
                  onClick={() => handleRemoveFromCanvas(logo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={12} />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-500">
              No logos added to canvas
            </span>
          )}
        </div>
      </div>

      {/* Updated Logo Grid with Carousel */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-6">
          {displayLogos && displayLogos.length > 0 ? (
            <>
              <h3 className="text-sm font-medium mb-4">
                Available Logos ({displayLogos.length})
              </h3>
              <Carousel
                items={displayLogos.map((logo: any) => renderLogoCard(logo))}
                itemsPerView={2}
                spacing={16}
                className="py-3"
              />
            </>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No logos found.
            </div>
          )}
        </div>
      )}

      {nextCursor && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMoreCloudinaryLogos}
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

export default LogoDesigns;
