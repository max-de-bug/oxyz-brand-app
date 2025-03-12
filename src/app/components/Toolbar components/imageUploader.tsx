"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Upload, Plus, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useImageStore } from "@/app/store/imageStore";

const ImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    imageUrl,
    setImage,
    uploadImage,
    deleteImage,
    savedImages,
    fetchCloudinaryImages,
  } = useImageStore();

  // Fetch Cloudinary images when component mounts
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      await fetchCloudinaryImages();
    } catch (error) {
      console.error("Error loading images:", error);
      alert("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setUploading(true);

    try {
      await uploadImage(file);
      event.target.value = ""; // Reset input
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = (url: string) => {
    console.log("Selecting image:", url);
    setImage(url);
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting to delete image:", id); // Debug log

      await deleteImage(id);

      // Refresh the image list
      await fetchCloudinaryImages();

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
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Image Upload</h2>
        <button
          onClick={loadImages}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      {/* Upload Section */}
      <div className="mb-4">
        <label htmlFor="image-upload" className="block mb-2 cursor-pointer">
          <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-50">
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

      {/* Current Image Section */}
      {imageUrl && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Current Image</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <img
                src={imageUrl}
                alt="Current"
                className="w-4 h-4 object-contain"
              />
              <span className="max-w-[60px] truncate">Current</span>
            </Badge>
          </div>
        </div>
      )}

      {/* Saved Images Grid with improved delete button */}
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
                  onClick={() => handleDeleteImage(image.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded"
                  title="Delete image"
                  disabled={loading}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex justify-center p-2 bg-gray-50 rounded">
                <img
                  src={image.url}
                  alt={image.filename || "Image"}
                  className={`object-contain max-h-24 cursor-pointer ${
                    imageUrl === image.url ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{ maxWidth: "100%" }}
                  onClick={() => handleSelectImage(image.url)}
                />
              </div>
              <button
                onClick={() => handleSelectImage(image.url)}
                className={`w-full text-xs p-1 mt-2 rounded ${
                  imageUrl === image.url
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 hover:bg-gray-200"
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
    </div>
  );
};

export default ImageUploader;
