import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function LogoUploader() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file || !session) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/logos/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Refresh the logo list after upload
        // window.location.reload();
      } else {
        console.error("Logo upload failed");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  if (!session) return null;

  return (
    <div className="mt-4 flex justify-center">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="logo-upload"
        disabled={uploading}
      />
      <label htmlFor="logo-upload">
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={uploading}
          asChild
        >
          <span>
            <Upload className="w-2 h-2 mr-2" />
            {uploading ? "Uploading..." : "Upload New Logo"}
          </span>
        </Button>
      </label>
    </div>
  );
}
