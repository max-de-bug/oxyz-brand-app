"use client";

import { TextOverlay } from "@/app/store/designStore";
import { CanvasLogo } from "@/app/store/imageStore";

/**
 * Calculate the boundaries of logos on the canvas
 */
export const calculateLogoRects = (
  canvas: HTMLCanvasElement | null,
  logos: CanvasLogo[],
  logoImages: Map<string, HTMLImageElement>
) => {
  const rects = new Map<
    string,
    { x: number; y: number; width: number; height: number }
  >();
  if (!canvas) return rects;

  logos.forEach((logo) => {
    const logoImg = logoImages.get(logo.id);
    if (!logoImg) return;

    const logoWidth = (canvas.width * logo.size) / 100;
    const logoHeight =
      (logoImg.naturalHeight * logoWidth) / logoImg.naturalWidth;

    rects.set(logo.id, {
      x: (canvas.width * logo.position.x) / 100 - logoWidth / 2,
      y: (canvas.height * logo.position.y) / 100 - logoHeight / 2,
      width: logoWidth,
      height: logoHeight,
    });
  });

  return rects;
};

/**
 * Calculate the boundaries of text on the canvas
 */
export const calculateTextRect = (
  canvas: HTMLCanvasElement,
  text: TextOverlay
): { x: number; y: number; width: number; height: number } | null => {
  if (!text.text || !text.isVisible) return null;

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
};

/**
 * Calculate the boundaries of the main image on the canvas
 */
export const calculateImageBounds = (
  canvas: HTMLCanvasElement
): { left: number; right: number; top: number; bottom: number } => {
  // Default to full canvas if no specific boundaries
  return {
    left: 0,
    right: 100,
    top: 0,
    bottom: 100,
  };
};

/**
 * Helper function to check if a font is loaded
 */
export const isFontLoaded = (fontFamily: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        resolve(document.fonts.check(`16px ${fontFamily}`));
      });
    } else {
      setTimeout(() => resolve(true), 100);
    }
  });
};

/**
 * Calculate the greatest common divisor (for aspect ratio calculations)
 */
export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};
