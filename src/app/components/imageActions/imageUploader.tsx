import { error } from "console";
import { useState } from "react";

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void;
}

const ImageUploader = ({ onUpload }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        onUpload(url);
      } else {
        console.error("Error uploading file:", error);
      }
    } catch (error) {
      console.error("Error upploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium tex-gray-700">
        Upload Image
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="mt-1 block w-full text-sm text-gray-500
  file:mr-4 file:py-2 file:px-4
  file:rounded-full file:border-0
  file:text-sm file:font-semibold
  file:bg-blue-50 file:text-blue-700
  hover:file:bg-blue-100
  "
      />
      {uploading && <p className="mt-2 text-gray-500">Uploading...</p>}
    </div>
  );
};
export default ImageUploader;
