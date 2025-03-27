"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Upload, Plus, Trash2, RefreshCw, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImageStore } from "@/app/store/imageStore";
import { signIn } from "next-auth/react";
import { useAuth } from "@/app/store/auth-context";
import Image from "next/image";

const ImageUploader = () => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    imageUrl,
    setImage,
    uploadImage,
    deleteImage,
    savedImages,
    fetchCloudinaryImages,
    clearSavedImages,
  } = useImageStore();

  // Define loadImages function before using it in useEffect
  const loadImages = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      await fetchCloudinaryImages(session.user.id);
    } catch (error) {
      console.error("Error loading images:", error);
      alert("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session, fetchCloudinaryImages]);

  // Fetch Cloudinary images only when user is signed in
  useEffect(() => {
    if (session) {
      loadImages();
    } else {
      // Clear saved images when user signs out
      clearSavedImages();
    }
  }, [session, clearSavedImages, loadImages]);

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

      try {
        // Upload the file and get the response
        const uploadedImage = await uploadImage(file);

        // Optionally refresh the complete image list from server
        if (session?.user?.id) {
          await fetchCloudinaryImages(session.user.id);
        }

        // Set the newly uploaded image as the current image
        if (uploadedImage && uploadedImage.url) {
          setImage(uploadedImage.url);
        }

        event.target.value = ""; // Reset input
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [session, uploadImage, fetchCloudinaryImages, setImage]
  );
  const handleDeleteImage = useCallback(
    async (image: { publicId?: string; id?: string }) => {
      if (!session) return;
      if (!confirm("Are you sure you want to delete this image?")) {
        return;
      }

      try {
        setLoading(true);
        // Use publicId for Cloudinary images if available, otherwise fall back to id
        const identifier = image.publicId || image.id;
        console.log("Attempting to delete image:", identifier);

        // Ensure identifier is not undefined before passing to deleteImage
        if (identifier) {
          await deleteImage(identifier);

          // Refresh the image list
          await fetchCloudinaryImages(session.user.id);
        } else {
          throw new Error("Image identifier is missing");
        }

        // Show success message
        alert("Image deleted successfully");
      } catch (error) {
        console.error("Error deleting image:", error);
        alert(
          error instanceof Error
            ? `Failed to delete image: ${error.message}`
            : "Failed to delete image. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [session, deleteImage, fetchCloudinaryImages]
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

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Image Upload</h2>
        {session && (
          <button
            onClick={loadImages}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 hover:bg-gray-700"
            disabled={loading}
          >
            {loading ? (
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
              disabled={uploading}
            />
          </label>
          {uploading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        renderSignInMessage()
      )}

      {/* Current Image Section - always show if there's an image */}
      {imageUrl && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Current Image</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="flex items-center gap-1 pr-1">
              <img
                src={imageUrl}
                alt="Current"
                className="w-4 h-4 object-contain"
              />
              <span className="max-w-[100px] truncate">
                {imageUrl.split("/").pop()?.split("?")[0] || "Image"}
              </span>
              <button
                onClick={() => {
                  if (confirm("Remove this image from canvas?")) {
                    setImage(""); // Clear the current image
                  }
                }}
                className="ml-1 text-red-400 hover:text-red-600 p-1 rounded-full"
                title="Remove from canvas"
              >
                <Trash2 size={12} />
              </button>
            </Badge>
          </div>
        </div>
      )}

      {/* Saved Images Grid - only show when signed in */}
      {session && (
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : savedImages.length > 0 ? (
            savedImages.map((image) => (
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
                    disabled={loading}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-center p-2 bg-gray-50 rounded">
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt={image.filename || "Image"}
                      width={image.width || 200}
                      height={image.height || 150}
                      className={`object-contain max-h-24 cursor-pointer ${
                        imageUrl === image.url ? "ring-2 ring-blue-500" : ""
                      }`}
                      style={{ maxWidth: "100%", height: "auto" }}
                      onClick={() => handleSelectImage(image.url)}
                    />
                  ) : (
                    <div className="h-24 w-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No image preview
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSelectImage(image.url)}
                  className={`w-full text-xs p-1 mt-2 rounded ${
                    imageUrl === image.url
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  } flex items-center justify-center gap-1`}
                  disabled={loading}
                >
                  <Plus size={12} />
                  {imageUrl === image.url ? "Selected" : "Set as Main Image"}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-4 text-center text-gray-500">
              No images found. Upload some images to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
