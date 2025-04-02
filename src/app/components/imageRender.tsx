"use client";

import React, {
  useRef,
  useEffect,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { useImageStore, CanvasLogo } from "@/app/store/imageStore";
import { useDesignStore } from "@/app/store/designStore";
import { Trash2 } from "lucide-react";
import { usePresetStore } from "../store/presetStore";

interface ImageRenderContextType {
  captureCanvas: () => Promise<string | null>;
}

const ImageRenderContext = createContext<ImageRenderContextType>({
  captureCanvas: async () => null,
});

export const useImageRender = () => useContext(ImageRenderContext);

const ImageRender = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainImage, setMainImage] = useState<HTMLImageElement | null>(null);
  const [logoImages, setLogoImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [hoveredLogoId, setHoveredLogoId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Add state to track dragging
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedLogoId, setDraggedLogoId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState(0);
  const [initialMouseDistance, setInitialMouseDistance] = useState(0);

  // Add state for text dragging
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // Center by default (percentage)
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 }); // Add this for text dragging offset

  // Add these state variables to track mouse position
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Add these new state variables to the ImageRender component
  const [isResizingCorner, setIsResizingCorner] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<
    "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
  >(null);
  const [resizeStartPoint, setResizeStartPoint] = useState({ x: 0, y: 0 });

  // Add state variables for viewport dimensions at the beginning of the component
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Get values from the store
  const {
    imageUrl,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    selectLogo,
    updateLogo,
    deleteLogo,
    clearMainImage,
    opacity,
  } = useImageStore();

  // Get text overlay and aspect ratio from design store
  const { textOverlay, setTextOverlay, selectText, deleteText, aspectRatio } =
    useDesignStore();

  const { setActivePreset, setSelectedPreset } = usePresetStore.getState();

  // Inside the ImageRender component, add this right after your other state declarations
  const { aspectRatio: designStoreAspectRatio } = useDesignStore();

  // Add this debug useEffect to track opacity changes
  useEffect(() => {
    console.log("Current opacity value:", opacity);
  }, [opacity]);

  // Add an effect to adjust canvas size based on the main image's dimensions
  useEffect(() => {
    if (
      mainImage &&
      mainImage.naturalWidth > 0 &&
      mainImage.naturalHeight > 0
    ) {
      // Calculate the aspect ratio of the loaded image
      const imageAspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;

      // Calculate available width (accounting for toolbar and padding)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Determine base width with responsive sizes
      let baseWidth;
      if (viewportWidth >= 1280) {
        // xl breakpoint
        baseWidth = Math.min(1200, viewportWidth * 0.6);
      } else if (viewportWidth >= 1024) {
        // lg breakpoint
        baseWidth = Math.min(1000, viewportWidth * 0.65);
      } else if (viewportWidth >= 768) {
        // md breakpoint
        baseWidth = Math.min(800, viewportWidth * 0.75);
      } else {
        baseWidth = Math.min(700, viewportWidth * 0.85);
      }

      // Calculate height based on image's aspect ratio
      const calculatedHeight = baseWidth / imageAspectRatio;
      const maxHeight = viewportHeight * 0.8; // Maximum 80% of viewport height

      // Adjust width if height exceeds maximum
      if (calculatedHeight > maxHeight) {
        baseWidth = maxHeight * imageAspectRatio;
      }

      // Update canvas size
      setCanvasWidth(baseWidth);

      // Update design store aspect ratio to match the image
      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
      const aspectGcd = gcd(mainImage.naturalWidth, mainImage.naturalHeight);
      const widthRatio = mainImage.naturalWidth / aspectGcd;
      const heightRatio = mainImage.naturalHeight / aspectGcd;

      // Only update if the ratio is significantly different (avoid minor decimal differences)
      const currentRatio = designStoreAspectRatio.split(":").map(Number);
      const currentCalculatedRatio = currentRatio[0] / currentRatio[1];
      const newCalculatedRatio = widthRatio / heightRatio;

      if (Math.abs(currentCalculatedRatio - newCalculatedRatio) > 0.01) {
        console.log(
          `Setting aspect ratio to match image: ${widthRatio}:${heightRatio}`
        );
        useDesignStore
          .getState()
          .setAspectRatio(`${widthRatio}:${heightRatio}`);
      }
    }
  }, [mainImage, viewportWidth, viewportHeight]);

  // Memoize the calculateLogoRects function to prevent unnecessary recalculations
  const calculateLogoRects = useCallback(
    (
      canvas: HTMLCanvasElement
    ): Map<string, { x: number; y: number; width: number; height: number }> => {
      const rects = new Map();

      logos.forEach((logo) => {
        const logoImg = logoImages.get(logo.id);
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
          // Calculate basic dimensions
          const logoWidth = (canvas.width * logo.size) / 100;
          const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
          const logoX = (canvas.width * logo.position.x) / 100 - logoWidth / 2;
          const logoY =
            (canvas.height * logo.position.y) / 100 - logoHeight / 2;

          // For non-rotated logos or hit testing purposes, use the original rect
          rects.set(logo.id, {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
          });
        }
      });

      return rects;
    },
    [logos, logoImages]
  );

  // Calculate text rectangle for hit testing
  const calculateTextRect = useCallback(
    (
      canvas: HTMLCanvasElement
    ): { x: number; y: number; width: number; height: number } | null => {
      if (!textOverlay.isVisible || !textOverlay.text) {
        console.log("Text not visible or empty");
        return null;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context for text rect calculation");
        return null;
      }

      // Set font properties
      const fontStyle = textOverlay.isItalic ? "italic " : "";
      const fontWeight = textOverlay.isBold ? "bold " : "";
      const fontFamilyName = textOverlay.fontFamily.includes("-")
        ? `"${textOverlay.fontFamily}"`
        : textOverlay.fontFamily;

      ctx.font = `${fontStyle}${fontWeight}${textOverlay.fontSize}px ${fontFamilyName}, sans-serif`;

      // Measure text
      const metrics = ctx.measureText(textOverlay.text);

      // Get proper text metrics with padding for better visibility and clickability
      const padding = Math.max(10, textOverlay.fontSize * 0.3); // Dynamic padding based on font size

      // Calculate more accurate height (use actualBoundingBoxAscent if available)
      const textHeight =
        metrics.actualBoundingBoxAscent !== undefined
          ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
          : textOverlay.fontSize * 1.2; // Fallback with multiplier for better height

      const textWidth = metrics.width;

      // Calculate position (centered around the text position)
      const textX =
        (canvas.width * textPosition.x) / 100 + (textOverlay.translationX || 0);
      const textY =
        (canvas.height * textPosition.y) / 100 +
        (textOverlay.translationY || 0);

      // Create a rect without rotation applied, adding padding for easier selection
      let rect = {
        x: textX - (textWidth / 2 + padding), // Center horizontally with padding
        y: textY - (textHeight / 2 + padding), // Center vertically with padding
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
      };

      // If there's rotation, we need to adjust the bounding box
      if (textOverlay.rotation && textOverlay.rotation !== 0) {
        // For rotated text, create a larger bounding box
        const diagonal = Math.sqrt(
          Math.pow(rect.width, 2) + Math.pow(rect.height, 2)
        );
        rect = {
          x: textX - diagonal / 2,
          y: textY - diagonal / 2,
          width: diagonal,
          height: diagonal,
        };
      }

      return rect;
    },
    [textOverlay, textPosition]
  );

  // Load main image when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      console.log("Loading main image from URL:", imageUrl);

      // Important: Don't clear the previous image until the new one is ready
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Preload the image before updating the state
      img.onload = () => {
        console.log("Main image loaded successfully:", imageUrl);
        console.log("Image dimensions:", {
          width: img.width,
          height: img.height,
        });

        // Update state only after the image is fully loaded
        setMainImage(img);

        // Force a synchronous render with the new image
        setTimeout(() => {
          renderCanvas();
        }, 0);
      };

      img.onerror = (err) => {
        console.error("Error loading main image:", err);
      };

      // For Cloudinary URLs, add cache-busting parameter
      let imageSrc = imageUrl;
      if (imageUrl.includes("cloudinary.com")) {
        imageSrc = `${imageUrl}${
          imageUrl.includes("?") ? "&" : "?"
        }t=${Date.now()}`;
      }

      // Set src after handlers are established
      img.src = imageSrc;
    } else {
      console.log("No image URL provided, clearing main image");
      setMainImage(null);
    }
  }, [imageUrl]);

  // Load logo images when logos change
  useEffect(() => {
    // Create a new map to track which logos need to be loaded
    const newLogosToLoad = logos.filter((logo) => !logoImages.has(logo.id));

    // Only load new logos
    if (newLogosToLoad.length > 0) {
      newLogosToLoad.forEach((logo) => {
        console.log("Loading logo image:", logo.url);
        const img = new Image();
        // Set crossOrigin before setting src
        img.crossOrigin = "anonymous";

        img.onload = () => {
          console.log("Logo image loaded successfully:", logo.url);
          setLogoImages((prev) => {
            const newMap = new Map(prev);
            newMap.set(logo.id, img);
            return newMap;
          });
        };

        img.onerror = (err) => {
          console.error(`Error loading logo image ${logo.id}:`, err);
        };

        // Set src after setting up event handlers
        img.src = logo.url;
      });
    }

    // Remove logos that are no longer in the store
    const currentLogoIds = new Set(logos.map((logo) => logo.id));
    const logoImagesToRemove = Array.from(logoImages.keys()).filter(
      (id) => !currentLogoIds.has(id)
    );

    if (logoImagesToRemove.length > 0) {
      setLogoImages((prev) => {
        const newMap = new Map(prev);
        logoImagesToRemove.forEach((id) => newMap.delete(id));
        return newMap;
      });
    }
  }, [logos]);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

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
      const [widthRatio, heightRatio] = designStoreAspectRatio
        .split(":")
        .map(Number);
      aspectRatio = widthRatio / heightRatio;
    }

    // Ensure canvas has proper dimensions before drawing
    if (
      canvas.width !== canvasWidth ||
      Math.abs(canvas.height - canvasWidth / aspectRatio) > 1
    ) {
      canvas.width = canvasWidth;
      canvas.height = canvasWidth / aspectRatio;
      console.log(
        `Canvas resized to ${canvas.width}x${canvas.height}, aspect ratio: ${aspectRatio}`
      );
    }

    // Clear canvas with solid color for performance
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main image if available
    if (mainImage && mainImage.complete && mainImage.naturalWidth > 0) {
      // Save the current state
      ctx.save();

      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%)`;
      ctx.globalAlpha = opacity / 100;

      // Calculate proper image scaling
      const imageRatio = mainImage.width / mainImage.height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (imageRatio > aspectRatio) {
        // Image is wider than canvas ratio
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas ratio
        drawHeight = canvas.height;
        drawWidth = canvas.height * imageRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      // Draw image in one operation
      ctx.drawImage(mainImage, offsetX, offsetY, drawWidth, drawHeight);

      // Restore the context state
      ctx.restore();
    }

    // Calculate logo rects for hit testing
    const logoRects = calculateLogoRects(canvas);

    // Draw logos
    logos.forEach((logo) => {
      const logoImg = logoImages.get(logo.id);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const rect = logoRects.get(logo.id);
        if (rect) {
          // Save context state
          ctx.save();

          // Calculate center of the logo
          const centerX = rect.x + rect.width / 2;
          const centerY = rect.y + rect.height / 2;

          // Translate to the center of the logo
          ctx.translate(centerX, centerY);

          // Apply rotation if it exists
          if (logo.rotation) {
            ctx.rotate((logo.rotation * Math.PI) / 180);
          }

          // Draw the logo centered at the origin (after translation)
          ctx.drawImage(
            logoImg,
            -rect.width / 2,
            -rect.height / 2,
            rect.width,
            rect.height
          );

          // Draw outline if logo is selected or hovered
          if (logo.isSelected || hoveredLogoId === logo.id) {
            ctx.strokeStyle = logo.isSelected ? "#3b82f6" : "#9ca3af";
            ctx.lineWidth = 2;
            ctx.setLineDash(logo.isSelected ? [] : [5, 5]);
            ctx.strokeRect(
              -rect.width / 2,
              -rect.height / 2,
              rect.width,
              rect.height
            );

            // Draw resize handles at all corners
            ctx.fillStyle = "#3b82f6";
            const handleSize = 8;

            // Draw 4 corner handles
            const corners = [
              { x: -rect.width / 2, y: -rect.height / 2 }, // Top-left
              { x: rect.width / 2, y: -rect.height / 2 }, // Top-right
              { x: -rect.width / 2, y: rect.height / 2 }, // Bottom-left
              { x: rect.width / 2, y: rect.height / 2 }, // Bottom-right
            ];

            corners.forEach((corner) => {
              ctx.fillRect(
                corner.x - handleSize / 2,
                corner.y - handleSize / 2,
                handleSize,
                handleSize
              );
            });

            // Draw delete button at top right
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(rect.width / 2, -rect.height / 2, 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw X in delete button
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(rect.width / 2 - 5, -rect.height / 2 - 5);
            ctx.lineTo(rect.width / 2 + 5, -rect.height / 2 + 5);
            ctx.moveTo(rect.width / 2 + 5, -rect.height / 2 - 5);
            ctx.lineTo(rect.width / 2 - 5, -rect.height / 2 + 5);
            ctx.stroke();
          }

          // Restore context
          ctx.restore();
        }
      }
    });

    // Draw text overlay if visible and has text
    if (textOverlay.isVisible && textOverlay.text.trim() !== "") {
      // Save current context state
      ctx.save();

      // Calculate text position, applying translationX and translationY offsets
      const textX =
        (canvas.width * textPosition.x) / 100 + textOverlay.translationX;
      const textY =
        (canvas.height * textPosition.y) / 100 + textOverlay.translationY;

      // Translate to the text position for rotation
      ctx.translate(textX, textY);

      // Apply rotation (convert degrees to radians)
      ctx.rotate((textOverlay.rotation * Math.PI) / 180);

      // Set text properties
      const fontStyle = textOverlay.isItalic ? "italic " : "";
      const fontWeight = textOverlay.isBold ? "bold " : "";
      const fontFamilyName = textOverlay.fontFamily.includes("-")
        ? `"${textOverlay.fontFamily}"`
        : textOverlay.fontFamily;

      ctx.font = `${fontStyle}${fontWeight}${textOverlay.fontSize}px ${fontFamilyName}, sans-serif`;
      ctx.fillStyle = textOverlay.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Apply letter spacing if needed
      if (textOverlay.spacing !== 0) {
        // Draw each character separately with spacing
        const chars = textOverlay.text.split("");
        let totalWidth = 0;

        // First calculate total width with spacing
        for (let i = 0; i < chars.length; i++) {
          const charWidth = ctx.measureText(chars[i]).width;
          totalWidth +=
            charWidth + (i < chars.length - 1 ? textOverlay.spacing : 0);
        }

        // Start position (centered)
        let xPos = -totalWidth / 2;

        // Draw each character
        for (let i = 0; i < chars.length; i++) {
          const charWidth = ctx.measureText(chars[i]).width;
          ctx.fillText(chars[i], xPos + charWidth / 2, 0);
          xPos += charWidth + textOverlay.spacing;
        }
      } else {
        // Draw text normally if no spacing
        ctx.fillText(textOverlay.text, 0, 0);
      }

      // Restore the context to draw the rectangle in the correct position
      ctx.restore();

      // Draw selection rectangle and controls separately (after text is drawn)
      const textRect = calculateTextRect(canvas);
      if (textRect) {
        if (isDraggingText || textOverlay.isSelected) {
          // Draw a more prominent bounding box when dragging or selected
          ctx.strokeStyle = "#3b82f6"; // Blue
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(
            textRect.x,
            textRect.y,
            textRect.width,
            textRect.height
          );

          // Draw control points
          ctx.fillStyle = "#3b82f6";
          const handleSize = 6;

          // Draw handles at corners
          [
            { x: textRect.x, y: textRect.y }, // Top-left
            { x: textRect.x + textRect.width, y: textRect.y }, // Top-right
            { x: textRect.x, y: textRect.y + textRect.height }, // Bottom-left
            { x: textRect.x + textRect.width, y: textRect.y + textRect.height }, // Bottom-right
          ].forEach((point) => {
            ctx.fillRect(
              point.x - handleSize / 2,
              point.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });

          // Draw delete button when selected (not dragging)
          if (textOverlay.isSelected && !isDraggingText) {
            // Draw delete button at top right
            ctx.fillStyle = "#ef4444"; // Red
            ctx.beginPath();
            ctx.arc(
              textRect.x + textRect.width,
              textRect.y,
              10,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Draw X in delete button
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(textRect.x + textRect.width - 5, textRect.y - 5);
            ctx.lineTo(textRect.x + textRect.width + 5, textRect.y + 5);
            ctx.moveTo(textRect.x + textRect.width + 5, textRect.y - 5);
            ctx.lineTo(textRect.x + textRect.width - 5, textRect.y + 5);
            ctx.stroke();
          }
        } else if (
          mouseX >= textRect.x &&
          mouseX <= textRect.x + textRect.width &&
          mouseY >= textRect.y &&
          mouseY <= textRect.y + textRect.height
        ) {
          // Draw a subtle bounding box when hovering
          ctx.strokeStyle = "#9ca3af"; // Gray
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            textRect.x,
            textRect.y,
            textRect.width,
            textRect.height
          );
          ctx.setLineDash([]);
        }
      }
    }
  }, [
    mainImage,
    logoImages,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    hoveredLogoId,
    calculateLogoRects,
    canvasWidth,
    textOverlay,
    textPosition,
    isDraggingText,
    calculateTextRect,
    mouseX,
    mouseY,
    designStoreAspectRatio,
  ]);

  // Replace the debounced renderCanvas with a more efficient approach
  useEffect(() => {
    // Use requestAnimationFrame for smoother rendering
    let animationFrameId: number;

    const performRender = () => {
      renderCanvas();
      animationFrameId = requestAnimationFrame(performRender);
    };

    // Start the render loop
    animationFrameId = requestAnimationFrame(performRender);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderCanvas]);

  // Force a complete render of the canvas
  const forceRender = useCallback(() => {
    console.log("Forcing complete canvas render");

    if (!canvasRef.current) {
      console.error("Canvas reference is not available for force render");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context for force render");
      return;
    }

    // Ensure canvas has dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      console.log("Canvas has zero dimensions, setting default dimensions");
      canvas.width = canvasWidth;
      canvas.height = canvasWidth * 0.75; // 4:3 aspect ratio
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Perform the render
    renderCanvas();

    console.log("Force render complete");
  }, [renderCanvas, canvasWidth]);

  const ensureCanvasRendered = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!canvasRef.current) {
        console.error("Canvas reference is not available for rendering");
        resolve();
        return;
      }

      console.log("Ensuring canvas is rendered before capture...");

      // Force a complete render
      forceRender();

      // Give the browser a moment to actually render the canvas
      setTimeout(() => {
        console.log("Canvas render wait complete");
        resolve();
      }, 300); // Increased timeout for better reliability
    });
  }, [forceRender]);

  // Add a function to prepare the canvas for export
  const prepareCanvasForExport = useCallback(async (): Promise<boolean> => {
    console.log("Preparing canvas for export...");

    if (!canvasRef.current) {
      console.error("Canvas reference not available for export preparation");
      return false;
    }

    try {
      // Force a complete render
      forceRender();

      // Wait for the render to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Ensure the canvas has proper dimensions
      const canvas = canvasRef.current;

      if (mainImage) {
        const aspectRatio = mainImage.width / mainImage.height;

        if (canvas.width === 0 || canvas.height === 0) {
          console.log("Canvas has zero dimensions, setting proper dimensions");
          canvas.width = canvasWidth;
          canvas.height =
            aspectRatio > 1 ? canvasWidth / aspectRatio : canvasWidth * 0.75;

          // Force another render after dimension change
          renderCanvas();
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } else {
        // If no main image, ensure canvas still has proper dimensions
        if (canvas.width === 0 || canvas.height === 0) {
          console.log(
            "Canvas has zero dimensions (no image), setting default dimensions"
          );
          canvas.width = canvasWidth;
          canvas.height = canvasWidth * 0.75; // 4:3 aspect ratio

          // Force another render after dimension change
          renderCanvas();
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      console.log("Canvas prepared for export with dimensions:", {
        width: canvas.width,
        height: canvas.height,
      });
      return true;
    } catch (error) {
      console.error("Error preparing canvas for export:", error);
      return false;
    }
  }, [canvasRef, mainImage, canvasWidth, forceRender, renderCanvas]);

  const captureCanvas = useCallback(async (): Promise<string | null> => {
    console.log("Attempting to capture canvas...");

    if (!canvasRef.current) {
      console.error("Canvas reference is not available");
      return null;
    }

    try {
      // Prepare the canvas for export
      const isPrepared = await prepareCanvasForExport();
      if (!isPrepared) {
        console.warn("Canvas preparation failed, will try to capture anyway");
      }

      // Force a synchronous render of the canvas before capture
      renderCanvas();

      // Wait for the render to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Simple direct capture approach
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png", 1.0);
        if (dataUrl && dataUrl.startsWith("data:image/png")) {
          console.log("Successfully captured canvas");
          return dataUrl;
        }
      } catch (err) {
        console.warn("Canvas capture failed:", err);
        return null;
      }

      return null;
    } catch (error) {
      console.error("Error in canvas capture process:", error);
      return null;
    }
  }, [renderCanvas, prepareCanvasForExport]);

  // Re-render canvas when relevant state changes
  useEffect(() => {
    // Debounce the render to prevent too many consecutive renders
    const debounceTimeout = setTimeout(() => {
      renderCanvas();
    }, 50);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [
    renderCanvas,
    mainImage,
    logoImages,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    hoveredLogoId,
    textOverlay,
    textPosition,
  ]);

  // Handle mouse down event
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      console.log("Mouse down at:", { mouseX, mouseY });
      console.log("Text overlay visible:", textOverlay.isVisible);
      console.log("Text content:", textOverlay.text);
      console.log("Canvas dimensions:", {
        width: canvas.width,
        height: canvas.height,
      });

      // Check for text interactions first
      if (textOverlay.isVisible && textOverlay.text) {
        const textRect = calculateTextRect(canvas);
        console.log("Text rect:", textRect);

        if (textRect) {
          // Check if click is on delete button when text is selected
          if (textOverlay.isSelected) {
            const deleteButtonX = textRect.x + textRect.width;
            const deleteButtonY = textRect.y;
            const deleteButtonRadius = 10;

            const distToDeleteButton = Math.sqrt(
              Math.pow(mouseX - deleteButtonX, 2) +
                Math.pow(mouseY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              console.log("Deleting text");
              deleteText();
              return;
            }

            // Check for corner handles when text is selected
            const handleSize = 6;
            const corners = [
              { x: textRect.x, y: textRect.y, corner: "topLeft" },
              {
                x: textRect.x + textRect.width,
                y: textRect.y,
                corner: "topRight",
              },
              {
                x: textRect.x,
                y: textRect.y + textRect.height,
                corner: "bottomLeft",
              },
              {
                x: textRect.x + textRect.width,
                y: textRect.y + textRect.height,
                corner: "bottomRight",
              },
            ];

            for (const corner of corners) {
              if (
                isCornerHandle(mouseX, mouseY, corner.x, corner.y, handleSize)
              ) {
                setIsResizingCorner(true);
                setResizeCorner(corner.corner as any);
                setResizeStartPoint({ x: mouseX, y: mouseY });
                return; // Exit early
              }
            }
          }

          // Check if click is inside text (unchanged from before)
          if (
            mouseX >= textRect.x &&
            mouseX <= textRect.x + textRect.width &&
            mouseY >= textRect.y &&
            mouseY <= textRect.y + textRect.height
          ) {
            // Select the text and start dragging
            console.log("Selecting text and starting drag");
            selectText(true);
            setIsDraggingText(true);

            // Calculate drag offset for text
            const textCenterX =
              (canvas.width * textPosition.x) / 100 +
              (textOverlay.translationX || 0);
            const textCenterY =
              (canvas.height * textPosition.y) / 100 +
              (textOverlay.translationY || 0);

            const newOffset = {
              x: mouseX - textCenterX,
              y: mouseY - textCenterY,
            };

            console.log("Setting text drag offset:", newOffset);
            setTextDragOffset(newOffset);

            // Deselect any selected logo
            selectLogo(null);

            // Force a render to ensure the text is highlighted as selected
            renderCanvas();
            return;
          }
        }
      }

      // If clicked outside text, deselect it
      if (textOverlay.isSelected) {
        console.log("Deselecting text");
        selectText(false);
        renderCanvas();
      }

      // Calculate logo rects
      const logoRects = calculateLogoRects(canvas);

      // Check for delete button clicks first
      for (const logo of logos) {
        if (logo.isSelected) {
          const logoRect = logoRects.get(logo.id);
          if (logoRect) {
            // Check if click is on delete button (top right corner)
            const deleteButtonX = logoRect.x + logoRect.width;
            const deleteButtonY = logoRect.y;
            const deleteButtonRadius = 10;

            const distToDeleteButton = Math.sqrt(
              Math.pow(mouseX - deleteButtonX, 2) +
                Math.pow(mouseY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              // Delete the logo
              deleteLogo(logo.id);
              return;
            }

            // Check if click is on resize handle (bottom right corner)
            const resizeHandleX = logoRect.x + logoRect.width;
            const resizeHandleY = logoRect.y + logoRect.height;
            const resizeHandleSize = 8;

            if (
              mouseX >= resizeHandleX - resizeHandleSize / 2 &&
              mouseX <= resizeHandleX + resizeHandleSize / 2 &&
              mouseY >= resizeHandleY - resizeHandleSize / 2 &&
              mouseY <= resizeHandleY + resizeHandleSize / 2
            ) {
              setIsResizing(true);
              setDraggedLogoId(logo.id);
              setInitialSize(logo.size);

              // Calculate distance from center to mouse
              const centerX = logoRect.x + logoRect.width / 2;
              const centerY = logoRect.y + logoRect.height / 2;
              setInitialMouseDistance(
                Math.sqrt(
                  Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
                )
              );

              return;
            }
          }
        }
      }

      // Check if click is inside any logo
      let clickedLogoId: string | null = null;

      // Find the topmost logo that was clicked (last in the array)
      for (let i = logos.length - 1; i >= 0; i--) {
        const logo = logos[i];
        const logoRect = logoRects.get(logo.id);

        if (
          logoRect &&
          mouseX >= logoRect.x &&
          mouseX <= logoRect.x + logoRect.width &&
          mouseY >= logoRect.y &&
          mouseY <= logoRect.y + logoRect.height
        ) {
          clickedLogoId = logo.id;
          break; // Found the topmost logo
        }
      }

      if (clickedLogoId) {
        // Select the clicked logo
        selectLogo(clickedLogoId);

        // Start dragging
        setIsDragging(true);
        setDraggedLogoId(clickedLogoId);

        // Calculate drag offset
        const logoRect = logoRects.get(clickedLogoId);
        if (logoRect) {
          const centerX = logoRect.x + logoRect.width / 2;
          const centerY = logoRect.y + logoRect.height / 2;
          setDragOffset({
            x: mouseX - centerX,
            y: mouseY - centerY,
          });
        }

        console.log("Started dragging logo:", clickedLogoId);
      } else {
        // Clicked on empty space, deselect all logos
        selectLogo(null);
      }
    },
    [
      canvasRef,
      logos,
      calculateLogoRects,
      selectLogo,
      deleteLogo,
      textOverlay,
      calculateTextRect,
      selectText,
      deleteText,
      textPosition,
    ]
  );

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const currentMouseX = (e.clientX - rect.left) * scaleX;
      const currentMouseY = (e.clientY - rect.top) * scaleY;

      // Update mouse position state
      setMouseX(currentMouseX);
      setMouseY(currentMouseY);

      // Log mouse position during dragging for debugging
      if (isDraggingText) {
        console.log("Dragging text, mouse position:", {
          currentMouseX,
          currentMouseY,
        });
        console.log("Canvas dimensions:", {
          width: canvas.width,
          height: canvas.height,
        });
        console.log("Text drag offset:", textDragOffset);
      }

      // Update cursor based on what's under it
      canvas.style.cursor = "default";

      // Calculate logo rects
      const logoRects = calculateLogoRects(canvas);

      // Check for hover over logos or controls
      let hoveredLogo: string | null = null;

      for (let i = logos.length - 1; i >= 0; i--) {
        const logo = logos[i];
        const logoRect = logoRects.get(logo.id);

        if (logoRect) {
          // Check for hover over delete button
          if (logo.isSelected) {
            const deleteButtonX = logoRect.x + logoRect.width;
            const deleteButtonY = logoRect.y;
            const deleteButtonRadius = 10;

            const distToDeleteButton = Math.sqrt(
              Math.pow(currentMouseX - deleteButtonX, 2) +
                Math.pow(currentMouseY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              canvas.style.cursor = "pointer";
              hoveredLogo = logo.id;
              break;
            }

            // Check for hover over resize handle
            const resizeHandleX = logoRect.x + logoRect.width;
            const resizeHandleY = logoRect.y + logoRect.height;
            const resizeHandleSize = 8;

            if (
              currentMouseX >= resizeHandleX - resizeHandleSize / 2 &&
              currentMouseX <= resizeHandleX + resizeHandleSize / 2 &&
              currentMouseY >= resizeHandleY - resizeHandleSize / 2 &&
              currentMouseY <= resizeHandleY + resizeHandleSize / 2
            ) {
              canvas.style.cursor = "nwse-resize";
              hoveredLogo = logo.id;
              break;
            }
          }

          // Check for hover over logo
          if (
            currentMouseX >= logoRect.x &&
            currentMouseX <= logoRect.x + logoRect.width &&
            currentMouseY >= logoRect.y &&
            currentMouseY <= logoRect.y + logoRect.height
          ) {
            canvas.style.cursor = "move";
            hoveredLogo = logo.id;
            break;
          }
        }
      }

      // Check for hover over text
      if (textOverlay.isVisible && textOverlay.text) {
        const textRect = calculateTextRect(canvas);
        if (
          textRect &&
          currentMouseX >= textRect.x &&
          currentMouseX <= textRect.x + textRect.width &&
          currentMouseY >= textRect.y &&
          currentMouseY <= textRect.y + textRect.height
        ) {
          canvas.style.cursor = "move";
        }
      }

      setHoveredLogoId(hoveredLogo);

      // Handle dragging logo
      if (isDragging && draggedLogoId) {
        // Calculate new position as percentage
        const newX = ((currentMouseX - dragOffset.x) / canvas.width) * 100;
        const newY = ((currentMouseY - dragOffset.y) / canvas.height) * 100;

        // Update logo position
        updateLogo(draggedLogoId, {
          position: {
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY)),
          },
        });
      }

      // Handle dragging text - ensure this works even when there's no image
      if (isDraggingText) {
        // Ensure canvas dimensions are valid
        if (canvas.width > 0 && canvas.height > 0) {
          // Calculate new position as percentage (accounting for offset)
          const newX =
            ((currentMouseX - textDragOffset.x) / canvas.width) * 100;
          const newY =
            ((currentMouseY - textDragOffset.y) / canvas.height) * 100;

          console.log("New text position:", { newX, newY });

          // Update text position with bounds checking
          setTextPosition({
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY)),
          });

          // Force a render to update the text position visually
          renderCanvas();
        } else {
          console.error("Canvas dimensions are invalid for text dragging");
        }
      }

      // Handle resizing
      if (isResizing && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (logo) {
          const logoRect = logoRects.get(draggedLogoId);
          if (logoRect) {
            // Calculate center of logo
            const centerX = logoRect.x + logoRect.width / 2;
            const centerY = logoRect.y + logoRect.height / 2;

            // Calculate new distance from center to mouse
            const newDistance = Math.sqrt(
              Math.pow(currentMouseX - centerX, 2) +
                Math.pow(currentMouseY - centerY, 2)
            );

            // Calculate size change ratio
            const sizeRatio = newDistance / initialMouseDistance;

            // Calculate new size
            const newSize = Math.max(5, Math.min(100, initialSize * sizeRatio));

            // Update logo size
            updateLogo(draggedLogoId, { size: newSize });
          }
        }
      }

      // Update the mouse move handler to implement resizing by corner
      const handleResizeByCorner = (
        currentMouseX: number,
        currentMouseY: number
      ) => {
        if (!isResizingCorner || !resizeCorner) return;

        if (draggedLogoId) {
          const logo = logos.find((l) => l.id === draggedLogoId);
          if (!logo) return;

          const logoRect = logoRects.get(draggedLogoId);
          if (!logoRect) return;

          // Get logo center
          const centerX = (canvas.width * logo.position.x) / 100;
          const centerY = (canvas.height * logo.position.y) / 100;

          // Calculate distance from center to current mouse position
          const distX = Math.abs(currentMouseX - centerX);
          const distY = Math.abs(currentMouseY - centerY);

          // Use the max distance to determine the new size (keeping aspect ratio)
          const maxDist = Math.max(distX, distY);

          // Convert to percentage of canvas
          const newSize = ((maxDist * 2) / canvas.width) * 100;

          // Update logo size with constraints
          updateLogo(draggedLogoId, {
            size: Math.max(5, Math.min(100, newSize)),
          });
        } else if (textOverlay.isSelected) {
          // Calculate new font size based on corner drag
          const textRect = calculateTextRect(canvas);
          if (!textRect) return;

          // Use the width of the rect to determine font size
          let newWidth = 0;
          switch (resizeCorner) {
            case "bottomRight":
            case "topRight":
              newWidth = currentMouseX - textRect.x;
              break;
            case "bottomLeft":
            case "topLeft":
              newWidth = textRect.x + textRect.width - currentMouseX;
              break;
          }

          // Calculate font size proportionally but make sure we keep text visible
          if (newWidth > 20) {
            // Enforce minimum width for visibility
            // Adjust scaling factor for better feel
            const baseWidth = textRect.width - textOverlay.fontSize * 0.6; // Remove padding from calculation
            const scaleFactor = textOverlay.fontSize / baseWidth;
            const newFontSize = Math.max(
              8,
              Math.min(120, (newWidth - 20) * scaleFactor)
            );

            // Update text font size - use an object with the full text properties
            setTextOverlay({
              ...textOverlay, // Keep existing properties
              fontSize: Math.round(newFontSize),
            });
          }
        }
      };

      // Call this function in the mousemove handler
      if (isResizingCorner) {
        handleResizeByCorner(currentMouseX, currentMouseY);
      }
    },
    [
      canvasRef,
      logos,
      calculateLogoRects,
      isDragging,
      isResizing,
      draggedLogoId,
      dragOffset,
      initialMouseDistance,
      initialSize,
      updateLogo,
      textOverlay,
      calculateTextRect,
      isDraggingText,
      textDragOffset,
      textPosition,
      renderCanvas,
      isResizingCorner,
      resizeCorner,
      setIsResizingCorner,
      setResizeCorner,
    ]
  );

  // Handle mouse up event
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing || isResizingCorner) {
      console.log("Stopped dragging/resizing");
      setIsDragging(false);
      setIsResizing(false);
      setIsResizingCorner(false);
      setResizeCorner(null);
      setDraggedLogoId(null);
    }

    if (isDraggingText) {
      console.log("Stopped dragging text");
      setIsDraggingText(false);
    }
  }, [isDragging, isResizing, isDraggingText, isResizingCorner]);

  // Add event listeners
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Add keyboard shortcuts for selected logo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedLogo = logos.find((logo) => logo.isSelected);
      if (!selectedLogo) return;

      const STEP = 1; // 1% movement step

      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteLogo(selectedLogo.id);
          break;
        case "ArrowUp":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.max(0, selectedLogo.position.y - STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowDown":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.min(100, selectedLogo.position.y + STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowLeft":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.max(0, selectedLogo.position.x - STEP),
            },
          });
          e.preventDefault();
          break;
        case "ArrowRight":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.min(100, selectedLogo.position.x + STEP),
            },
          });
          e.preventDefault();
          break;
        case "+":
        case "=":
          updateLogo(selectedLogo.id, {
            size: Math.min(100, selectedLogo.size + 5),
          });
          e.preventDefault();
          break;
        case "-":
        case "_":
          updateLogo(selectedLogo.id, {
            size: Math.max(5, selectedLogo.size - 5),
          });
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [logos, updateLogo, deleteLogo]);

  // Add keyboard shortcuts for text positioning (similar to logo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Existing logo keyboard handling...

      // Add text keyboard handling
      if (textOverlay.isSelected) {
        const STEP = 1; // 1% movement step

        switch (e.key) {
          case "ArrowUp":
            setTextPosition((prev) => ({
              ...prev,
              y: Math.max(0, prev.y - STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowDown":
            setTextPosition((prev) => ({
              ...prev,
              y: Math.min(100, prev.y + STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowLeft":
            setTextPosition((prev) => ({
              ...prev,
              x: Math.max(0, prev.x - STEP),
            }));
            e.preventDefault();
            break;
          case "ArrowRight":
            setTextPosition((prev) => ({
              ...prev,
              x: Math.min(100, prev.x + STEP),
            }));
            e.preventDefault();
            break;
          case "Delete":
          case "Backspace":
            deleteText();
            break;
          case "Escape":
            selectText(false);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    logos,
    updateLogo,
    deleteLogo,
    textOverlay.isSelected,
    selectText,
    deleteText,
    textPosition,
  ]);

  // Create context value with memoized captureCanvas function
  const contextValue = React.useMemo(
    () => ({
      captureCanvas,
    }),
    [captureCanvas, prepareCanvasForExport]
  );

  // Delete main image handler
  const handleDeleteMainImage = () => {
    if (
      confirm("Are you sure you want to remove this image from the canvas?")
    ) {
      clearMainImage();
      // Also clear the current design selection
      useDesignStore.getState().setCurrentDesignId(null);
    }
  };

  // Initialize canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) {
      console.error("Canvas reference is not available during initialization");
      return;
    }

    const canvas = canvasRef.current;

    // Set initial dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasWidth * 0.75; // 4:3 aspect ratio

    // Clear canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Initial render
    renderCanvas();
  }, [canvasWidth, renderCanvas]);

  // Handle scroll events for the canvas
  useEffect(() => {
    const handleScroll = () => {
      // Get the current scroll position
      const scrollY = window.scrollY;

      // Update scroll position state
      setScrollPosition(scrollY);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // When setting text, ensure we set it to center initially
  useEffect(() => {
    // Reset text position to center when text becomes visible but wasn't before
    if (
      textOverlay.isVisible &&
      textOverlay.text &&
      !prevTextVisibleRef.current
    ) {
      setTextPosition({ x: 50, y: 50 });
    }
    prevTextVisibleRef.current =
      textOverlay.isVisible && Boolean(textOverlay.text);
  }, [textOverlay.isVisible, textOverlay.text]);

  // Add this ref to track previous state
  const prevTextVisibleRef = useRef(false);

  // Update the handleMouseDown function to handle corner detection for text correctly
  const isCornerHandle = (
    x: number,
    y: number,
    cornerX: number,
    cornerY: number,
    handleSize: number
  ) => {
    return (
      x >= cornerX - handleSize / 2 &&
      x <= cornerX + handleSize / 2 &&
      y >= cornerY - handleSize / 2 &&
      y <= cornerY + handleSize / 2
    );
  };

  // Add an effect to track viewport dimensions
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    // Set initial dimensions
    handleResize();

    // Update on resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ImageRenderContext.Provider value={contextValue}>
      <div className="relative mx-auto py-8" style={{ marginRight: "384px" }}>
        <div
          className="fixed bg-white dark-bg-neutral-900 rounded-lg shadow-md z-10"
          style={{
            left: "calc(50% - 192px)",
            top: "43%",
            transform: "translate(-50%, -50%)",
            height: "auto",
            minHeight: `${
              canvasWidth /
              (designStoreAspectRatio.split(":").map(Number)[0] /
                designStoreAspectRatio.split(":").map(Number)[1])
            }px`,
            width: `${canvasWidth}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            margin: "20px auto",
          }}
        >
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark-text-white">
            Canvas
          </h2>

          {imageUrl && (
            <button
              className="absolute top-3 right-3 p-1 rounded-full bg-red-500 text-white opacity-50 hover-opacity-100 z-10"
              onClick={handleDeleteMainImage}
              title="Remove image from canvas"
            >
              <Trash2 size={16} />
            </button>
          )}

          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-lg shadow-lg"
              style={{
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Empty state message */}
          {!mainImage && logos.length === 0 && !textOverlay.isVisible && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              Select an image or add text to display
            </div>
          )}

          {/* Controls overlay */}
          <div className="flex gap-2 justify-end mt-4">
            {logos.length > 0 && (
              <button
                onClick={() => selectLogo(null)}
                className="p-2 bg-white rounded-full shadow-md hover-bg-gray-100"
                title="Deselect all logos"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z" />
                </svg>
              </button>
            )}
          </div>

          {/* Help text */}
          {logos.some((logo) => logo.isSelected) && (
            <div className="mt-2 text-xs text-gray-500">
              <p>
                Tip: Use arrow keys to move logo, +/- to resize, Delete to
                remove
              </p>
            </div>
          )}
          {textOverlay.isVisible && textOverlay.text && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Tip: Click and drag to position text</p>
            </div>
          )}
        </div>

        {/* Spacer with dynamic height */}
        <div
          style={{
            height: `${
              canvasWidth /
                (designStoreAspectRatio.split(":").map(Number)[0] /
                  designStoreAspectRatio.split(":").map(Number)[1]) +
              100
            }px`,
            width: `${canvasWidth}px`,
            margin: "0 auto",
          }}
        />
      </div>
    </ImageRenderContext.Provider>
  );
};

export default ImageRender;
