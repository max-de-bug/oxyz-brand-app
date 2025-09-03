"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useImageStore } from "@/app/store/imageStore";
import { TextOverlay, useDesignStore } from "@/app/store/designStore";
import { useFilterStore } from "@/app/store/filterStore";

import { CanvasControls } from "./CanvasControls";
import { calculateTextRect } from "./CanvasUtils";
import { useMainImageInteractions } from "./hooks/useMainImageInteractions";
import { useLogoInteractions } from "./hooks/useLogoInteractions";
import { useTextInteractions } from "./hooks/useTextInteractions";
import { useCanvasRendering } from "./hooks/useCanvasRendering";

// Add memo wrapper to prevent unnecessary re-renders from parent
const ModularCanvas = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Add a ref to track if we should render the canvas
  // Add a ref to track the last render timestamp
  const lastRenderTimeRef = useRef(0);

  const [mainImage, setMainImage] = useState<HTMLImageElement | null>(null);
  const [logoImages, setLogoImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [canvasWidth, setCanvasWidth] = useState(800);
  // Removed unused scroll position state

  // Add state for tracking mouse position
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Add state variables for viewport dimensions
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  // Add a helper function to display a temporary status message when resizing
  const [resizeStatus, setResizeStatus] = useState<string | null>(null);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Memoize the showResizeStatus function to prevent it from causing re-renders
  const showResizeStatus = useCallback(
    (message: string) => {
      // Clear any existing timeout
      if (statusTimeout) {
        clearTimeout(statusTimeout);
      }

      // Show the message
      setResizeStatus(message);

      // Set a timeout to clear the message
      const timeout = setTimeout(() => {
        setResizeStatus(null);
      }, 1500);

      setStatusTimeout(timeout);
    },
    [statusTimeout]
  );

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (statusTimeout) {
        clearTimeout(statusTimeout);
      }
    };
  }, [statusTimeout]);

  // Get values from the store
  const {
    images,
    logos,
    brightness,
    contrast,
    saturation,
    sepia,
    selectLogo,
    updateLogo,
    removeLogo,
    addImage,
    removeImage,
    updateImage,
    selectImage,
    reorderImage,
    opacity,
    blur,
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
    aspectRatio: designStoreAspectRatio,
    devMode,
    toggleDevMode,
  } = useDesignStore();

  // Get active filter from filter store
  const { activeFilter } = useFilterStore();

  // Use our custom hooks - Order matters here to avoid using variables before declaration

  // Create a stable render function reference that won't change between renders
  const renderCanvasRef = useRef<() => void>(() => {});

  // Create a stable function that uses the ref to always call the latest version
  const stableRenderCanvas = useCallback(() => {
    renderCanvasRef.current();
  }, []);

  // First, get the main image interactions
  const {
    mainImagePosition,
    mainImageScale,
    isDraggingMainImage,
    isResizingMainImage,
    resetMainImage,
    handleMainImageMouseDown,
    handleMainImageMouseMove,
    handleMainImageMouseUp,
  } = useMainImageInteractions({
    canvasRef,
    mainImage,
    devMode,
    showResizeStatus,
    renderCanvas: stableRenderCanvas,
  });

  // Second, get the text interactions
  const {
    isDraggingText,
    draggedTextId,
    textDragOffset,
    isResizingText,
    resizingTextId,
    textResizeStartPoint,
    initialFontSize,
    resizeDirection,
    textPosition,
    handleTextMouseDown,
    handleTextMouseMove,
    handleTextMouseUp,
  } = useTextInteractions({
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
  });

  // State for tracking loaded images
  const [loadedImages, setLoadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());

  // Effect to load images
  useEffect(() => {
    if (images.length === 0) {
      setLoadedImages(new Map());
      return;
    }

    // Track which images need to be loaded
    const imagesToLoad = images.filter((img) => !loadedImages.has(img.id));

    // If no new images to load, skip the rest
    if (imagesToLoad.length === 0) return;

    // Load each new image
    imagesToLoad.forEach((img) => {
      const image = new Image();

      image.onload = () => {
        console.log(`Image loaded: ${img.id}`);
        setLoadedImages((prev) => {
          const updated = new Map(prev);
          updated.set(img.id, image);
          return updated;
        });
      };

      image.onerror = (err) => {
        console.error(`Error loading image ${img.id}:`, err);
      };

      // For Cloudinary URLs, add cache-busting parameter
      let imageSrc = img.url;
      if (img.url.includes("cloudinary.com")) {
        imageSrc = `${img.url}${
          img.url.includes("?") ? "&" : "?"
        }t=${Date.now()}`;
      }

      image.src = imageSrc;
    });

    // Clean up any removed images
    const currentImageIds = new Set(images.map((img) => img.id));
    setLoadedImages((prev) => {
      const updated = new Map(prev);
      Array.from(updated.keys()).forEach((id) => {
        if (!currentImageIds.has(id)) {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, [images]);

  // Memoize canvas rendering configuration
  const canvasRenderingConfig = useMemo(
    () => ({
      canvasRef,
      mainImage: loadedImages.get(images[0]?.id) || null,
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
      canvasWidth,
    }),
    [
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
      canvasWidth,
    ]
  );

  // Update canvas rendering to handle multiple images
  const { renderCanvas, calculateLogoRectsForCanvas, calculateImageBounds } =
    useCanvasRendering(canvasRenderingConfig);

  // Memoize logo interactions configuration
  const logoInteractionsConfig = useMemo(
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

  // Third, get the logo interactions
  const {
    isDragging,
    isResizing,
    isResizingCorner,
    draggedLogoId,
    resizeCorner,
    hoveredLogoId,
    setResizeCorner,
    handleLogoMouseDown,
    handleLogoMouseMove,
    handleLogoMouseUp,
  } = useLogoInteractions(logoInteractionsConfig);

  ///FIX LOgo rect

  // Removed redundant effect that only called renderCanvas when it changed

  // Update the ref whenever renderCanvas changes
  useEffect(() => {
    // Update the reference to the current renderCanvas function
    renderCanvasRef.current = renderCanvas;
  }, [renderCanvas]);

  // Effect to apply selected filter from filter store when it changes
  useEffect(() => {
    if (!activeFilter?.filter) return;

    console.log("Applying filter from filter store:", activeFilter);

    // Extract filter values with proper defaults and validation
    const {
      brightness = 100,
      contrast = 100,
      saturation = 100,
      sepia = 0,
      opacity = 100,
      blur = 0,
    } = activeFilter.filter;

    // Validate filter values are within reasonable bounds
    const validatedFilter = {
      brightness: Math.max(0, Math.min(200, brightness)),
      contrast: Math.max(0, Math.min(200, contrast)),
      saturation: Math.max(0, Math.min(200, saturation)),
      sepia: Math.max(0, Math.min(100, sepia)),
      opacity: Math.max(0, Math.min(100, opacity)),
      blur: Math.max(0, Math.min(20, blur)),
    };

    // Apply filter with a small delay to prevent rapid state updates
    const timeoutId = setTimeout(() => {
      useImageStore.setState(validatedFilter);
    }, 16); // One frame delay

    // Cleanup function to cancel pending updates
    return () => {
      clearTimeout(timeoutId);
    };
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
    }
  }, [mainImage]);

  // Function to handle window resize
  const handleResize = useCallback(() => {
    if (typeof window === "undefined") return;

    setViewportWidth(window.innerWidth);
    setViewportHeight(window.innerHeight);

    // Update canvas width based on viewport size
    let newWidth;
    if (window.innerWidth >= 1280) {
      // xl breakpoint
      newWidth = Math.min(1200, window.innerWidth * 0.6);
    } else if (window.innerWidth >= 1024) {
      // lg breakpoint
      newWidth = Math.min(1000, window.innerWidth * 0.65);
    } else if (window.innerWidth >= 768) {
      // md breakpoint
      newWidth = Math.min(800, window.innerWidth * 0.75);
    } else {
      newWidth = Math.min(700, window.innerWidth * 0.85);
    }

    // If we have an image, adjust for aspect ratio
    if (
      mainImage &&
      mainImage.naturalWidth > 0 &&
      mainImage.naturalHeight > 0
    ) {
      const imageAspectRatio = mainImage.naturalWidth / mainImage.naturalHeight;
      const calculatedHeight = newWidth / imageAspectRatio;
      const maxHeight = window.innerHeight * 0.8;

      if (calculatedHeight > maxHeight) {
        newWidth = maxHeight * imageAspectRatio;
      }
    }

    setCanvasWidth(newWidth);
  }, [mainImage]);

  // Memoize the responsive width calculation
  const responsiveWidth = useMemo(() => {
    return viewportWidth < 768 ? "100%" : `${canvasWidth}px`;
  }, [viewportWidth, canvasWidth]);

  // Memoize the responsive padding
  const responsivePadding = useMemo(() => {
    return viewportWidth < 768 ? "12px" : "16px";
  }, [viewportWidth]);

  // Effect to load the main image
  useEffect(() => {
    if (!images.length) {
      setMainImage(null);
      return;
    }

    const img = new Image();

    // Set up event handlers before setting src
    img.onload = () => {
      console.log("Main image loaded:", img.src);
      setMainImage(img);
    };

    img.onerror = (err) => {
      console.error("Error loading main image:", err);
      setMainImage(null);
    };

    // For Cloudinary URLs, add cache-busting parameter
    let imageSrc = images[0].url;
    if (images[0].url.includes("cloudinary.com")) {
      imageSrc = `${images[0].url}${
        images[0].url.includes("?") ? "&" : "?"
      }t=${Date.now()}`;
    }

    img.src = imageSrc;

    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [images]);

  // Effect to load logo images
  useEffect(() => {
    if (logos.length === 0) {
      setLogoImages(new Map());
      return;
    }

    // Track which logos need to be loaded
    const logosToLoad = logos.filter((logo) => !logoImages.has(logo.id));

    // If no new logos to load, skip the rest
    if (logosToLoad.length === 0) return;

    // Load each new logo
    logosToLoad.forEach((logo) => {
      const img = new Image();

      img.onload = () => {
        console.log(`Logo image loaded: ${logo.id}`);
        setLogoImages((prev) => {
          const updated = new Map(prev);
          updated.set(logo.id, img);
          return updated;
        });
      };

      img.onerror = (err) => {
        console.error(`Error loading logo image ${logo.id}:`, err);
      };

      // Set src after setting up event handlers
      img.src = logo.url;
    });

    // Clean up any removed logos
    const currentLogoIds = new Set(logos.map((logo) => logo.id));
    setLogoImages((prev) => {
      const updated = new Map(prev);
      Array.from(updated.keys()).forEach((id) => {
        if (!currentLogoIds.has(id)) {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, [logos]); // Remove logoImages from dependencies

  // Combined mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const nativeEvent = e.nativeEvent;

      // Try handling with main image interactions first
      if (handleMainImageMouseDown(nativeEvent, setResizeCorner)) {
        return;
      }

      // Then try text interactions
      if (handleTextMouseDown(nativeEvent)) {
        return;
      }

      // Finally try logo interactions
      handleLogoMouseDown(nativeEvent);
    },
    [
      handleMainImageMouseDown,
      handleTextMouseDown,
      handleLogoMouseDown,
      setResizeCorner,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const nativeEvent = e.nativeEvent;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentMouseX = nativeEvent.clientX - rect.left;
      const currentMouseY = nativeEvent.clientY - rect.top;

      // Update mouse position state
      setMouseX(currentMouseX);
      setMouseY(currentMouseY);

      // Throttle mouse move rendering to maximum 30fps (33ms)
      const now = Date.now();
      const needsContinuousUpdate =
        isDragging ||
        isResizing ||
        isDraggingText ||
        isResizingCorner ||
        isResizingText ||
        isDraggingMainImage ||
        isResizingMainImage;

      if (now - lastRenderTimeRef.current < 33 && !needsContinuousUpdate) {
        return;
      }
      lastRenderTimeRef.current = now;

      // Calculate image boundaries for constraints
      const imageBounds = calculateImageBounds();

      // Try handling with main image interactions first
      if (handleMainImageMouseMove(nativeEvent, resizeCorner)) {
        return;
      }

      // Then try text interactions
      if (handleTextMouseMove(nativeEvent, imageBounds)) {
        return;
      }

      // Finally try logo interactions
      handleLogoMouseMove(nativeEvent, imageBounds);
    },
    [
      isDragging,
      isResizing,
      isDraggingText,
      isResizingCorner,
      isResizingText,
      isDraggingMainImage,
      isResizingMainImage,
      handleMainImageMouseMove,
      handleTextMouseMove,
      handleLogoMouseMove,
      resizeCorner,
      calculateImageBounds,
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Try handling with main image interactions first
      handleMainImageMouseUp();

      // Then try text interactions
      handleTextMouseUp();

      // Finally try logo interactions
      handleLogoMouseUp();
    },
    [handleMainImageMouseUp, handleTextMouseUp, handleLogoMouseUp]
  );

  // Delete main image handler
  const handleDeleteMainImage = useCallback(() => {
    if (window.confirm("Are you sure you want to remove this image?")) {
      removeImage(images[0].id);
    }
  }, [images, removeImage]);

  // Initialize canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) {
      console.error("Canvas reference is not available during initialization");
      return;
    }

    // Initial render using the stable ref to avoid re-running when renderCanvas changes
    renderCanvasRef.current();

    // Clean up
    return () => {
      // Any cleanup needed
    };
  }, []);

  // Removed scroll listener as scroll position is unused

  // Add window resize listener
  useEffect(() => {
    // Set initial dimensions
    handleResize();

    // Update on resize
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Add keyboard event listeners for logo manipulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Find the selected logo
      const selectedLogo = logos.find((logo) => logo.isSelected);
      if (!selectedLogo) return;

      const step = e.shiftKey ? 10 : 1; // Larger step with shift key

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.max(0, selectedLogo.position.x - step),
            },
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              x: Math.min(100, selectedLogo.position.x + step),
            },
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.max(0, selectedLogo.position.y - step),
            },
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            position: {
              ...selectedLogo.position,
              y: Math.min(100, selectedLogo.position.y + step),
            },
          });
          break;
        case "+":
        case "=":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            size: Math.min(100, selectedLogo.size + step),
          });
          break;
        case "-":
          e.preventDefault();
          updateLogo(selectedLogo.id, {
            size: Math.max(5, selectedLogo.size - step),
          });
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          removeLogo(selectedLogo.id);
          break;
        case "r":
        case "R":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            updateLogo(selectedLogo.id, {
              rotation: (selectedLogo.rotation + 90) % 360,
            });
          }
          break;
      }

      // Re-render canvas after any change
      renderCanvas();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [logos, updateLogo, removeLogo, renderCanvas]);

  // Add keyboard event listeners for text manipulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any text is selected
      const selectedText = textOverlays.find((text) => text.isSelected);
      const isLegacyTextSelected = textOverlay.isSelected;

      if (!selectedText && !isLegacyTextSelected) return;

      const step = e.shiftKey ? 10 : 1; // Larger step with shift key

      if (isLegacyTextSelected) {
        // Handle legacy text
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              position: {
                ...textOverlay.position,
                x: Math.max(0, textOverlay.position.x - step),
              },
            });
            break;
          case "ArrowRight":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              position: {
                ...textOverlay.position,
                x: Math.min(100, textOverlay.position.x + step),
              },
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              position: {
                ...textOverlay.position,
                y: Math.max(0, textOverlay.position.y - step),
              },
            });
            break;
          case "ArrowDown":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              position: {
                ...textOverlay.position,
                y: Math.min(100, textOverlay.position.y + step),
              },
            });
            break;
          case "+":
          case "=":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              fontSize: Math.min(72, textOverlay.fontSize + step),
            });
            break;
          case "-":
            e.preventDefault();
            setTextOverlay({
              ...textOverlay,
              fontSize: Math.max(8, textOverlay.fontSize - step),
            });
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            deleteText();
            break;
          case "r":
          case "R":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              setTextOverlay({
                ...textOverlay,
                rotation: (textOverlay.rotation + 15) % 360,
              });
            }
            break;
        }
      } else if (selectedText) {
        // Handle text from array
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            updateText(selectedText.id, {
              position: {
                ...selectedText.position,
                x: Math.max(0, selectedText.position.x - step),
              },
            });
            break;
          case "ArrowRight":
            e.preventDefault();
            updateText(selectedText.id, {
              position: {
                ...selectedText.position,
                x: Math.min(100, selectedText.position.x + step),
              },
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            updateText(selectedText.id, {
              position: {
                ...selectedText.position,
                y: Math.max(0, selectedText.position.y - step),
              },
            });
            break;
          case "ArrowDown":
            e.preventDefault();
            updateText(selectedText.id, {
              position: {
                ...selectedText.position,
                y: Math.min(100, selectedText.position.y + step),
              },
            });
            break;
          case "+":
          case "=":
            e.preventDefault();
            updateText(selectedText.id, {
              fontSize: Math.min(72, selectedText.fontSize + step),
            });
            break;
          case "-":
            e.preventDefault();
            updateText(selectedText.id, {
              fontSize: Math.max(8, selectedText.fontSize - step),
            });
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            deleteTextById(selectedText.id);
            break;
          case "r":
          case "R":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              updateText(selectedText.id, {
                rotation: (selectedText.rotation + 15) % 360,
              });
            }
            break;
        }
      }

      // Re-render canvas after any change
      renderCanvas();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    textOverlays,
    textOverlay,
    setTextOverlay,
    updateText,
    deleteText,
    deleteTextById,
    renderCanvas,
  ]);

  // Add image upload handler

  // Add image removal handler

  // Add image reordering handler

  return (
    <div className="flex justify-center items-center min-h-screen py-4 px-4 sm:py-8">
      <div
        className="bg-white dark:bg-neutral-900 rounded-lg shadow-md w-full max-w-full sm:max-w-none"
        style={{
          height: "auto",
          width: responsiveWidth,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: responsivePadding,
          margin: "0",
        }}
      >
        <CanvasControls
          activeFilter={activeFilter}
          imageUrl={images[0]?.url}
          logos={logos}
          textOverlay={textOverlay}
          textOverlays={textOverlays}
          devMode={devMode}
          toggleDevMode={toggleDevMode}
          resetMainImage={resetMainImage}
          selectLogo={selectLogo}
          handleDeleteMainImage={handleDeleteMainImage}
          resizeStatus={resizeStatus}
          canvasWidth={canvasWidth}
        />

        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{
              maxWidth: "100%",
              objectFit: "contain",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
});

ModularCanvas.displayName = "ModularCanvas";

export default ModularCanvas;
