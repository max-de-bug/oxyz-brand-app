"use client";
import { useState } from "react";
import LogoSelector from "./imageActions/logoSelector";
import ImageUploader from "./imageActions/imageUploader";
import ImageEditor from "./imageActions/imageEditor";
import PhotoSelector from "./imageActions/photoSelector";

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
    if (!uploadedImage || !selectedLogo) return;

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
    // Automatically select the first logo
    if (selectedLogo) {
      setLogoPosition({ x: 0, y: 0 }); // Set position for the logo
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement("a");
      link.href = processedImage;
      link.download = "processed-image.png"; // Set the default filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center">
        {/* <div className="flex justify-center items-start gap-8 w-full">
          <LogoSelector onSelect={handleLogoSelect} />
          <ImageUploader onUpload={handleImageUpload} />
          <PhotoSelector onSelect={handlePhotoSelect} />
        </div> */}
        <div className="mt-8 w-full max-w-auto">
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
          <h2 className="text-xl font-bold mb-2">Processed Image</h2>
          <img
            src={processedImage || "/placeholder.svg"}
            alt="Processed"
            className="max-w-full h-auto"
          />
          <div className="flex justify-center mt-2 p-2">
            <button
              onClick={handleDownload}
              className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Download Processed Image
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainComponent;
