import { useMemo } from "react";
import { useImageStore } from "@/app/store/imageStore";
import { useDesignStore } from "@/app/store/designStore";
import {
  CanvasRenderingConfig,
  LogoInteractionsConfig,
  TextInteractionsConfig,
} from "../types/canvas-hooks";
import { calculateTextRect } from "../CanvasUtils";

interface UseCanvasConfigurationProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  loadedImages: Map<string, HTMLImageElement>;
  logoImages: Map<string, HTMLImageElement>;
  mainImagePosition: { x: number; y: number };
  mainImageScale: number;
  isDraggingText: boolean;
  draggedTextId: string | null;
  isResizingText: boolean;
  resizingTextId: string | null;
  mouseX: number;
  mouseY: number;
  stableRenderCanvas: () => void;
  calculateLogoRectsForCanvas: () => Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
}

export const useCanvasConfiguration = ({
  canvasRef,
  loadedImages,
  logoImages,
  mainImagePosition,
  mainImageScale,
  isDraggingText,
  draggedTextId,
  isResizingText,
  resizingTextId,
  mouseX,
  mouseY,
  stableRenderCanvas,
  calculateLogoRectsForCanvas,
}: UseCanvasConfigurationProps) => {
  // Get store values
  const {
    images,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    blur,
    updateLogo,
    selectLogo,
    removeLogo,
  } = useImageStore();
  const {
    textOverlay,
    textOverlays,
    updateText,
    selectText,
    deleteText,
    selectTextById,
    deleteTextById,
    setTextOverlay,
    devMode,
    aspectRatio: designStoreAspectRatio,
  } = useDesignStore();

  // Memoize canvas rendering configuration
  const canvasRenderingConfig = useMemo(
    () => ({
      canvasRef,
      mainImage: loadedImages.get(images[0]?.id) ?? null,
      logoImages,
      logos,
      textOverlays,
      legacyTextOverlay: textOverlay,
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
      hoveredLogoId: null,
      designStoreAspectRatio,
      canvasWidth: 800, // This should be passed as a prop
    }),
    [
      canvasRef,
      loadedImages,
      images,
      logoImages,
      logos,
      textOverlays,
      textOverlay,
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
      designStoreAspectRatio,
    ]
  );

  // Memoize logo interactions configuration
  const logoInteractionsConfig: LogoInteractionsConfig = useMemo(
    () => ({
      canvasRef,
      logos,
      logoImages,
      logoRects: calculateLogoRectsForCanvas(),
      updateLogo,
      selectLogo,
      deleteLogo: removeLogo,
      renderCanvas: stableRenderCanvas,
    }),
    [
      canvasRef,
      logos,
      logoImages,
      calculateLogoRectsForCanvas,
      updateLogo,
      selectLogo,
      removeLogo,
      stableRenderCanvas,
    ]
  );

  // Memoize text interactions configuration
  const textInteractionsConfig: TextInteractionsConfig = useMemo(
    () => ({
      canvasRef,
      textOverlays,
      legacyTextOverlay: textOverlay,
      setTextOverlay,
      updateText,
      selectText,
      deleteText,
      selectTextById,
      deleteTextById,
      calculateTextRect,
      renderCanvas: stableRenderCanvas,
    }),
    [
      canvasRef,
      textOverlays,
      textOverlay,
      setTextOverlay,
      updateText,
      selectText,
      deleteText,
      selectTextById,
      deleteTextById,
      stableRenderCanvas,
    ]
  );

  return {
    canvasRenderingConfig,
    logoInteractionsConfig,
    textInteractionsConfig,
  };
};
