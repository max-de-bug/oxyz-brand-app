import { create } from 'zustand';

type Position = { x: number; y: number };

interface MainImageState {
  isDraggingMainImage: boolean;
  mainImagePosition: Position;
  mainImageDragOffset: Position;
  isResizingMainImage: boolean;
  mainImageScale: number;
  initialMainImageScale: number;
  mainImageResizeStartPoint: Position;
  set: <K extends keyof MainImageState>(key: K, value: MainImageState[K]) => void;
}

export const useMainImageStore = create<MainImageState>((set) => ({
  isDraggingMainImage: false,
  mainImagePosition: { x: 0, y: 0 },
  mainImageDragOffset: { x: 0, y: 0 },
  isResizingMainImage: false,
  mainImageScale: 1,
  initialMainImageScale: 1,
  mainImageResizeStartPoint: { x: 0, y: 0 },
  set: (key, value) => set((state) => ({ ...state, [key]: value })),
}));
