"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  Cloud,
  Upload,
  Check,
  Trash2,
  Plus,
} from "lucide-react";
import { useLogoStore } from "@/store/logoStore";
import { useImageStore } from "@/app/store/imageStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const LogoDesigns = () => {
  const { data: session } = useSession();
  const [showCloudinary, setShowCloudinary] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Get the image store to apply logo
  const { logos, addLogo } = useImageStore();

  const {
    logos: storeLogos,
    cloudinaryLogos,
    selectedLogo,
    loading,
    loadingCloudinary,
    error,
    nextCursor,
    fetchLogos,
    fetchCloudinaryLogos,
    loadMoreCloudinaryLogos,
    setSelectedLogo,
    setDefault,
    uploadLogo,
    deleteLogo,
  } = useLogoStore();

  // Fetch logos when session changes
  useEffect(() => {
    if (session) {
      fetchLogos();
    }
  }, [session, fetchLogos]);

  // Fetch cloudinary logos when showCloudinary changes
  useEffect(() => {
    if (session && showCloudinary) {
      fetchCloudinaryLogos();
    }
  }, [session, showCloudinary, fetchCloudinaryLogos]);

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
  const handleLogoClick = useCallback(
    (logo: any) => {
      setSelectedLogo(logo);
    },
    [setSelectedLogo]
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
        await deleteLogo(id);
      }
    },
    [deleteLogo]
  );

  const toggleSource = useCallback(() => {
    setShowCloudinary((prev) => !prev);
  }, []);

  const displayLogos = showCloudinary ? cloudinaryLogos : storeLogos;
  const isLoading = showCloudinary ? loadingCloudinary : loading;

  if (!session) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Logo Designs</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleSource}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            {showCloudinary ? "Show Local" : "Show Cloudinary"}{" "}
            <Cloud size={16} />
          </button>
          <button
            onClick={() =>
              showCloudinary ? fetchCloudinaryLogos() : fetchLogos()
            }
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="logo-upload" className="block mb-2 cursor-pointer">
          <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-50">
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

      {/* Canvas Logos Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">
          Logos on Canvas ({logos.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {logos.length > 0 ? (
            logos.map((logo) => (
              <Badge
                key={logo.id}
                variant={logo.isSelected ? "default" : "outline"}
                className="flex items-center gap-1 cursor-pointer"
              >
                <img
                  src={logo.url || (logo as any).secure_url || ""}
                  alt="Logo"
                  className="w-4 h-4 object-contain"
                />
                <span className="max-w-[60px] truncate">Logo</span>
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-500">
              No logos added to canvas
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayLogos && displayLogos.length > 0 ? (
            displayLogos.map((logo) => (
              <div
                key={logo.id}
                className={`relative p-2 border rounded ${
                  selectedLogo?.id === logo.id
                    ? "border-blue-500"
                    : "border-gray-200"
                } ${logo.isDefault ? "bg-blue-50" : ""}`}
              >
                <div className="flex justify-between mb-2">
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
                <div className="flex justify-center p-2 bg-gray-50 rounded">
                  <img
                    src={logo.url || (logo as any).secure_url || ""}
                    alt={logo.filename || "Logo"}
                    className="object-contain max-h-24 cursor-pointer"
                    style={{ maxWidth: "100%" }}
                    onClick={() => handleLogoClick(logo)}
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => handleAddLogoToCanvas(logo)}
                    className="flex-1 text-xs p-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add to Canvas
                  </button>
                  <button
                    onClick={() => setDefault(logo)}
                    className={`flex-1 text-xs p-1 rounded flex items-center justify-center gap-1 ${
                      logo.isDefault
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {logo.isDefault ? (
                      <>
                        <Check size={12} /> Default
                      </>
                    ) : (
                      "Set Default"
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-4 text-center text-gray-500">
              No logos found. Upload some logos to get started.
            </div>
          )}
        </div>
      )}

      {showCloudinary && nextCursor && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMoreCloudinaryLogos}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            disabled={loadingCloudinary}
          >
            {loadingCloudinary ? (
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
