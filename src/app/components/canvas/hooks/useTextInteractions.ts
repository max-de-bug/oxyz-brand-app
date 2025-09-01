"use client";

import { useState, useCallback } from "react";
import { TextOverlay } from "@/app/store/designStore";

interface TextInteractionsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  textOverlays: TextOverlay[];
  legacyTextOverlay: TextOverlay;
  setTextOverlay: (updates: Partial<TextOverlay>) => void;
  updateText: (id: string, updates: Partial<Omit<TextOverlay, "id">>) => void;
  selectText: (selected: boolean) => void;
  deleteText: () => void;
  selectTextById: (id: string | null) => void;
  deleteTextById: (id: string) => void;
  calculateTextRect: (
    canvas: HTMLCanvasElement,
    text: TextOverlay
  ) => { x: number; y: number; width: number; height: number } | null;
  renderCanvas: () => void;
}

export const useTextInteractions = ({
  canvasRef,
  textOverlays,
  legacyTextOverlay,
  setTextOverlay,
  updateText,
  selectText,
  deleteText,
  selectTextById,
  deleteTextById,
  calculateTextRect,
  renderCanvas,
}: TextInteractionsProps) => {
  // State for text manipulation
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 });
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizingTextId, setResizingTextId] = useState<string | null>(null);
  const [textResizeStartPoint, setTextResizeStartPoint] = useState({
    x: 0,
    y: 0,
  });
  const [initialFontSize, setInitialFontSize] = useState(0);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });

  // Handle mouse down for text
  const handleTextMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return false;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Create a combined array of all text overlays (including legacy one)
      const allTextOverlays = [...textOverlays];
      if (legacyTextOverlay.isVisible && legacyTextOverlay.text) {
        allTextOverlays.push(legacyTextOverlay);
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
          // First, deselect all texts
          if (legacyTextOverlay.isSelected) {
            selectText(false);
          }
          textOverlays.forEach((text) => {
            if (text.isSelected) {
              selectTextById(null);
            }
          });

          // Then select the clicked text
          if (currentText === legacyTextOverlay) {
            selectText(true);
            setDraggedTextId(null);
          } else {
            selectTextById(currentText.id);
            setDraggedTextId(currentText.id);
          }

          // If the text is already selected, check for delete button or resize handles
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
              if (currentText === legacyTextOverlay) {
                deleteText();
              } else {
                deleteTextById(currentText.id);
              }
              textHandled = true;
              break;
            }

            // Check for edge-based resizing
            const edgeSize = 24;
            const edges = [
              {
                x: textRect.x,
                y: textRect.y - edgeSize / 2,
                width: textRect.width,
                height: edgeSize,
                direction: "top",
              },
              {
                x: textRect.x,
                y: textRect.y + textRect.height - edgeSize / 2,
                width: textRect.width,
                height: edgeSize,
                direction: "bottom",
              },
              {
                x: textRect.x - edgeSize / 2,
                y: textRect.y,
                width: edgeSize,
                height: textRect.height,
                direction: "left",
              },
              {
                x: textRect.x + textRect.width - edgeSize / 2,
                y: textRect.y,
                width: edgeSize,
                height: textRect.height,
                direction: "right",
              },
            ];

            // Check corners
            const cornerSize = 16;
            const corners = [
              {
                x: textRect.x - cornerSize / 2,
                y: textRect.y - cornerSize / 2,
                direction: "topLeft",
              },
              {
                x: textRect.x + textRect.width - cornerSize / 2,
                y: textRect.y - cornerSize / 2,
                direction: "topRight",
              },
              {
                x: textRect.x - cornerSize / 2,
                y: textRect.y + textRect.height - cornerSize / 2,
                direction: "bottomLeft",
              },
              {
                x: textRect.x + textRect.width - cornerSize / 2,
                y: textRect.y + textRect.height - cornerSize / 2,
                direction: "bottomRight",
              },
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
                  currentText === legacyTextOverlay ? null : currentText.id
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
                    currentText === legacyTextOverlay ? null : currentText.id
                  );
                  setInitialFontSize(currentText.fontSize);
                  textHandled = true;
                  break;
                }
              }
            }
          }

          // If we're not deleting or resizing, prepare for dragging
          if (!textHandled) {
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
          }

          textHandled = true;
          break;
        }
      }

      if (textHandled) {
        renderCanvas();
        return true;
      }

      // If no text was handled, deselect all texts
      if (legacyTextOverlay.isSelected) {
        selectText(false);
      }
      if (textOverlays.some((t) => t.isSelected)) {
        selectTextById(null);
      }

      return false;
    },
    [
      canvasRef,
      textOverlays,
      legacyTextOverlay,
      calculateTextRect,
      selectText,
      deleteText,
      selectTextById,
      deleteTextById,
      renderCanvas,
    ]
  );

  // Handle mouse move for text
  const handleTextMouseMove = useCallback(
    (
      e: MouseEvent,
      imageBounds: { left: number; right: number; top: number; bottom: number }
    ) => {
      if (!canvasRef.current) return false;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;

      // Handle dragging text
      if (isDraggingText) {
        // Calculate new position as percentage
        let newX = ((currentMouseX - textDragOffset.x) / canvas.width) * 100;
        let newY = ((currentMouseY - textDragOffset.y) / canvas.height) * 100;

        // Determine which text is being dragged
        let currentText;
        if (draggedTextId === null) {
          currentText = legacyTextOverlay;
        } else {
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
            setTextOverlay({
              ...legacyTextOverlay,
              position: { x: newX, y: newY },
            });
          } else {
            updateText(draggedTextId, {
              position: { x: newX, y: newY },
            });
          }
        }

        renderCanvas();
        return true;
      }

      // Handle text resizing
      if (isResizingText) {
        const movementX = currentMouseX - textResizeStartPoint.x;
        const movementY = currentMouseY - textResizeStartPoint.y;

        // Determine which text is being resized
        let textToResize = null;
        if (resizingTextId === null) {
          textToResize = legacyTextOverlay;
        } else {
          textToResize = textOverlays.find((t) => t.id === resizingTextId);
        }

        if (!textToResize) return false;

        // Calculate scale factor based on movement and resize direction
        let scaleFactor = 1;

        // Different scaling behavior based on direction
        switch (resizeDirection) {
          case "bottomRight":
          case "topLeft":
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
            scaleFactor = 1 + Math.abs(movementY) / 100;
            if (
              (resizeDirection === "top" && movementY > 0) ||
              (resizeDirection === "bottom" && movementY < 0)
            ) {
              scaleFactor = 1 / scaleFactor;
            }
            break;

          default:
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
          setTextOverlay({
            ...legacyTextOverlay,
            fontSize: newFontSize,
          });
        } else {
          updateText(resizingTextId, {
            fontSize: newFontSize,
          });
        }

        renderCanvas();
        return true;
      }

      return false;
    },
    [
      canvasRef,
      isDraggingText,
      draggedTextId,
      textDragOffset,
      legacyTextOverlay,
      textOverlays,
      calculateTextRect,
      setTextOverlay,
      updateText,
      isResizingText,
      resizingTextId,
      textResizeStartPoint,
      resizeDirection,
      initialFontSize,
      renderCanvas,
    ]
  );

  // Handle mouse up for text
  const handleTextMouseUp = useCallback(() => {
    if (isDraggingText) {
      setIsDraggingText(false);
      setDraggedTextId(null);
      renderCanvas();
      return true;
    }

    if (isResizingText) {
      setIsResizingText(false);
      setResizingTextId(null);
      setResizeDirection(null);
      renderCanvas();
      return true;
    }

    return false;
  }, [isDraggingText, isResizingText, renderCanvas]);

  return {
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
  };
};
