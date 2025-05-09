"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useImageStore } from "@/app/store/imageStore";
import { TextOverlay, useDesignStore } from "@/app/store/designStore";
import { useFilterStore } from "@/app/store/filterStore";
import { Trash2 } from "lucide-react";

// Add memo wrapper to prevent unnecessary re-renders from parent
const ImageRender = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Add a ref to track if we should render the canvas
  const shouldRenderRef = useRef(true);
  // Add a ref to track the last render timestamp
  const lastRenderTimeRef = useRef(0);

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
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  // Add state for tracking the dragged text ID
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);

  // Add these state variables for text resizing
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizingTextId, setResizingTextId] = useState<string | null>(null);
  const [textResizeStartPoint, setTextResizeStartPoint] = useState({
    x: 0,
    y: 0,
  });
  const [initialFontSize, setInitialFontSize] = useState(0);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);

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
  const {
    textOverlay,
    setTextOverlay,
    selectText,
    deleteText,
    // Add new multi-text related state and functions
    textOverlays,
    updateText,
    deleteTextById,
    selectTextById,
  } = useDesignStore();

  // Inside the ImageRender component, add this right after your other state declarations
  const { aspectRatio: designStoreAspectRatio } = useDesignStore();

  // Get active filter from filter store
  const { activeFilter } = useFilterStore();

  // Effect to apply selected filter from filter store when it changes
  useEffect(() => {
    if (activeFilter) {
      console.log("Applying filter from filter store:", activeFilter);
      // Update image store with filter values
      const { brightness, contrast, saturation, sepia, opacity } =
        activeFilter.filter;
      useImageStore.setState({
        brightness: brightness || 100,
        contrast: contrast || 100,
        saturation: saturation || 100,
        sepia: sepia || 0,
        opacity: opacity || 100,
      });
    }
  }, [activeFilter]);

  // Add or update this effect for handling aspect ratio when image loads
  useEffect(() => {
    if (
      mainImage &&
      mainImage.naturalWidth > 0 &&
      mainImage.naturalHeight > 0 &&
      typeof window !== "undefined"
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
  }, [mainImage, designStoreAspectRatio]);

  // Add resize listener to handle window resizing
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
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

      // Get the current aspect ratio from the design store
      const [widthRatio, heightRatio] = designStoreAspectRatio
        .split(":")
        .map(Number);
      const aspectRatio = widthRatio / heightRatio;

      // Calculate height based on aspect ratio
      const calculatedHeight = baseWidth / aspectRatio;
      const maxHeight = viewportHeight * 0.8; // Maximum 80% of viewport height

      // Adjust width if height exceeds maximum
      if (calculatedHeight > maxHeight) {
        baseWidth = maxHeight * aspectRatio;
      }

      // Update canvas size
      setCanvasWidth(baseWidth);
    };

    window.addEventListener("resize", handleResize);

    // Call once to initialize
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [designStoreAspectRatio]);

  const calculateImageBounds = useCallback(() => {
    if (!canvasRef.current || !mainImage)
      return { left: 0, top: 0, right: 100, bottom: 100 };

    const canvas = canvasRef.current;
    const imageRatio = mainImage.width / mainImage.height;
    const canvasRatio = canvas.width / canvas.height;

    // Calculate the actual image boundaries within the canvas (in percentage)
    let imageBounds = { left: 0, top: 0, right: 100, bottom: 100 };

    if (imageRatio > canvasRatio) {
      // Image is wider than canvas ratio (has vertical margins)
      const drawHeight = canvas.width / imageRatio;
      const verticalMargin = (canvas.height - drawHeight) / 2;

      // Convert to percentage for consistency
      const topMarginPercent = (verticalMargin / canvas.height) * 100;
      const bottomMarginPercent = 100 - topMarginPercent;

      imageBounds = {
        left: 0,
        top: topMarginPercent,
        right: 100,
        bottom: bottomMarginPercent,
      };
    } else {
      // Image is taller than canvas ratio (has horizontal margins)
      const drawWidth = canvas.height * imageRatio;
      const horizontalMargin = (canvas.width - drawWidth) / 2;

      // Convert to percentage for consistency
      const leftMarginPercent = (horizontalMargin / canvas.width) * 100;
      const rightMarginPercent = 100 - leftMarginPercent;

      imageBounds = {
        left: leftMarginPercent,
        top: 0,
        right: rightMarginPercent,
        bottom: 100,
      };
    }

    return imageBounds;
  }, [canvasRef, mainImage]);

  // Memoize the calculateLogoRects function with more specific dependencies
  const calculateLogoRects = useCallback(
    (
      canvas: HTMLCanvasElement
    ): Map<string, { x: number; y: number; width: number; height: number }> => {
      const rects = new Map();

      for (const logo of logos) {
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
      }

      return rects;
    },
    [logos, logoImages]
  );

  // Update the calculateTextRect function to handle rotation differently
  const calculateTextRect = useCallback(
    (
      canvas: HTMLCanvasElement,
      currentText = textOverlay // Default to legacy textOverlay if not specified
    ): { x: number; y: number; width: number; height: number } | null => {
      if (!currentText.isVisible || !currentText.text) {
        return null;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }

      // Set font properties
      const fontStyle = currentText.isItalic ? "italic " : "";
      const fontWeight = currentText.isBold ? "bold " : "";
      const fontFamilyName = currentText.fontFamily.includes("-")
        ? `"${currentText.fontFamily}"`
        : currentText.fontFamily;

      ctx.font = `${fontStyle}${fontWeight}${currentText.fontSize}px ${fontFamilyName}, sans-serif`;

      // Measure text
      const metrics = ctx.measureText(currentText.text);

      // Get proper text metrics with padding for better visibility and clickability
      const padding = Math.max(10, currentText.fontSize * 0.3); // Dynamic padding based on font size

      // Calculate more accurate height (use actualBoundingBoxAscent if available)
      const textHeight =
        metrics.actualBoundingBoxAscent !== undefined
          ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
          : currentText.fontSize * 1.2; // Fallback with multiplier for better height

      const textWidth = metrics.width;

      // Calculate position (centered around the text position)
      const textX =
        (canvas.width * currentText.position.x) / 100 +
        (currentText.translationX || 0);
      const textY =
        (canvas.height * currentText.position.y) / 100 +
        (currentText.translationY || 0);

      // Create a rect with padding for easier selection
      let rect = {
        x: textX - (textWidth / 2 + padding), // Center horizontally with padding
        y: textY - (textHeight / 2 + padding), // Center vertically with padding
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
      };

      // For rotated text, we'll handle the rotation in the draw function instead
      // This ensures the rectangle stays aligned with the text
      return rect;
    },
    [] // No dependencies since we take currentText as a parameter
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

  // Update the drawTextOverlay function to include extended resize regions
  const drawTextOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      text: TextOverlay
    ) => {
      // Save current context state
      ctx.save();

      // Calculate text position, applying translationX and translationY offsets
      const textX =
        (canvas.width * text.position.x) / 100 + (text.translationX || 0);
      const textY =
        (canvas.height * text.position.y) / 100 + (text.translationY || 0);

      // Translate to the text position for rotation
      ctx.translate(textX, textY);

      // Apply rotation (convert degrees to radians)
      ctx.rotate((text.rotation * Math.PI) / 180);

      // Set text properties
      const fontStyle = text.isItalic ? "italic " : "";
      const fontWeight = text.isBold ? "bold " : "";
      const fontFamilyName = text.fontFamily.includes("-")
        ? `"${text.fontFamily}"`
        : text.fontFamily;

      ctx.font = `${fontStyle}${fontWeight}${text.fontSize}px ${fontFamilyName}, sans-serif`;
      ctx.fillStyle = text.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Apply letter spacing if needed
      if (text.spacing !== 0) {
        // Draw each character separately with spacing
        const chars = text.text.split("");
        let totalWidth = 0;

        // First calculate total width with spacing
        for (let i = 0; i < chars.length; i++) {
          const charWidth = ctx.measureText(chars[i]).width;
          totalWidth += charWidth + (i < chars.length - 1 ? text.spacing : 0);
        }

        // Start position (centered)
        let xPos = -totalWidth / 2;

        // Draw each character
        for (let i = 0; i < chars.length; i++) {
          const charWidth = ctx.measureText(chars[i]).width;
          ctx.fillText(chars[i], xPos + charWidth / 2, 0);
          xPos += charWidth + text.spacing;
        }
      } else {
        // Draw text normally if no spacing
        ctx.fillText(text.text, 0, 0);
      }

      // Restore the context to draw the rectangle in the correct position
      ctx.restore();

      // Draw selection rectangle and controls separately (after text is drawn)
      const textRect = calculateTextRect(canvas, text);
      if (textRect) {
        const isDraggingThisText =
          isDraggingText &&
          (text.id === draggedTextId ||
            (draggedTextId === null && text === textOverlay));

        const isResizingThisText =
          isResizingText &&
          (text.id === resizingTextId ||
            (resizingTextId === null && text === textOverlay));

        if (isDraggingThisText || text.isSelected || isResizingThisText) {
          // Save the current context state
          ctx.save();

          // Translate to the text position for rotation
          const textX =
            (canvas.width * text.position.x) / 100 + (text.translationX || 0);
          const textY =
            (canvas.height * text.position.y) / 100 + (text.translationY || 0);
          ctx.translate(textX, textY);

          // Apply rotation if needed
          if (text.rotation && text.rotation !== 0) {
            ctx.rotate((text.rotation * Math.PI) / 180);
          }

          // Draw a more prominent bounding box when dragging or selected
          ctx.strokeStyle = "#3b82f6"; // Blue
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(
            -textRect.width / 2,
            -textRect.height / 2,
            textRect.width,
            textRect.height
          );

          // Define edge regions for resizing (larger areas for better usability)
          const edgeSize = 24; // Increased to 24px for better grab area
          const edges = [
            {
              x: -textRect.width / 2,
              y: -textRect.height / 2 - edgeSize / 2,
              width: textRect.width,
              height: edgeSize,
              cursor: "ns-resize",
              direction: "top",
            }, // Top edge
            {
              x: -textRect.width / 2,
              y: textRect.height / 2 - edgeSize / 2,
              width: textRect.width,
              height: edgeSize,
              cursor: "ns-resize",
              direction: "bottom",
            }, // Bottom edge
            {
              x: -textRect.width / 2 - edgeSize / 2,
              y: -textRect.height / 2,
              width: edgeSize,
              height: textRect.height,
              cursor: "ew-resize",
              direction: "left",
            }, // Left edge
            {
              x: textRect.width / 2 - edgeSize / 2,
              y: -textRect.height / 2,
              width: edgeSize,
              height: textRect.height,
              cursor: "ew-resize",
              direction: "right",
            }, // Right edge
          ];

          // Draw blue corner squares (Figma style)
          const cornerSize = 16; // Increased to 16px for better visibility and grab area
          const corners = [
            {
              x: -textRect.width / 2 - cornerSize / 2,
              y: -textRect.height / 2 - cornerSize / 2,
              cursor: "nwse-resize",
              direction: "topLeft",
            }, // Top-left corner
            {
              x: textRect.width / 2 - cornerSize / 2,
              y: -textRect.height / 2 - cornerSize / 2,
              cursor: "nesw-resize",
              direction: "topRight",
            }, // Top-right corner
            {
              x: -textRect.width / 2 - cornerSize / 2,
              y: textRect.height / 2 - cornerSize / 2,
              cursor: "nesw-resize",
              direction: "bottomLeft",
            }, // Bottom-left corner
            {
              x: textRect.width / 2 - cornerSize / 2,
              y: textRect.height / 2 - cornerSize / 2,
              cursor: "nwse-resize",
              direction: "bottomRight",
            }, // Bottom-right corner
          ];

          // Draw corner squares with a subtle highlight
          corners.forEach((corner) => {
            // Draw a subtle background for better visibility
            ctx.fillStyle = "rgba(59, 130, 246, 0.1)"; // Light blue background
            ctx.fillRect(corner.x, corner.y, cornerSize, cornerSize);

            // Draw the main corner square
            ctx.fillStyle = "#3b82f6"; // Blue color for corners
            ctx.fillRect(
              corner.x + (cornerSize - 8) / 2,
              corner.y + (cornerSize - 8) / 2,
              8,
              8
            );
          });

          // Restore the context
          ctx.restore();

          // Check if mouse is over any edge or corner
          if (mouseX !== undefined && mouseY !== undefined) {
            // Transform mouse coordinates to account for rotation
            const dx = mouseX - textX;
            const dy = mouseY - textY;
            const angle = text.rotation ? (text.rotation * Math.PI) / 180 : 0;
            const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
            const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

            // Check edges first
            for (const edge of edges) {
              if (
                rotatedX >= edge.x &&
                rotatedX <= edge.x + edge.width &&
                rotatedY >= edge.y &&
                rotatedY <= edge.y + edge.height
              ) {
                canvas.style.cursor = edge.cursor;
                break;
              }
            }

            // Then check corners
            for (const corner of corners) {
              if (
                rotatedX >= corner.x &&
                rotatedX <= corner.x + cornerSize &&
                rotatedY >= corner.y &&
                rotatedY <= corner.y + cornerSize
              ) {
                canvas.style.cursor = corner.cursor;
                break;
              }
            }
          }

          // Draw delete button when selected (not dragging)
          if (text.isSelected && !isDraggingThisText && !isResizingThisText) {
            // Save context state
            ctx.save();

            // Translate to the text position for rotation
            const textX =
              (canvas.width * text.position.x) / 100 + (text.translationX || 0);
            const textY =
              (canvas.height * text.position.y) / 100 +
              (text.translationY || 0);
            ctx.translate(textX, textY);

            // Apply rotation if needed
            if (text.rotation && text.rotation !== 0) {
              ctx.rotate((text.rotation * Math.PI) / 180);
            }

            // Position delete button at top right corner of the rectangle
            const deleteButtonX = textRect.width / 2;
            const deleteButtonY = -textRect.height / 2;
            const deleteButtonRadius = 10;

            // Draw delete button background
            ctx.fillStyle = "#ef4444"; // Red
            ctx.beginPath();
            ctx.arc(
              deleteButtonX,
              deleteButtonY,
              deleteButtonRadius,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Draw X in delete button
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(deleteButtonX - 5, deleteButtonY - 5);
            ctx.lineTo(deleteButtonX + 5, deleteButtonY + 5);
            ctx.moveTo(deleteButtonX + 5, deleteButtonY - 5);
            ctx.lineTo(deleteButtonX - 5, deleteButtonY + 5);
            ctx.stroke();

            // Restore context
            ctx.restore();

            // Check if mouse is over delete button
            if (mouseX !== undefined && mouseY !== undefined) {
              // Transform mouse coordinates to account for rotation
              const dx = mouseX - textX;
              const dy = mouseY - textY;
              const angle = text.rotation ? (text.rotation * Math.PI) / 180 : 0;
              const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
              const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

              // Calculate distance from mouse to delete button
              const distToDeleteButton = Math.sqrt(
                Math.pow(rotatedX - deleteButtonX, 2) +
                  Math.pow(rotatedY - deleteButtonY, 2)
              );

              if (distToDeleteButton <= deleteButtonRadius) {
                canvas.style.cursor = "pointer";
              }
            }
          } else if (
            mouseX !== undefined &&
            mouseY !== undefined &&
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
    },
    [
      calculateTextRect,
      isDraggingText,
      draggedTextId,
      textOverlay,
      mouseX,
      mouseY,
      isResizingText,
      resizingTextId,
    ]
  );

  // Update renderCanvas to handle multiple text overlays
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Cache values to prevent re-calculation within the same render
    const currentCanvasWidth = canvasWidth;
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
      canvas.width !== currentCanvasWidth ||
      Math.abs(canvas.height - currentCanvasWidth / aspectRatio) > 1
    ) {
      canvas.width = currentCanvasWidth;
      canvas.height = currentCanvasWidth / aspectRatio;
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

    // Calculate logo rects for hit testing once per render
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

          // Check if this logo is currently being dragged or resized
          const isCurrentlyDragging = isDragging && draggedLogoId === logo.id;
          const isCurrentlyResizing = isResizing && draggedLogoId === logo.id;
          const isCurrentlyResizingCorner =
            isResizingCorner && draggedLogoId === logo.id;

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

            // Draw delete button at top right, only when not dragging or resizing
            if (
              logo.isSelected &&
              !isCurrentlyDragging &&
              !isCurrentlyResizing &&
              !isCurrentlyResizingCorner
            ) {
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
          }

          // Restore context
          ctx.restore();
        }
      }
    });

    // Draw text overlays - first draw the legacy text for backward compatibility
    if (textOverlay.isVisible && textOverlay.text.trim() !== "") {
      drawTextOverlay(ctx, canvas, textOverlay);
    }

    // Draw all text overlays from the new array
    textOverlays.forEach((text) => {
      if (text.isVisible && text.text.trim() !== "") {
        drawTextOverlay(ctx, canvas, text);
      }
    });
  }, [
    canvasRef,
    canvasWidth,
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
    textOverlay.isVisible,
    textOverlay.text,
    textOverlay.color,
    textOverlay.fontFamily,
    textOverlay.fontSize,
    textOverlay.isBold,
    textOverlay.isItalic,
    textOverlay.position,
    textOverlay.rotation,
    textOverlay.spacing,
    textOverlay.isSelected,
    textOverlays,
    drawTextOverlay,
    designStoreAspectRatio,
    textPosition,
    isDragging,
    draggedLogoId,
    isResizing,
    isResizingCorner,
  ]);

  // Re-render canvas when relevant state changes - with optimized dependencies
  useEffect(() => {
    // Set the flag to trigger a render on the next animation frame
    shouldRenderRef.current = true;

    // Batch renders by using requestAnimationFrame
    requestAnimationFrame(() => {
      if (shouldRenderRef.current) {
        renderCanvas();
        shouldRenderRef.current = false;
      }
    });
  }, [
    renderCanvas,
    mainImage,
    logoImages.size,
    logos.length,
    brightness,
    contrast,
    saturation,
    sepia,
    opacity,
    hoveredLogoId,
    textOverlay.isVisible,
    textOverlay.text,
    textOverlays.length,
    textPosition,
  ]);

  // Force a complete render of the canvas

  // Add a function to prepare the canvas for export

  // Update the handleMouseDown function to match the new resize regions
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Create a combined array of all text overlays (including legacy one)
      const allTextOverlays = [...textOverlays];
      if (textOverlay.isVisible && textOverlay.text) {
        allTextOverlays.push(textOverlay);
      }

      // Process text overlays in reverse order (to handle top elements first)
      let textHandled = false;
      for (let i = allTextOverlays.length - 1; i >= 0; i--) {
        const currentText = allTextOverlays[i];
        if (!currentText.isVisible || !currentText.text) continue;

        const textRect = calculateTextRect(canvas, currentText);
        if (!textRect) continue;

        // Check if click is within text bounds
        if (
          mouseX >= textRect.x &&
          mouseX <= textRect.x + textRect.width &&
          mouseY >= textRect.y &&
          mouseY <= textRect.y + textRect.height
        ) {
          // First check if the text is selected and the click is on delete button
          if (currentText.isSelected) {
            // Transform mouse coordinates to account for rotation
            const textX =
              (canvas.width * currentText.position.x) / 100 +
              (currentText.translationX || 0);
            const textY =
              (canvas.height * currentText.position.y) / 100 +
              (currentText.translationY || 0);
            const dx = mouseX - textX;
            const dy = mouseY - textY;
            const angle = currentText.rotation
              ? (currentText.rotation * Math.PI) / 180
              : 0;
            const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
            const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

            // Calculate delete button position in rotated coordinates
            const deleteButtonX = textRect.width / 2;
            const deleteButtonY = -textRect.height / 2;
            const deleteButtonRadius = 10;

            // Check if click is on delete button
            const distToDeleteButton = Math.sqrt(
              Math.pow(rotatedX - deleteButtonX, 2) +
                Math.pow(rotatedY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              if (currentText === textOverlay) {
                deleteText();
              } else {
                deleteTextById(currentText.id);
              }
              textHandled = true;
              break;
            }

            // Check for edge-based resizing
            const edgeSize = 24; // Increased to match visual size
            const edges = [
              {
                x: textRect.x,
                y: textRect.y - edgeSize / 2,
                width: textRect.width,
                height: edgeSize,
                direction: "top",
              }, // Top edge
              {
                x: textRect.x,
                y: textRect.y + textRect.height - edgeSize / 2,
                width: textRect.width,
                height: edgeSize,
                direction: "bottom",
              }, // Bottom edge
              {
                x: textRect.x - edgeSize / 2,
                y: textRect.y,
                width: edgeSize,
                height: textRect.height,
                direction: "left",
              }, // Left edge
              {
                x: textRect.x + textRect.width - edgeSize / 2,
                y: textRect.y,
                width: edgeSize,
                height: textRect.height,
                direction: "right",
              }, // Right edge
            ];

            // Check corners
            const cornerSize = 16; // Increased to match visual size
            const corners = [
              {
                x: textRect.x - cornerSize / 2,
                y: textRect.y - cornerSize / 2,
                direction: "topLeft",
              }, // Top-left corner
              {
                x: textRect.x + textRect.width - cornerSize / 2,
                y: textRect.y - cornerSize / 2,
                direction: "topRight",
              }, // Top-right corner
              {
                x: textRect.x - cornerSize / 2,
                y: textRect.y + textRect.height - cornerSize / 2,
                direction: "bottomLeft",
              }, // Bottom-left corner
              {
                x: textRect.x + textRect.width - cornerSize / 2,
                y: textRect.y + textRect.height - cornerSize / 2,
                direction: "bottomRight",
              }, // Bottom-right corner
            ];

            // Check if clicked on any edge
            for (const edge of edges) {
              if (
                mouseX >= edge.x &&
                mouseX <= edge.x + edge.width &&
                mouseY >= edge.y &&
                mouseY <= edge.y + edge.height
              ) {
                setIsResizingText(true);
                setResizeDirection(edge.direction);
                setTextResizeStartPoint({ x: mouseX, y: mouseY });
                setResizingTextId(
                  currentText === textOverlay ? null : currentText.id
                );
                setInitialFontSize(currentText.fontSize);
                textHandled = true;
                break;
              }
            }

            // Check if clicked on any corner
            if (!textHandled) {
              for (const corner of corners) {
                if (
                  mouseX >= corner.x &&
                  mouseX <= corner.x + cornerSize &&
                  mouseY >= corner.y &&
                  mouseY <= corner.y + cornerSize
                ) {
                  setIsResizingText(true);
                  setResizeDirection(corner.direction);
                  setTextResizeStartPoint({ x: mouseX, y: mouseY });
                  setResizingTextId(
                    currentText === textOverlay ? null : currentText.id
                  );
                  setInitialFontSize(currentText.fontSize);
                  textHandled = true;
                  break;
                }
              }
            }

            if (textHandled) break;
          }

          // If we reach here, we're not deleting or resizing, so we're selecting/dragging
          // Select the text and prepare for dragging
          if (currentText === textOverlay) {
            // Handle legacy text
            selectText(true);
            setDraggedTextId(null);
          } else {
            // Handle text from new array
            selectTextById(currentText.id);
            setDraggedTextId(currentText.id);
          }

          setIsDraggingText(true);

          // Calculate drag offset
          const textCenterX =
            (canvas.width * currentText.position.x) / 100 +
            (currentText.translationX || 0);
          const textCenterY =
            (canvas.height * currentText.position.y) / 100 +
            (currentText.translationY || 0);

          setTextDragOffset({
            x: mouseX - textCenterX,
            y: mouseY - textCenterY,
          });

          // Deselect any selected logo
          selectLogo(null);

          textHandled = true;
          break;
        }
      }

      if (textHandled) {
        // Force a render to show the selection
        renderCanvas();
        return;
      }

      // If no text was handled, deselect all texts
      // Deselect legacy text
      if (textOverlay.isSelected) {
        selectText(false);
      }

      // Deselect all texts in the array
      if (textOverlays.some((t) => t.isSelected)) {
        selectTextById(null);
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
      textOverlays,
      calculateTextRect,
      selectText,
      deleteText,
      selectTextById,
      deleteTextById,
      renderCanvas,
    ]
  );

  // Update handleMouseMove to restore text dragging functionality
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      // Throttle mouse move rendering to maximum 30fps (33ms)
      const now = Date.now();
      const throttleMs = 33;
      const shouldThrottle = now - lastRenderTimeRef.current < throttleMs;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const currentMouseX = (e.clientX - rect.left) * scaleX;
      const currentMouseY = (e.clientY - rect.top) * scaleY;

      // Always update mouse position for tracking
      setMouseX(currentMouseX);
      setMouseY(currentMouseY);

      // For operations that need continuous updates like dragging, don't throttle
      const needsContinuousUpdate =
        isDragging ||
        isResizing ||
        isDraggingText ||
        isResizingCorner ||
        isResizingText;

      if (shouldThrottle && !needsContinuousUpdate) {
        return; // Skip this update if we should throttle
      }

      lastRenderTimeRef.current = now;

      // Get image boundaries for constraint
      const imageBounds = calculateImageBounds();

      // Update cursor based on what's under it
      canvas.style.cursor = "default";

      // Check for hover over text delete buttons first (highest priority)
      let textDeleteButtonHovered = false;

      // First check all text overlays in the array
      for (let i = textOverlays.length - 1; i >= 0; i--) {
        const text = textOverlays[i];
        if (!text.isVisible || !text.text || !text.isSelected) continue;

        const textRect = calculateTextRect(canvas, text);
        if (!textRect) continue;

        // Check delete button at top right
        const deleteButtonX = textRect.x + textRect.width;
        const deleteButtonY = textRect.y;
        const deleteButtonRadius = 10;

        const distToDeleteButton = Math.sqrt(
          Math.pow(currentMouseX - deleteButtonX, 2) +
            Math.pow(currentMouseY - deleteButtonY, 2)
        );

        if (distToDeleteButton <= deleteButtonRadius) {
          canvas.style.cursor = "pointer";
          textDeleteButtonHovered = true;
          break;
        }
      }

      // Check legacy text overlay if no array text delete button was hovered
      if (
        !textDeleteButtonHovered &&
        textOverlay.isVisible &&
        textOverlay.text &&
        textOverlay.isSelected
      ) {
        const textRect = calculateTextRect(canvas, textOverlay);
        if (textRect) {
          const deleteButtonX = textRect.x + textRect.width;
          const deleteButtonY = textRect.y;
          const deleteButtonRadius = 10;

          const distToDeleteButton = Math.sqrt(
            Math.pow(currentMouseX - deleteButtonX, 2) +
              Math.pow(currentMouseY - deleteButtonY, 2)
          );

          if (distToDeleteButton <= deleteButtonRadius) {
            canvas.style.cursor = "pointer";
            textDeleteButtonHovered = true;
          }
        }
      }

      // If a text delete button is hovered, don't process other hover events
      if (textDeleteButtonHovered) {
        return;
      }

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

      // Check for hover over text resize handles
      if (!hoveredLogo) {
        // Create a combined array of all text overlays (including legacy one)
        const allTextOverlays = [...textOverlays];
        if (textOverlay.isVisible && textOverlay.text) {
          allTextOverlays.push(textOverlay);
        }

        for (let i = allTextOverlays.length - 1; i >= 0; i--) {
          const text = allTextOverlays[i];
          if (!text.isVisible || !text.text || !text.isSelected) continue;

          const textRect = calculateTextRect(canvas, text);
          if (!textRect) continue;

          // Check for resize handles
          const handleSize = 8;
          const handles = [
            {
              x: textRect.x,
              y: textRect.y,
              cursor: "nwse-resize",
              direction: "topLeft",
            }, // Top-left
            {
              x: textRect.x + textRect.width / 2,
              y: textRect.y,
              cursor: "ns-resize",
              direction: "top",
            }, // Top-center
            {
              x: textRect.x + textRect.width,
              y: textRect.y + 20, // Move resize handle down to avoid conflict with delete button
              cursor: "nesw-resize",
              direction: "topRight",
            }, // Top-right (moved down)
            {
              x: textRect.x,
              y: textRect.y + textRect.height / 2,
              cursor: "ew-resize",
              direction: "left",
            }, // Middle-left
            {
              x: textRect.x + textRect.width,
              y: textRect.y + textRect.height / 2,
              cursor: "ew-resize",
              direction: "right",
            }, // Middle-right
            {
              x: textRect.x,
              y: textRect.y + textRect.height,
              cursor: "nesw-resize",
              direction: "bottomLeft",
            }, // Bottom-left
            {
              x: textRect.x + textRect.width / 2,
              y: textRect.y + textRect.height,
              cursor: "ns-resize",
              direction: "bottom",
            }, // Bottom-center
            {
              x: textRect.x + textRect.width,
              y: textRect.y + textRect.height,
              cursor: "nwse-resize",
              direction: "bottomRight",
            }, // Bottom-right
          ];

          // Check for hover over any resize handle
          for (const handle of handles) {
            if (
              currentMouseX >= handle.x - handleSize &&
              currentMouseX <= handle.x + handleSize &&
              currentMouseY >= handle.y - handleSize &&
              currentMouseY <= handle.y + handleSize
            ) {
              canvas.style.cursor = handle.cursor;
              break;
            }
          }

          // Check for hover over text
          if (
            currentMouseX >= textRect.x &&
            currentMouseX <= textRect.x + textRect.width &&
            currentMouseY >= textRect.y &&
            currentMouseY <= textRect.y + textRect.height &&
            canvas.style.cursor === "default" // Only update if not already hovering over a handle
          ) {
            canvas.style.cursor = "move";
          }
        }
      }

      setHoveredLogoId(hoveredLogo);

      // Handle dragging logo with constraints
      if (isDragging && draggedLogoId) {
        const logo = logos.find((l) => l.id === draggedLogoId);
        if (!logo) return;

        const logoImg = logoImages.get(draggedLogoId);
        if (!logoImg) return;

        // Calculate new position as percentage
        let newX = ((currentMouseX - dragOffset.x) / canvas.width) * 100;
        let newY = ((currentMouseY - dragOffset.y) / canvas.height) * 100;

        // Calculate logo dimensions
        const logoWidth = (canvas.width * logo.size) / 100;
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width;

        // Convert to percentage
        const logoWidthPercent = (logoWidth / canvas.width) * 100;
        const logoHeightPercent = (logoHeight / canvas.height) * 100;

        // Calculate logo half-dimensions for centering
        const halfWidthPercent = logoWidthPercent / 2;
        const halfHeightPercent = logoHeightPercent / 2;

        // Apply constraints to keep the logo inside the image boundaries
        newX = Math.max(
          imageBounds.left + halfWidthPercent,
          Math.min(imageBounds.right - halfWidthPercent, newX)
        );
        newY = Math.max(
          imageBounds.top + halfHeightPercent,
          Math.min(imageBounds.bottom - halfHeightPercent, newY)
        );

        // Update logo position
        updateLogo(draggedLogoId, {
          position: {
            x: newX,
            y: newY,
          },
        });
      }

      // Handle dragging text with constraints
      if (isDraggingText) {
        // Ensure canvas dimensions are valid
        if (canvas.width > 0 && canvas.height > 0) {
          // Calculate new position as percentage (accounting for offset)
          let newX = ((currentMouseX - textDragOffset.x) / canvas.width) * 100;
          let newY = ((currentMouseY - textDragOffset.y) / canvas.height) * 100;

          // Determine which text is being dragged
          let currentText;
          if (draggedTextId === null) {
            // Legacy text is being dragged
            currentText = textOverlay;
          } else {
            // Find the text in the array
            currentText = textOverlays.find((t) => t.id === draggedTextId);
          }

          if (currentText) {
            // Get text rectangle to calculate its dimensions
            const textRect = calculateTextRect(canvas, currentText);
            if (textRect) {
              // Convert text rectangle dimensions to percentages
              const textWidthPercent = (textRect.width / canvas.width) * 100;
              const textHeightPercent = (textRect.height / canvas.height) * 100;

              // Calculate half dimensions
              const halfWidthPercent = textWidthPercent / 2;
              const halfHeightPercent = textHeightPercent / 2;

              // Apply constraints to keep text inside image boundaries
              newX = Math.max(
                imageBounds.left + halfWidthPercent,
                Math.min(imageBounds.right - halfWidthPercent, newX)
              );
              newY = Math.max(
                imageBounds.top + halfHeightPercent,
                Math.min(imageBounds.bottom - halfHeightPercent, newY)
              );
            }

            // Update text position
            if (draggedTextId === null) {
              // Update legacy text
              setTextPosition({
                x: newX,
                y: newY,
              });

              // Also update the text overlay directly
              setTextOverlay({
                ...textOverlay,
                position: { x: newX, y: newY },
              });
            } else {
              // Update text in array
              updateText(draggedTextId, {
                position: { x: newX, y: newY },
              });
            }
          }
        }
      }

      // Handle logo resizing
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

      // Handle text resizing
      if (isResizingText) {
        const movementX = currentMouseX - textResizeStartPoint.x;
        const movementY = currentMouseY - textResizeStartPoint.y;

        // Determine which text is being resized
        let textToResize = null;
        if (resizingTextId === null) {
          // Legacy text
          textToResize = textOverlay;
        } else {
          // Text from array
          textToResize = textOverlays.find((t) => t.id === resizingTextId);
        }

        if (!textToResize) return;

        // Calculate scale factor based on movement and resize direction
        let scaleFactor = 1;

        // Different scaling behavior based on direction
        switch (resizeDirection) {
          case "bottomRight":
          case "topLeft":
            // Diagonal movement (use the larger of x and y movement)
            scaleFactor =
              1 + Math.max(Math.abs(movementX), Math.abs(movementY)) / 100;
            if (
              (resizeDirection === "topLeft" && movementX > 0) ||
              (resizeDirection === "bottomRight" && movementX < 0)
            ) {
              scaleFactor = 1 / scaleFactor;
            }
            break;

          case "right":
          case "left":
            // Horizontal movement
            scaleFactor = 1 + Math.abs(movementX) / 100;
            if (
              (resizeDirection === "left" && movementX > 0) ||
              (resizeDirection === "right" && movementX < 0)
            ) {
              scaleFactor = 1 / scaleFactor;
            }
            break;

          case "top":
          case "bottom":
            // Vertical movement
            scaleFactor = 1 + Math.abs(movementY) / 100;
            if (
              (resizeDirection === "top" && movementY > 0) ||
              (resizeDirection === "bottom" && movementY < 0)
            ) {
              scaleFactor = 1 / scaleFactor;
            }
            break;

          default:
            // For other directions, use a combination
            scaleFactor = 1 + (Math.abs(movementX) + Math.abs(movementY)) / 200;
            if (movementX < 0 || movementY < 0) {
              scaleFactor = 1 / scaleFactor;
            }
        }

        // Calculate new font size with constraints
        const newFontSize = Math.max(
          8,
          Math.min(120, Math.round(initialFontSize * scaleFactor))
        );

        // Apply the new font size
        if (resizingTextId === null) {
          // Update legacy text
          setTextOverlay({
            ...textOverlay,
            fontSize: newFontSize,
          });
        } else {
          // Update text from array
          updateText(resizingTextId, {
            fontSize: newFontSize,
          });
        }
      }

      // Handle corner resizing for logos
      if (isResizingCorner && resizeCorner) {
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
        }
      }
    },
    [
      canvasRef,
      logos,
      logoImages,
      calculateLogoRects,
      isDragging,
      isResizing,
      draggedLogoId,
      dragOffset,
      initialMouseDistance,
      initialSize,
      updateLogo,
      textOverlay,
      textOverlays,
      calculateTextRect,
      isDraggingText,
      isResizingText,
      resizingTextId,
      textResizeStartPoint,
      initialFontSize,
      resizeDirection,
      updateText,
      textDragOffset,
      textPosition,
      renderCanvas,
      isResizingCorner,
      resizeCorner,
      calculateImageBounds,
      setTextOverlay,
    ]
  );

  // Update the handleMouseUp function to reset text resizing state
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

    if (isResizingText) {
      console.log("Stopped resizing text");
      setIsResizingText(false);
      setResizingTextId(null);
      setResizeDirection(null);
    }
  }, [
    isDragging,
    isResizing,
    isDraggingText,
    isResizingCorner,
    isResizingText,
  ]);

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
      // Skip keyboard handling if we're editing text in an input field
      if ((window as any).isEditingText) {
        return;
      }

      const selectedLogo = logos.find((logo) => logo.isSelected);
      if (!selectedLogo) return;

      const STEP = 1; // 1% movement step
      const imageBounds = calculateImageBounds();

      // Get logo dimensions
      const logoImg = logoImages.get(selectedLogo.id);
      if (!logoImg || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const logoWidth = (canvas.width * selectedLogo.size) / 100;
      const logoHeight = (logoImg.height * logoWidth) / logoImg.width;

      // Convert to percentage
      const logoWidthPercent = (logoWidth / canvas.width) * 100;
      const logoHeightPercent = (logoHeight / canvas.height) * 100;

      // Half dimensions for centering
      const halfWidthPercent = logoWidthPercent / 2;
      const halfHeightPercent = logoHeightPercent / 2;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteLogo(selectedLogo.id);
          break;
        case "ArrowUp":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.max(
                imageBounds.top + halfHeightPercent,
                selectedLogo.position.y - STEP
              ),
            },
          });
          e.preventDefault();
          break;
        case "ArrowDown":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.min(
                imageBounds.bottom - halfHeightPercent,
                selectedLogo.position.y + STEP
              ),
            },
          });
          e.preventDefault();
          break;
        case "ArrowLeft":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.max(
                imageBounds.left + halfWidthPercent,
                selectedLogo.position.x - STEP
              ),
            },
          });
          e.preventDefault();
          break;
        case "ArrowRight":
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.min(
                imageBounds.right - halfWidthPercent,
                selectedLogo.position.x + STEP
              ),
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
  }, [
    logos,
    logoImages,
    updateLogo,
    deleteLogo,
    calculateImageBounds,
    canvasRef,
  ]);

  // Add keyboard shortcuts for text positioning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip keyboard handling if we're editing text in an input field
      if ((window as any).isEditingText) {
        return;
      }

      // Find selected text (either legacy or from array)
      const selectedLegacyText = textOverlay.isSelected ? textOverlay : null;
      const selectedArrayText = textOverlays.find((t) => t.isSelected);

      const selectedText = selectedArrayText || selectedLegacyText;

      if (selectedText && canvasRef.current) {
        const STEP = 1; // 1% movement step
        const imageBounds = calculateImageBounds();

        // Get text rect to calculate constraints
        const canvas = canvasRef.current;
        const textRect = calculateTextRect(canvas, selectedText);
        if (!textRect) return;

        // Convert text rectangle dimensions to percentages
        const textWidthPercent = (textRect.width / canvas.width) * 100;
        const textHeightPercent = (textRect.height / canvas.height) * 100;

        // Half dimensions for centering
        const halfWidthPercent = textWidthPercent / 2;
        const halfHeightPercent = textHeightPercent / 2;

        const isLegacyText = selectedText === textOverlay;

        // Update position based on key pressed
        switch (e.key) {
          case "ArrowUp":
            const newYUp = Math.max(
              imageBounds.top + halfHeightPercent,
              selectedText.position.y - STEP
            );

            if (isLegacyText) {
              setTextPosition((prev) => ({ ...prev, y: newYUp }));
            } else {
              updateText(selectedText.id, {
                position: { ...selectedText.position, y: newYUp },
              });
            }
            e.preventDefault();
            break;

          case "ArrowDown":
            const newYDown = Math.min(
              imageBounds.bottom - halfHeightPercent,
              selectedText.position.y + STEP
            );

            if (isLegacyText) {
              setTextPosition((prev) => ({ ...prev, y: newYDown }));
            } else {
              updateText(selectedText.id, {
                position: { ...selectedText.position, y: newYDown },
              });
            }
            e.preventDefault();
            break;

          case "ArrowLeft":
            const newXLeft = Math.max(
              imageBounds.left + halfWidthPercent,
              selectedText.position.x - STEP
            );

            if (isLegacyText) {
              setTextPosition((prev) => ({ ...prev, x: newXLeft }));
            } else {
              updateText(selectedText.id, {
                position: { ...selectedText.position, x: newXLeft },
              });
            }
            e.preventDefault();
            break;

          case "ArrowRight":
            const newXRight = Math.min(
              imageBounds.right - halfWidthPercent,
              selectedText.position.x + STEP
            );

            if (isLegacyText) {
              setTextPosition((prev) => ({ ...prev, x: newXRight }));
            } else {
              updateText(selectedText.id, {
                position: { ...selectedText.position, x: newXRight },
              });
            }
            e.preventDefault();
            break;

          case "Delete":
            if (isLegacyText) {
              deleteText();
            } else {
              deleteTextById(selectedText.id);
            }
            break;
          case "Backspace":
            // Don't delete text on backspace, only on Delete key
            break;
          case "Escape":
            if (isLegacyText) {
              selectText(false);
            } else {
              selectTextById(null);
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    textOverlay,
    textOverlays,
    selectText,
    selectTextById,
    deleteText,
    deleteTextById,
    updateText,
    calculateImageBounds,
    canvasRef,
    calculateTextRect,
  ]);

  // Create context value with memoized captureCanvas function

  // Delete main image handler
  const handleDeleteMainImage = () => {
    if (
      confirm("Are you sure you want to remove this image from the canvas?")
    ) {
      clearMainImage();
      // Also clear the current design selection
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

  // When setting text, ensure we set it to center initially and within image bounds
  useEffect(() => {
    // Reset text position to center when text becomes visible but wasn't before
    if (
      textOverlay.isVisible &&
      textOverlay.text &&
      !prevTextVisibleRef.current &&
      canvasRef.current
    ) {
      const imageBounds = calculateImageBounds();

      // Calculate the center within image bounds
      const centerX = (imageBounds.left + imageBounds.right) / 2;
      const centerY = (imageBounds.top + imageBounds.bottom) / 2;

      setTextPosition({ x: centerX, y: centerY });
    }
    prevTextVisibleRef.current =
      textOverlay.isVisible && Boolean(textOverlay.text);
  }, [
    textOverlay.isVisible,
    textOverlay.text,
    calculateImageBounds,
    canvasRef,
  ]);

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

  // Add resize observer in a separate effect
  useEffect(() => {
    // Register a single resize observer to handle window resize events
    const resizeObserver = new ResizeObserver(() => {
      shouldRenderRef.current = true;
      renderCanvas();
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, renderCanvas]);

  return (
    <div className="relative mx-auto py-8" style={{ marginRight: "384px" }}>
      <div
        className="fixed bg-white dark:bg-neutral-900 rounded-lg shadow-md z-10"
        style={{
          left: "calc(50% - 192px)",
          top: "43%",
          transform: "translate(-50%, -50%)",
          height: "auto",
          width: `${canvasWidth}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          margin: "20px auto",
        }}
      >
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">
          Canvas
          {activeFilter ? (
            <span className="ml-2 text-sm font-normal text-blue-500 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
              Filter: {activeFilter.name}
            </span>
          ) : (
            <span className="ml-2 text-xs font-normal text-gray-500">
              No filter applied
            </span>
          )}
        </h2>

        {imageUrl && (
          <button
            className="absolute top-3 right-3 p-1 rounded-full bg-red-500 text-white opacity-50 hover:opacity-100 z-10"
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
        {!mainImage &&
          logos.length === 0 &&
          !textOverlay.isVisible &&
          textOverlays.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              Select an image or add text to display
            </div>
          )}

        {/* Controls overlay */}
        <div className="flex gap-2 justify-end mt-4">
          {logos.length > 0 && (
            <button
              onClick={() => selectLogo(null)}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
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
              Tip: Use arrow keys to move logo, +/- to resize, Delete to remove
            </p>
          </div>
        )}
        {textOverlay.isVisible && textOverlay.text && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Tip: Click and drag to position text</p>
          </div>
        )}
      </div>

      {/* Dynamic spacer that adjusts based on the aspect ratio */}
      <div
        style={{
          height: `${
            canvasWidth /
              (designStoreAspectRatio.split(":").map(Number)[0] /
                designStoreAspectRatio.split(":").map(Number)[1]) +
            150 // Add extra space for controls and headers
          }px`,
          width: `${canvasWidth}px`,
          margin: "0 auto",
        }}
      />
    </div>
  );
});

export default ImageRender;
