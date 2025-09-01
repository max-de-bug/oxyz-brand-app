"use client";

import { useCallback, useRef } from "react";
import { TextOverlay } from "@/app/store/designStore";
import { CanvasLogo } from "@/app/store/imageStore";
import { calculateLogoRects } from "../CanvasUtils";
import { MainImageRenderer } from "../MainImageRenderer";
import { LogoRenderer } from "../LogoRenderer";
import { TextRenderer } from "../TextRenderer";

interface CanvasRenderingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mainImage: HTMLImageElement | null;
  logoImages: Map<string, HTMLImageElement>;
  logos: CanvasLogo[];
  textOverlays: TextOverlay[];
  legacyTextOverlay: TextOverlay;
  devMode: boolean;
  mainImagePosition: { x: number; y: number };
  mainImageScale: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  opacity: number;
  blur: number;
  isDraggingText: boolean;
  draggedTextId: string | null;
  isResizingText: boolean;
  resizingTextId: string | null;
  mouseX: number;
  mouseY: number;
  hoveredLogoId: string | null;
  designStoreAspectRatio: string;
  canvasWidth: number;
}

export const useCanvasRendering = ({
  canvasRef,
  mainImage,
  logoImages,
  logos,
  textOverlays,
  legacyTextOverlay,
  devMode,
  mainImagePosition,
  mainImageScale,
  brightness,
  contrast,
  saturation,
  sepia,
  opacity,
  blur,
  isDraggingText,
  draggedTextId,
  isResizingText,
  resizingTextId,
  mouseX,
  mouseY,
  hoveredLogoId,
  designStoreAspectRatio,
  canvasWidth,
}: CanvasRenderingProps) => {
  // Add a ref to track the last render timestamp
  const lastRenderTimeRef = useRef(0);
  // Add a ref to track if we should render the canvas
  const shouldRenderRef = useRef(true);

  // Calculate logo rectangles for hit testing
  const calculateLogoRectsForCanvas = useCallback(() => {
    if (!canvasRef.current) return new Map();
    return calculateLogoRects(canvasRef.current, logos, logoImages);
  }, [canvasRef, logos, logoImages]);

  // Calculate text rectangle for hit testing
  const calculateTextRectForCanvas = useCallback(
    (canvas: HTMLCanvasElement, text: TextOverlay) => {
      if (!text.isVisible || !text.text) return null;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Save context to restore later
      ctx.save();

      // Set font properties to measure text
      let fontStyle = "";
      if (text.isBold) fontStyle += "bold ";
      if (text.isItalic) fontStyle += "italic ";
      ctx.font = `${fontStyle}${text.fontSize}px ${text.fontFamily}`;

      // Split text into lines
      const lines = text.text.split("\n");

      // Calculate line height
      const lineHeight = text.fontSize * 1.2;

      // Calculate the width of the widest line
      let maxWidth = 0;
      lines.forEach((line) => {
        const lineWidth = ctx.measureText(line).width;
        maxWidth = Math.max(maxWidth, lineWidth);
      });

      // Calculate total height
      const totalHeight = lines.length * lineHeight;

      // Calculate text position
      const textX =
        (canvas.width * text.position.x) / 100 + (text.translationX || 0);
      const textY =
        (canvas.height * text.position.y) / 100 + (text.translationY || 0);

      // Restore context
      ctx.restore();

      // Add padding
      const padding = text.fontSize * 0.5;
      const width = maxWidth + padding * 2;
      const height = totalHeight + padding * 2;

      // Return rectangle centered on the text position
      return {
        x: textX - width / 2,
        y: textY - height / 2,
        width,
        height,
      };
    },
    []
  );

  // Calculate image boundaries for constraints
  const calculateImageBounds = useCallback(() => {
    return {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
    };
  }, []);

  // Main render function
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Ensure canvas has proper dimensions
    const aspectRatioValues = designStoreAspectRatio.split(":").map(Number);
    const designAspectRatio = aspectRatioValues[0] / aspectRatioValues[1];

    // Determine the aspect ratio to use (prefer image's aspect ratio if available)
    let aspectRatio;
    if (
      mainImage &&
      mainImage.naturalWidth > 0 &&
      mainImage.naturalHeight > 0
    ) {
      aspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
    } else {
      // Fall back to the design store aspect ratio
      aspectRatio = designAspectRatio;
    }

    // Ensure canvas has proper dimensions before drawing
    if (
      canvas.width !== canvasWidth ||
      Math.abs(canvas.height - canvasWidth / aspectRatio) > 1
    ) {
      canvas.width = canvasWidth;
      canvas.height = canvasWidth / aspectRatio;
    }

    // Clear canvas with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate logo rects for hit testing
    const logoRects = calculateLogoRectsForCanvas();

    // Render main image
    MainImageRenderer({
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
    });

    // Render logos
    LogoRenderer({
      logoImages,
      ctx,
      logos,
      logoRects,
      hoveredLogoId,
    });

    // Render text overlays
    TextRenderer({
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
      calculateTextRect: calculateTextRectForCanvas,
    });
  }, [
    canvasRef,
    mainImage,
    logoImages,
    logos,
    textOverlays,
    legacyTextOverlay,
    devMode,
    mainImagePosition,
    mainImageScale,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    blur,
    isDraggingText,
    draggedTextId,
    isResizingText,
    resizingTextId,
    mouseX,
    mouseY,
    hoveredLogoId,
    designStoreAspectRatio,
    canvasWidth,
    calculateLogoRectsForCanvas,
    calculateTextRectForCanvas,
  ]);

  // Throttled render function
  const throttledRenderCanvas = useCallback(() => {
    const now = Date.now();
    if (now - lastRenderTimeRef.current < 33 && !shouldRenderRef.current) {
      return;
    }

    lastRenderTimeRef.current = now;
    shouldRenderRef.current = false;

    renderCanvas();
  }, [renderCanvas]);

  return {
    renderCanvas,
    throttledRenderCanvas,
    calculateLogoRectsForCanvas,
    calculateTextRect: calculateTextRectForCanvas,
    calculateImageBounds,
  };
};
