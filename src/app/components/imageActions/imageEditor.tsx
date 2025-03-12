"use client";
import { useEffect, useRef, useState } from "react";

interface ImageEditorProps {
  image: string;
  logo: string;
  onPositionChange: (x: number, y: number) => void;
  onProcess: () => void;
}

const ImageEditor = ({
  image,
  logo,
  onPositionChange,
  onProcess,
}: ImageEditorProps) => {
  const [position, setPosition] = useState({ x: 20, y: 520 }); // Default position
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mainImage = new Image();
    mainImage.src = image;
    mainImage.crossOrigin = "anonymous"; // Fix potential CORS issues

    const logoImage = new Image();
    logoImage.src = logo;
    logoImage.crossOrigin = "anonymous";

    mainImage.onload = () => {
      const imageWidth = mainImage.width;
      const imageHeight = mainImage.height;

      originalSizeRef.current = { width: imageWidth, height: imageHeight };

      // Set fixed canvas size
      const canvasWidth = 800;
      const canvasHeight = 600;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear before redrawing
      ctx.drawImage(mainImage, 0, 0, canvasWidth, canvasHeight);

      logoImage.onload = () => {
        // Resize logo based on image size (20% width)
        const logoWidth = Math.floor(canvasWidth * 0.2);
        const logoHeight = Math.floor(logoWidth * (80 / 160));

        // Default position
        const defaultX = 20;
        const defaultY = canvasHeight - logoHeight - 20;

        setPosition({ x: defaultX, y: defaultY });
        onPositionChange(defaultX, defaultY);

        // Draw logo once, prevent blinking
        ctx.drawImage(logoImage, defaultX, defaultY, logoWidth, logoHeight);
      };
    };
  }, [image, logo, onPositionChange]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
    onPositionChange(x, y);

    // Redraw image and logo at new position
    const mainImage = new Image();
    mainImage.src = image;
    mainImage.onload = () => {
      const logoImage = new Image();
      logoImage.src = logo;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Prevent ghosting
      ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height);

      logoImage.onload = () => {
        const logoWidth = Math.floor(canvas.width * 0.2);
        const logoHeight = Math.floor(logoWidth * (80 / 160));

        ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
      };
    };
  };

  return (
    <div className="bg-slate-500 p-4 rounded-lg">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-gray-300 cursor-crosshair mx-auto"
      />
      <div className="flex justify-center">
        <button
          onClick={onProcess}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Process Image
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;
