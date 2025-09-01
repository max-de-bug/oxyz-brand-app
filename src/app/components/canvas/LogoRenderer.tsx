"use client";

import { CanvasLogo } from "@/app/store/imageStore";

interface LogoRendererProps {
  ctx: CanvasRenderingContext2D;
  logos: CanvasLogo[];
  logoImages: Map<string, HTMLImageElement>;
  logoRects: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  hoveredLogoId: string | null;
}

// Convert from React component to regular function
export const LogoRenderer = ({
  ctx,
  logos,
  logoImages,
  logoRects,
  hoveredLogoId,
}: LogoRendererProps) => {
  // Convert from useCallback to regular function
  const renderLogos = () => {
    logos.forEach((logo) => {
      const logoImg = logoImages.get(logo.id);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const rect = logoRects.get(logo.id);
        if (rect) {
          // Calculate dimensions based on logo size and natural image dimensions
          const logoWidth = (ctx.canvas.width * logo.size) / 100;
          const logoHeight =
            (logoImg.naturalHeight * logoWidth) / logoImg.naturalWidth;

          ctx.save();
          ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
          ctx.rotate((logo.rotation * Math.PI) / 180);
          ctx.drawImage(
            logoImg,
            -rect.width / 2,
            -rect.height / 2,
            rect.width,
            rect.height
          );

          // Draw selection border if selected
          if (logo.isSelected) {
            ctx.restore();
            ctx.strokeStyle = "rgba(0, 120, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.x, rect.y, logoWidth, logoHeight);

            // Draw resize handles
            const handleSize = 8;
            ctx.fillStyle = "rgba(0, 120, 255, 0.8)";
            // Top-left
            ctx.fillRect(
              rect.x - handleSize / 2,
              rect.y - handleSize / 2,
              handleSize,
              handleSize
            );
            // Top-right
            ctx.fillRect(
              rect.x + logoWidth - handleSize / 2,
              rect.y - handleSize / 2,
              handleSize,
              handleSize
            );
            // Bottom-left
            ctx.fillRect(
              rect.x - handleSize / 2,
              rect.y + logoHeight - handleSize / 2,
              handleSize,
              handleSize
            );
            // Bottom-right
            ctx.fillRect(
              rect.x + logoWidth - handleSize / 2,
              rect.y + logoHeight - handleSize / 2,
              handleSize,
              handleSize
            );

            // Draw delete button at top right
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(rect.x + logoWidth, rect.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw X in delete button
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rect.x + logoWidth - 5, rect.y - 5);
            ctx.lineTo(rect.x + logoWidth + 5, rect.y + 5);
            ctx.moveTo(rect.x + logoWidth + 5, rect.y - 5);
            ctx.lineTo(rect.x + logoWidth - 5, rect.y + 5);
            ctx.stroke();

            ctx.save();
            ctx.translate(rect.x + logoWidth / 2, rect.y + logoHeight / 2);
            ctx.rotate((logo.rotation * Math.PI) / 180);
          } else if (hoveredLogoId === logo.id) {
            // Draw hover outline
            ctx.restore();
            ctx.strokeStyle = "#9ca3af";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(rect.x, rect.y, logoWidth, logoHeight);
            ctx.setLineDash([]);

            ctx.save();
            ctx.translate(rect.x + logoWidth / 2, rect.y + logoHeight / 2);
            ctx.rotate((logo.rotation * Math.PI) / 180);
          }

          ctx.restore();
        }
      }
    });
  };

  // Execute the rendering
  renderLogos();

  // This function doesn't return anything as it directly manipulates the canvas
  return;
};
