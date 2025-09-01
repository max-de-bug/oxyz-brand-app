"use client";

interface MainImageRendererProps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  mainImage: HTMLImageElement | null;
  devMode: boolean;
  mainImagePosition: { x: number; y: number };
  mainImageScale: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;
  blur: number;
}

// Convert from React component to regular function
export const MainImageRenderer = ({
  ctx,
  canvas,
  mainImage,
  devMode,
  mainImagePosition,
  mainImageScale,
  brightness,
  contrast,
  saturation,
  sepia,
  opacity,
  blur,
}: MainImageRendererProps) => {
  // Convert from useCallback to regular function
  const renderMainImage = () => {
    if (!mainImage || !mainImage.complete || mainImage.naturalWidth <= 0)
      return;

    ctx.save();

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) blur(${blur}px)`;
    ctx.globalAlpha = opacity / 100;

    if (devMode) {
      // Calculate dimensions
      const aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / aspectRatio;

      // Calculate center position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Calculate scaled dimensions
      const scaledWidth = targetWidth * mainImageScale;
      const scaledHeight = targetHeight * mainImageScale;

      // Draw the image with translation and scaling
      ctx.translate(
        centerX + mainImagePosition.x,
        centerY + mainImagePosition.y
      );
      ctx.scale(mainImageScale, mainImageScale);
      ctx.drawImage(
        mainImage,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight
      );

      // Draw a border around the image
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(0, 120, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        centerX + mainImagePosition.x - scaledWidth / 2,
        centerY + mainImagePosition.y - scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Draw resize handles at the corners
      const handleSize = 10;
      ctx.fillStyle = "rgba(0, 120, 255, 0.8)";

      // Top-left
      ctx.fillRect(
        centerX + mainImagePosition.x - scaledWidth / 2 - handleSize / 2,
        centerY + mainImagePosition.y - scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      );

      // Top-right
      ctx.fillRect(
        centerX + mainImagePosition.x + scaledWidth / 2 - handleSize / 2,
        centerY + mainImagePosition.y - scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      );

      // Bottom-left
      ctx.fillRect(
        centerX + mainImagePosition.x - scaledWidth / 2 - handleSize / 2,
        centerY + mainImagePosition.y + scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      );

      // Bottom-right
      ctx.fillRect(
        centerX + mainImagePosition.x + scaledWidth / 2 - handleSize / 2,
        centerY + mainImagePosition.y + scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      );
    } else {
      // Normal rendering (non-dev mode)
      const aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / aspectRatio;

      // Center the image vertically if it's smaller than the canvas
      const yOffset = Math.max(0, (canvas.height - targetHeight) / 2);

      ctx.drawImage(mainImage, 0, yOffset, targetWidth, targetHeight);
    }

    ctx.restore();
  };

  // Execute the rendering
  renderMainImage();

  // This function doesn't return anything as it directly manipulates the canvas
  return;
};
