"use client";

import React, { useCallback } from "react";
import { TextOverlay } from "@/app/store/designStore";
import { CanvasLogo } from "@/app/store/imageStore";
import { calculateTextRect } from "./CanvasUtils";

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
}

export const MainImageRenderer: React.FC<MainImageRendererProps> = ({
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
}) => {
  if (!mainImage || !mainImage.complete || mainImage.naturalWidth <= 0) return null;

  // Save context state
  ctx.save();
  
  // Apply filters
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%)`;
  ctx.globalAlpha = opacity / 100;
  
  if (devMode) {
    // Apply translation and scaling for dev mode
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate scaled dimensions
    const scaledWidth = mainImage.naturalWidth * mainImageScale;
    const scaledHeight = mainImage.naturalHeight * mainImageScale;
    
    // Draw the image with translation and scaling
    ctx.translate(centerX + mainImagePosition.x, centerY + mainImagePosition.y);
    ctx.scale(mainImageScale, mainImageScale);
    ctx.drawImage(
      mainImage,
      -mainImage.naturalWidth / 2,
      -mainImage.naturalHeight / 2,
      mainImage.naturalWidth,
      mainImage.naturalHeight
    );
    
    // Draw resize handles if in dev mode
    ctx.restore();
    
    // Draw a border around the image
    ctx.strokeStyle = "rgba(0, 120, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX + mainImagePosition.x - (scaledWidth / 2),
      centerY + mainImagePosition.y - (scaledHeight / 2),
      scaledWidth,
      scaledHeight
    );
    
    // Draw resize handles at the corners
    const handleSize = 10;
    ctx.fillStyle = "rgba(0, 120, 255, 0.8)";
    
    // Top-left
    ctx.fillRect(
      centerX + mainImagePosition.x - (scaledWidth / 2) - handleSize / 2,
      centerY + mainImagePosition.y - (scaledHeight / 2) - handleSize / 2,
      handleSize,
      handleSize
    );
    
    // Top-right
    ctx.fillRect(
      centerX + mainImagePosition.x + (scaledWidth / 2) - handleSize / 2,
      centerY + mainImagePosition.y - (scaledHeight / 2) - handleSize / 2,
      handleSize,
      handleSize
    );
    
    // Bottom-left
    ctx.fillRect(
      centerX + mainImagePosition.x - (scaledWidth / 2) - handleSize / 2,
      centerY + mainImagePosition.y + (scaledHeight / 2) - handleSize / 2,
      handleSize,
      handleSize
    );
    
    // Bottom-right
    ctx.fillRect(
      centerX + mainImagePosition.x + (scaledWidth / 2) - handleSize / 2,
      centerY + mainImagePosition.y + (scaledHeight / 2) - handleSize / 2,
      handleSize,
      handleSize
    );
    
    ctx.save();
    ctx.translate(centerX + mainImagePosition.x, centerY + mainImagePosition.y);
    ctx.scale(mainImageScale, mainImageScale);
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
  
  return null;
};

interface LogoRendererProps {
  ctx: CanvasRenderingContext2D;
  logos: CanvasLogo[];
  logoImages: Map<string, HTMLImageElement>;
  logoRects: Map<string, { x: number; y: number; width: number; height: number }>;
  hoveredLogoId: string | null;
}

export const LogoRenderer: React.FC<LogoRendererProps> = ({
  ctx,
  logos,
  logoImages,
  logoRects,
  hoveredLogoId,
}) => {
  logos.forEach((logo) => {
    const logoImg = logoImages.get(logo.id);
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const rect = logoRects.get(logo.id);
      if (rect) {
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
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

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
            rect.x + rect.width - handleSize / 2,
            rect.y - handleSize / 2,
            handleSize,
            handleSize
          );
          // Bottom-left
          ctx.fillRect(
            rect.x - handleSize / 2,
            rect.y + rect.height - handleSize / 2,
            handleSize,
            handleSize
          );
          // Bottom-right
          ctx.fillRect(
            rect.x + rect.width - handleSize / 2,
            rect.y + rect.height - handleSize / 2,
            handleSize,
            handleSize
          );

          // Draw delete button at top right
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(rect.x + rect.width, rect.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Draw X in delete button
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rect.x + rect.width - 5, rect.y - 5);
          ctx.lineTo(rect.x + rect.width + 5, rect.y + 5);
          ctx.moveTo(rect.x + rect.width + 5, rect.y - 5);
          ctx.lineTo(rect.x + rect.width - 5, rect.y + 5);
          ctx.stroke();

          ctx.save();
          ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
          ctx.rotate((logo.rotation * Math.PI) / 180);
        } else if (hoveredLogoId === logo.id) {
          // Draw hover outline
          ctx.restore();
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          ctx.setLineDash([]);
          
          ctx.save();
          ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
          ctx.rotate((logo.rotation * Math.PI) / 180);
        }
        
        ctx.restore();
      }
    }
  });
  
  return null;
};

interface TextRendererProps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  textOverlays: TextOverlay[];
  legacyTextOverlay: TextOverlay;
  isDraggingText: boolean;
  draggedTextId: string | null;
  isResizingText: boolean;
  resizingTextId: string | null;
  mouseX: number;
  mouseY: number;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  ctx,
  canvas,
  textOverlays,
  legacyTextOverlay,
  isDraggingText,
  draggedTextId,
  isResizingText,
  resizingTextId,
  mouseX,
  mouseY,
}) => {
  const drawTextOverlay = useCallback(
    (text: TextOverlay) => {
      if (!text.isVisible || !text.text) return;

      // Save current context state
      ctx.save();

      // Calculate text position, applying translationX and translationY offsets
      const textX =
        (canvas.width * text.position.x) / 100 + (text.translationX || 0);
      const textY =
        (canvas.height * text.position.y) / 100 + (text.translationY || 0);

      // Translate to text position
      ctx.translate(textX, textY);

      // Apply rotation if any
      if (text.rotation) {
        ctx.rotate((text.rotation * Math.PI) / 180);
      }

      // Set text properties
      ctx.fillStyle = text.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Set font with appropriate styles
      let fontStyle = "";
      if (text.isBold) fontStyle += "bold ";
      if (text.isItalic) fontStyle += "italic ";
      ctx.font = `${fontStyle}${text.fontSize}px ${text.fontFamily}`;

      // Apply letter spacing if specified
      let letterSpacing = text.spacing || 0;

      // Split text into lines
      const lines = text.text.split("\n");

      // Calculate line height based on font size
      const lineHeight = text.fontSize * 1.2;

      // Draw each line with letter spacing
      lines.forEach((line, lineIndex) => {
        if (letterSpacing === 0) {
          // If no letter spacing, draw the whole line at once
          ctx.fillText(
            line,
            0,
            lineIndex * lineHeight - ((lines.length - 1) * lineHeight) / 2
          );
        } else {
          // If letter spacing is specified, draw each character separately
          let xOffset = 0;
          const chars = line.split("");

          // Calculate total width to center the text
          const totalWidth = chars.reduce((width, char) => {
            const charWidth = ctx.measureText(char).width;
            return width + charWidth + letterSpacing;
          }, 0);

          // Start position (centered)
          xOffset = -totalWidth / 2;

          // Draw each character
          chars.forEach((char) => {
            const charWidth = ctx.measureText(char).width;
            ctx.fillText(
              char,
              xOffset + charWidth / 2,
              lineIndex * lineHeight - ((lines.length - 1) * lineHeight) / 2
            );
            xOffset += charWidth + letterSpacing;
          });
        }
      });

      // Draw selection UI if text is selected or being manipulated
      const textRect = calculateTextRect(canvas, text);
      if (textRect) {
        const isDraggingThisText =
          isDraggingText &&
          (text.id === draggedTextId ||
            (draggedTextId === null && text === legacyTextOverlay));
        const isResizingThisText =
          isResizingText &&
          (text.id === resizingTextId ||
            (resizingTextId === null && text === legacyTextOverlay));

        if (isDraggingThisText || text.isSelected || isResizingThisText) {
          // Save the current context state
          ctx.restore();
          ctx.save();

          // Translate to the text position for rotation
          ctx.translate(textX, textY);
          ctx.rotate(text.rotation ? (text.rotation * Math.PI) / 180 : 0);

          // Draw selection rectangle
          ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue color
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -textRect.width / 2,
            -textRect.height / 2,
            textRect.width,
            textRect.height
          );

          // Draw resize handles
          ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
          const handleSize = 8;

          // Draw corner handles
          const corners = [
            { x: -textRect.width / 2, y: -textRect.height / 2 }, // Top-left
            { x: textRect.width / 2, y: -textRect.height / 2 }, // Top-right
            { x: -textRect.width / 2, y: textRect.height / 2 }, // Bottom-left
            { x: textRect.width / 2, y: textRect.height / 2 }, // Bottom-right
          ];

          corners.forEach((corner) => {
            ctx.fillRect(
              corner.x - handleSize / 2,
              corner.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });

          // Draw edge handles
          const edges = [
            { x: 0, y: -textRect.height / 2 }, // Top-center
            { x: 0, y: textRect.height / 2 }, // Bottom-center
            { x: -textRect.width / 2, y: 0 }, // Middle-left
            { x: textRect.width / 2, y: 0 }, // Middle-right
          ];

          edges.forEach((edge) => {
            ctx.fillRect(
              edge.x - handleSize / 2,
              edge.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });

          // Draw delete button at top right
          ctx.fillStyle = "#ef4444"; // Red color
          ctx.beginPath();
          ctx.arc(textRect.width / 2, -textRect.height / 2, 10, 0, Math.PI * 2);
          ctx.fill();

          // Draw X in delete button
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(textRect.width / 2 - 5, -textRect.height / 2 - 5);
          ctx.lineTo(textRect.width / 2 + 5, -textRect.height / 2 + 5);
          ctx.moveTo(textRect.width / 2 + 5, -textRect.height / 2 - 5);
          ctx.lineTo(textRect.width / 2 - 5, -textRect.height / 2 + 5);
          ctx.stroke();
        }
      }

      // Restore context
      ctx.restore();
    },
    [
      ctx,
      canvas,
      isDraggingText,
      draggedTextId,
      isResizingText,
      resizingTextId,
      legacyTextOverlay,
      mouseX,
      mouseY,
    ]
  );

  // Draw all text overlays from the array
  textOverlays.forEach((text) => {
    if (text.isVisible && text.text) {
      drawTextOverlay(text);
    }
  });

  // Draw legacy text overlay if it exists
  if (legacyTextOverlay.isVisible && legacyTextOverlay.text) {
    drawTextOverlay(legacyTextOverlay);
  }
  
  return null;
};
