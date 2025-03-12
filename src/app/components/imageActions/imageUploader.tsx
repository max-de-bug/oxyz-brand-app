import { useState } from "react";
import { Upload } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (imageUrl: string) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        onUpload(url);
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="mb-4 w-full max-w-4xl mx-auto flex-1 px-4 sm:px-0">
      <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">
        Upload Image
      </h2>
      <div
        className={`relative w-full flex-shrink-0 h-40 sm:h-64 p-2 sm:p-4 rounded-lg border-2 border-dashed transition-all ${
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-background dark:border-gray-600 dark:bg-gray-800"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mb-2 sm:mb-4" />
          <p className="text-[10px] sm:text-sm md:text-base text-muted-foreground">
            {uploading
              ? "Uploading..."
              : "Drag and drop an image, or click to select"}
          </p>
          <p className="mt-1 text-[8px] sm:text-xs md:text-sm text-muted-foreground">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      </div>
      {uploading && (
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Uploading...
        </p>
      )}
    </div>
  );
}
