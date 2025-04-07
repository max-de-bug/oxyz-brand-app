"use client";

import React, { useState, useCallback } from "react";
import { Loader2, Upload, Plus, Trash2, RefreshCw, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImageStore } from "@/app/store/imageStore";
import { signIn } from "next-auth/react";
import { useAuth } from "@/app/store/auth-context";
import { Carousel } from "@/components/ui/carousel";
import {
  useUserImages,
  useUploadImage,
  useDeleteImage,
} from "@/lib/api/queries";
import Image from "next/image";
import Link from "next/link";

const ImageUploader = () => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Zustand store for UI state and selected image
  const { imageUrl, setImage, savedImages, clearSavedImages } = useImageStore();

  // React Query for data fetching and mutations
  const {
    data: imagesData,
    isLoading: isLoadingImages,
    refetch: refetchImages,
    error,
  } = useUserImages(session?.user?.id, {
    onSuccess: (data: { images?: any[] }) => {
      // Update Zustand store with fetched images
      // This ensures compatibility with existing code that uses the store
      if (data?.images) {
        useImageStore.setState({ savedImages: data.images });
      }
    },
  } as any); // Use type assertion as a temporary fix

  const uploadImageMutation = useUploadImage();
  const deleteImageMutation = useDeleteImage();

  const handleSelectImage = useCallback(
    (url: string) => {
      console.log("Selecting image:", url);
      setImage(url);
    },
    [setImage]
  );

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!session || !event.target.files || !event.target.files[0]) return;

      const file = event.target.files[0];
      setUploading(true);
      setSuccessMessage(null);

      try {
        const uploadedImage = await uploadImageMutation.mutateAsync(file);

        // Show success message
        setSuccessMessage("Image uploaded successfully!");

        // Explicitly refetch images to ensure UI is up to date
        // await refetchImages();

        event.target.value = ""; // Reset input
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [session, uploadImageMutation, setImage, refetchImages]
  );

  const handleDeleteImage = useCallback(
    async (image: { url: string | null; publicId?: string; id?: string }) => {
      if (!session) return;
      if (!confirm("Are you sure you want to delete this image?")) {
        return;
      }

      try {
        const identifier = image.publicId || image.id;
        console.log("Attempting to delete image:", identifier);

        if (!identifier) {
          throw new Error("Image identifier is missing");
        }

        await deleteImageMutation.mutateAsync(identifier);

        // If the deleted image was the current main image, clear it
        if (imageUrl === image.url) {
          setImage("");
        }

        // Force a fresh fetch of images
        await refetchImages();
      } catch (error) {
        console.error("Error deleting image:", error);
        alert(
          error instanceof Error
            ? `Failed to delete image: ${error.message}`
            : "Failed to delete image. Please try again."
        );
      }
    },
    [session, deleteImageMutation, imageUrl, setImage, refetchImages]
  );

  // Show a sign-in message if not signed in
  const renderSignInMessage = useCallback(
    () => (
      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Upload size={24} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">
              Sign in to Upload Images
            </h3>
            <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
              Sign in to upload, manage, and access your image library across
              devices
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
    ),
    []
  );

  const renderImageCard = useCallback(
    (image: {
      id: string;
      url: string;
      publicId?: string;
      filename?: string;
      width?: number;
      height?: number;
    }) => {
      // Ensure url is valid before rendering the image
      if (!image.url) {
        console.error("Invalid image URL for image:", image.id);
        return null;
      }

      return (
        <div
          key={image.id}
          className={`relative p-2 border rounded ${
            imageUrl === image.url ? "border-blue-500" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between mb-2">
            <div className="text-xs truncate max-w-[80%]">
              {image.filename || "Image"}
            </div>
            <button
              onClick={() => handleDeleteImage(image)}
              className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded"
              title="Delete image"
              disabled={deleteImageMutation.isPending}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="relative aspect-square group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            {/* Only render Image component if we have a valid URL */}
            {image.url && (
              <Image
                src={image.url}
                alt={image.filename || "Image"}
                className={`
                  w-full h-full object-cover cursor-pointer
                  transition-all duration-300 ease-in-out group-hover:scale-105
                  ${imageUrl === image.url ? "ring-2 ring-blue-500" : ""}
                `}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                onClick={() => handleSelectImage(image.url)}
              />
            )}
          </div>
          <button
            onClick={() => handleSelectImage(image.url)}
            className={`w-full text-xs p-1 mt-2 rounded ${
              imageUrl === image.url
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            } flex items-center justify-center gap-1`}
            disabled={isLoadingImages || !image.url}
          >
            <Plus size={12} />
            {imageUrl === image.url ? "Selected" : "Set as Main Image"}
          </button>
        </div>
      );
    },
    [
      imageUrl,
      handleDeleteImage,
      handleSelectImage,
      isLoadingImages,
      deleteImageMutation.isPending,
    ]
  );

  // Loading state
  if (isLoadingImages) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading images...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-500">Error loading images</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchImages()}
            className="mt-2"
          >
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Image Upload</h2>
        {session && (
          <button
            onClick={() => refetchImages()}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded"
            disabled={isLoadingImages}
          >
            {isLoadingImages ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        )}
        {!session && (
          <div className="text-xs text-gray-500">Sign in to upload images</div>
        )}
      </div>

      {/* Upload Section - only show when signed in */}
      {session ? (
        <div className="mb-4">
          <label htmlFor="image-upload" className="block mb-2 cursor-pointer">
            <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-600">
              <Upload size={16} />
              <span>Upload Image</span>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || uploadImageMutation.isPending}
            />
          </label>
          {(uploading || uploadImageMutation.isPending) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
          {uploadImageMutation.isError && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              {uploadImageMutation.error instanceof Error
                ? uploadImageMutation.error.message
                : "Upload failed"}
            </div>
          )}
          {successMessage && (
            <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
              {successMessage}
            </div>
          )}
        </div>
      ) : (
        renderSignInMessage()
      )}

      {/* Active Images Section - Show for all users */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">
          Active Images ({imageUrl ? 1 : 0})
        </h3>
        <div className="flex flex-wrap gap-2">
          {imageUrl ? (
            <Badge
              variant="default"
              className="group flex items-center gap-2 cursor-pointer pr-2"
            >
              <img
                src={imageUrl}
                alt="Current"
                className="w-4 h-4 object-contain "
              />
              <span className="max-w-[60px] truncate">
                {imageUrl.split("/").pop()?.split("?")[0] || "Image"}
              </span>
              <button
                onClick={() => {
                  if (confirm("Remove this image from canvas?")) {
                    setImage("");
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={12} />
              </button>
            </Badge>
          ) : (
            <span className="text-xs text-gray-500">
              No image added to canvas
            </span>
          )}
        </div>
      </div>

      {/* Saved Images Carousel - only show when signed in */}
      {session ? (
        <div className="mt-6">
          {isLoadingImages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : savedImages.length > 0 ? (
            <>
              <h3 className="text-sm font-medium mb-4">
                Your Images ({savedImages.length})
              </h3>

              <Carousel
                items={savedImages
                  .filter((image) => !!image.url) // Filter out images with no URL
                  .map((image) => renderImageCard(image))}
                itemsPerView={2}
                spacing={16}
                className="py-3"
              />
            </>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No images found. Upload some images to get started.
            </div>
          )}
        </div>
      ) : (
        imageUrl && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Image Preview</h3>
            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
              <img
                src={imageUrl}
                alt="Current image"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <p className="text-white text-sm font-medium">
                  Sign in to save this image
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ImageUploader;
