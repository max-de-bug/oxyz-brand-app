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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mainImage = new Image();
    mainImage.src = image;
    mainImage.onload = () => {
      canvas.width = mainImage.width;
      canvas.height = mainImage.height;
      ctx.drawImage(mainImage, 0, 0);
    };

    const logoImage = new Image();
    logoImage.src = logo;
    logoImage.onload = () => {
      ctx.drawImage(logoImage, position.x, position.y);
    };
  }, [image, logo, position]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
    onPositionChange(x, y);
  };

  return (
    <div className="bg-slate-500">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-gray-300 cursor-crosshair"
      />
      <button
        onClick={onProcess}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Process Image
      </button>
    </div>
  );
};

export default ImageEditor;
