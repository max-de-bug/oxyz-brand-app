"use client";
import { useState } from "react";
import LogoSelector from "./imageActions/logoSelector";
import ImageUploader from "./imageActions/imageUploader";
import ImageEditor from "./imageActions/imageEditor";
import PhotoSelector from "./photoSelector";

const MainComponent = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleLogoSelect = (logoUrl: string) => {
    setSelectedLogo(logoUrl);
  };

  const handleLogoPositionChange = (x: number, y: number) => {
    setLogoPosition({ x, y });
  };

  const handleProcessImage = async () => {
    if (!uploadedImage || selectedLogo) return;

    const response = await fetch("/api/process-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: uploadedImage,
        logoUrl: selectedLogo,
        position: logoPosition,
      }),
    });
    if (response.ok) {
      const blob = await response.blob();
      setProcessedImage(URL.createObjectURL(blob));
    }
  };

  const handlePhotoSelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Uploader with Logo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex justify-between gap-8">
          <LogoSelector onSelect={handleLogoSelect} />
          <ImageUploader onUpload={handleImageUpload} />
          <PhotoSelector onSelect={handlePhotoSelect} />{" "}
        </div>
        <div>
          {uploadedImage && selectedLogo && (
            <ImageEditor
              image={uploadedImage}
              logo={selectedLogo}
              onPositionChange={handleLogoPositionChange}
              onProcess={handleProcessImage}
            />
          )}
        </div>
      </div>
      {processedImage && (
        <div className="mt-4">
          <h2 className="text-x1 font-bold mb-2">Processed Image</h2>
          <img
            src={processedImage || "/placeholder.svg"}
            alt="Processed"
            className="max-w-full h-auto"
          />
          <a
            href={processedImage}
            download="processed-image.png"
            className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Download
          </a>
        </div>
      )}
    </main>
  );
};

export default MainComponent;
