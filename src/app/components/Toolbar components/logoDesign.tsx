"use client";

import React, { useState, useCallback } from "react";
import { Loader2, RefreshCw, Check, Trash2, Plus } from "lucide-react";
import { useLogoStore } from "@/store/logoStore";
import { useImageStore } from "@/app/store/imageStore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/store/auth-context";
import { Carousel } from "@/components/ui/carousel";
import { useCloudinaryLogos, useDeleteLogo } from "@/lib/api/queries";
import Link from "next/link";

const LogoDesigns = () => {
  const { session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { logos, addLogo } = useImageStore();
  const { removeLogo } = useImageStore.getState();

  // Separate the query and mutation hooks
  const {
    data: logosData,
    isLoading: loading,
    error,
    refetch: refetchLogos,
  } = useCloudinaryLogos();

  // Use the delete mutation hook separately
  const deleteLogoMutation = useDeleteLogo();

  const { loadMoreCloudinaryLogos, setSelectedLogo, uploadLogo, selectedLogo } =
    useLogoStore();

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
        addLogo(logoUrl);
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
    removeLogo(logoId);
  }, []);

  const renderLogoCard = useCallback(
    (logo: any) => {
      const logoUrl = logo.url || (logo as any).secure_url;
      const isOnCanvas = isLogoOnCanvas(logoUrl);

      return (
        <div
          key={logo.id}
          onClick={() => handleLogoClick(logo)}
          className={`relative p-2 border rounded transition-all cursor-pointer w-[140px] h-[200px] flex flex-col
          ${
            isOnCanvas
              ? "border-blue-500"
              : "border-gray-200 dark:border-gray-700"
          }
          ${
            logo.isDefault
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-white dark:bg-gray-800"
          }
          ${!isOnCanvas ? "hover:border-blue-300 hover:shadow-md" : ""}`}
        >
          <div
            className="flex justify-between mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs truncate max-w-[80%]">
              {logo.filename || logo.publicId?.split("/").pop() || "Logo"}
            </div>
            {!session && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLogo(logo.id);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="group flex-grow">
            <div className="flex justify-center items-center p-2 bg-gray-50 dark:bg-gray-900 rounded mb-2 h-[100px]">
              <img
                src={logoUrl}
                alt={logo.filename || "Logo"}
                className="object-contain max-h-24 max-w-[90%] transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.jpg";
                }}
              />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddLogoToCanvas(logo);
            }}
            className={`w-full text-xs p-2 rounded flex items-center justify-center gap-1 mt-auto
              ${
                isOnCanvas
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-white"
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
      );
    },
    [
      selectedLogo,
      isLogoOnCanvas,
      handleLogoClick,
      handleAddLogoToCanvas,
      session,
      handleDeleteLogo,
    ]
  );

  if (!session) {
    return (
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Logo Designs</h2>
          <div className="text-xs text-gray-500">Sign in to manage logos</div>
        </div>

        {/* Active Logos Section - Keep visible for all users */}
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

        {/* Sign in prompt */}
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Plus size={24} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">
                Sign in to Access Logo Library
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px]">
                Sign in to upload, manage, and save your favorite logos
              </p>
            </div>
            <Link
              href="/auth/sign-in"
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              aria-label="Sign-in"
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
        <h2 className="text-lg font-semibold">Logo Designs</h2>
        <button
          onClick={() => refetchLogos()}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-600 text-white"
          disabled={loading}
          aria-label="Refresh logos"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-md flex items-center gap-2">
          <span className="font-medium">Error:</span>{" "}
          {error.message || String(error)}
        </div>
      )}

      {/* Active Logos Section */}
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
        <div className="flex justify-center items-center py-12 min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Loading logos...</p>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {displayLogos && displayLogos.length > 0 ? (
            <>
              <h3 className="text-sm font-medium mb-4">
                Available Logos ({displayLogos.length})
              </h3>
              <Carousel
                items={displayLogos.map((logo: any) => renderLogoCard(logo))}
                itemsPerView={2}
                spacing={16}
                className="py-2"
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
            className="px-4 py-2 text-sm bg-gray-800 rounded hover:bg-gray-700 text-white transition-colors"
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
