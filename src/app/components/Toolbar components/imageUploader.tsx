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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

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
        const uploadedImage = await uploadImageMutation.mutateAsync(file, {
          onSuccess: (data) => {
            // Set the newly uploaded image as the current image
            if (data.url) {
              setImage(data.url);
            }
          },
        });

        // Show success message
        setSuccessMessage("Image uploaded successfully!");

        // Explicitly refetch images to ensure UI is up to date
        await refetchImages();

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
      <div className="p-8 text-center border border-dashed rounded-lg">
        <LogIn className="mx-auto mb-2" size={24} />
        <p className="text-sm text-gray-500 mb-4">
          Please sign in to access your image library
        </p>
        <Button
          variant="default"
          onClick={() => signIn("discord", { callbackUrl: "/" })}
        >
          Sign In with Discord
        </Button>
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
    }) => (
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
        <div className="flex justify-center p-2 bg-gray-50 rounded">
          <Image
            src={image.url}
            alt={image.filename || "Image"}
            className={`object-contain max-h-24 cursor-pointer ${
              imageUrl === image.url ? "ring-2 ring-blue-500" : ""
            }`}
            style={{ maxWidth: "100%" }}
            onClick={() => handleSelectImage(image.url)}
            width={100}
            height={100}
          />
        </div>
        <button
          onClick={() => handleSelectImage(image.url)}
          className={`w-full text-xs p-1 mt-2 rounded ${
            imageUrl === image.url
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-800 hover:bg-gray-700"
          } flex items-center justify-center gap-1`}
          disabled={isLoadingImages}
        >
          <Plus size={12} />
          {imageUrl === image.url ? "Selected" : "Set as Main Image"}
        </button>
      </div>
    ),
    [
      imageUrl,
      handleDeleteImage,
      handleSelectImage,
      isLoadingImages,
      deleteImageMutation.isPending,
    ]
  );

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Image Upload</h2>
        {session && (
          <button
            onClick={() => refetchImages()}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 hover:bg-gray-700"
            disabled={isLoadingImages}
          >
            {isLoadingImages ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
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

      {/* Active Images Section */}
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
                className="w-4 h-4 object-contain"
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
      {session && (
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
                items={savedImages.map((image) => renderImageCard(image))}
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
      )}
    </div>
  );
};

export default ImageUploader;
