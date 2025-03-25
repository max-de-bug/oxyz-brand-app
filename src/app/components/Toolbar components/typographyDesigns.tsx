"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Loader2, Type, RefreshCw, Cloud } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useTypographyStore } from "@/store/typographyStore";
import { useAuth } from "@/app/store/auth-context";

const TypographyDesigns = () => {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCloudinary, setShowCloudinary] = useState(false);

  const {
    typography,
    cloudinaryTypography,
    selectedTypography,
    loading,
    loadingCloudinary,
    uploading,
    error,
    textSize,
    nextCursor,
    fetchTypography,
    fetchCloudinaryTypography,
    loadMoreCloudinaryTypography,
    setSelectedTypography,
    setDefault,
    uploadTypography,
    deleteTypography,
    setTextSize,
  } = useTypographyStore();

  useEffect(() => {
    if (session && showCloudinary) {
      fetchCloudinaryTypography();
    }
  }, [session, showCloudinary, fetchCloudinaryTypography]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadTypography(file);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleDeleteTypography = async (id: string) => {
    if (!confirm("Are you sure you want to delete this typography?")) return;
    await deleteTypography(id);
  };

  const toggleSource = () => {
    setShowCloudinary(!showCloudinary);
  };

  const displayTypography = showCloudinary ? cloudinaryTypography : typography;
  const isLoading = showCloudinary ? loadingCloudinary : loading;

  if (!session) {
    return null;
  }

  return (
    <div className="my-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-medium">Typography:</h2>
        {/* <button
          onClick={toggleSource}
          className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700"
          title={
            showCloudinary
              ? "Show local typography"
              : "Show Cloudinary typography"
          }
        >
          {showCloudinary ? (
            <>Local</>
          ) : (
            <>
              <Cloud className="w-3 h-3" /> Cloudinary
            </>
          )}
        </button> */}
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Add Typography Button (only show for local) */}
        {!showCloudinary && (
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
              id="typography-upload"
            />
            <label
              htmlFor="typography-upload"
              className="w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </label>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
          </div>
        )}

        {/* Typography Preview/Select Buttons */}
        {!isLoading &&
          displayTypography.map((typo) => (
            <div key={typo.id} className="relative">
              <button
                className={`w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedTypography?.id === typo.id
                    ? "ring-2 ring-blue-500"
                    : "hover:ring-2 hover:ring-blue-300"
                }`}
                onClick={() => setDefault(typo)}
                title={typo.name}
              >
                <Image
                  src={typo.url}
                  alt={typo.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </button>
              {typo.isDefault && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          ))}

        {/* Empty State */}
        {!isLoading && displayTypography.length === 0 && (
          <div className="w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <Type className="w-4 h-4 text-neutral-500" />
          </div>
        )}
      </div>

      {/* Load More Button (for Cloudinary) */}
      {showCloudinary && cloudinaryTypography.length > 0 && nextCursor && (
        <button
          onClick={loadMoreCloudinaryTypography}
          disabled={loadingCloudinary}
          className="w-full mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingCloudinary ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Load more
        </button>
      )}

      {/* Error Message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Text Size Controls */}
      {selectedTypography && (
        <div className="mt-2">
          <label
            htmlFor="text-size"
            className="text-xs text-gray-500 block mb-1"
          >
            Text Size: {textSize}%
          </label>
          <input
            id="text-size"
            type="range"
            min="20"
            max="200"
            value={textSize}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
            onChange={(e) => setTextSize(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
};

export default TypographyDesigns;
