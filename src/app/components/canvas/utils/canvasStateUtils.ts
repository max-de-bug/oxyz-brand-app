import { CanvasLogo } from "@/app/store/imageStore";
import { TextOverlay } from "@/app/store/designStore";

export interface CanvasState {
  images: Array<{ id: string; url: string }>;
  logos: CanvasLogo[];
  textOverlay: TextOverlay;
  textOverlays: TextOverlay[];
}

/**
 * Determines if the canvas is empty (no images, logos, or visible text)
 */
export const isCanvasEmpty = (canvasState: CanvasState): boolean => {
  const { images, logos, textOverlay, textOverlays } = canvasState;

  return (
    images.length === 0 &&
    logos.length === 0 &&
    !textOverlay.isVisible &&
    textOverlays.length === 0
  );
};

/**
 * Gets the total number of elements on the canvas
 */
export const getCanvasElementCount = (canvasState: CanvasState): number => {
  const { images, logos, textOverlay, textOverlays } = canvasState;

  const visibleTextCount = textOverlays.filter((text) => text.isVisible).length;
  const legacyTextCount = textOverlay.isVisible ? 1 : 0;

  return images.length + logos.length + visibleTextCount + legacyTextCount;
};

/**
 * Checks if canvas has any content that can be exported
 */
export const hasExportableContent = (canvasState: CanvasState): boolean => {
  return !isCanvasEmpty(canvasState);
};
