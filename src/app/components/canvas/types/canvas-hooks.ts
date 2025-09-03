import { RefObject } from "react";
import { CanvasLogo } from "@/app/store/imageStore";
import { TextOverlay } from "@/app/store/designStore";

export interface CanvasRenderingConfig {
  canvasRef: RefObject<HTMLCanvasElement>;
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

export interface LogoInteractionsConfig {
  canvasRef: RefObject<HTMLCanvasElement>;
  logos: CanvasLogo[];
  logoImages: Map<string, HTMLImageElement>;
  logoRects: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  updateLogo: (id: string, updates: Partial<CanvasLogo>) => void;
  selectLogo: (id: string) => void;
  deleteLogo: (id: string) => void;
  renderCanvas: () => void;
}

export interface TextInteractionsConfig {
  canvasRef: RefObject<HTMLCanvasElement>;
  textOverlays: TextOverlay[];
  legacyTextOverlay: TextOverlay;
  setTextOverlay: (overlay: TextOverlay) => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  selectText: (selected: boolean) => void;
  deleteText: () => void;
  selectTextById: (id: string) => void;
  deleteTextById: (id: string) => void;
  calculateTextRect: (
    canvas: HTMLCanvasElement,
    text: TextOverlay
  ) => { x: number; y: number; width: number; height: number } | null;
  renderCanvas: () => void;
}
