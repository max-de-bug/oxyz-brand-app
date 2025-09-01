"use client";

import { TextOverlay } from "@/app/store/designStore";

interface TextRendererProps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  textOverlays: TextOverlay[];
  legacyTextOverlay: TextOverlay;
  isDraggingText: boolean;
  draggedTextId: string | null;
  isResizingText: boolean;
  resizingTextId: string | null;
  mouseX: number;
  mouseY: number;
  calculateTextRect: (
    canvas: HTMLCanvasElement,
    text: TextOverlay
  ) => { x: number; y: number; width: number; height: number } | null;
}

// Convert from React component to regular function
export const TextRenderer = ({
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
  calculateTextRect,
}: TextRendererProps) => {
  // Convert from useCallback to regular function
  const drawTextOverlay = (text: TextOverlay) => {
      if (!text.isVisible || !text.text) return;

      // Save current context state
      ctx.save();

      // Calculate text position, applying translationX and translationY offsets
      const textX =
        (canvas.width * text.position.x) / 100 + (text.translationX || 0);
      const textY =
        (canvas.height * text.position.y) / 100 + (text.translationY || 0);

      // Translate to text position
      ctx.translate(textX, textY);

      // Apply rotation if any
      if (text.rotation) {
        ctx.rotate((text.rotation * Math.PI) / 180);
      }

      // Set text properties
      ctx.fillStyle = text.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Set font with appropriate styles
      let fontStyle = "";
      if (text.isBold) fontStyle += "bold ";
      if (text.isItalic) fontStyle += "italic ";
      ctx.font = `${fontStyle}${text.fontSize}px ${text.fontFamily}`;

      // Apply letter spacing if specified
      let letterSpacing = text.spacing || 0;

      // Split text into lines
      const lines = text.text.split("\n");

      // Calculate line height based on font size
      const lineHeight = text.fontSize * 1.2;

      // Draw each line with letter spacing
      lines.forEach((line, lineIndex) => {
        if (letterSpacing === 0) {
          // If no letter spacing, draw the whole line at once
          ctx.fillText(
            line,
            0,
            lineIndex * lineHeight - ((lines.length - 1) * lineHeight) / 2
          );
        } else {
          // If letter spacing is specified, draw each character separately
          let xOffset = 0;
          const chars = line.split("");

          // Calculate total width to center the text
          const totalWidth = chars.reduce((width, char) => {
            const charWidth = ctx.measureText(char).width;
            return width + charWidth + letterSpacing;
          }, 0);

          // Start position (centered)
          xOffset = -totalWidth / 2;

          // Draw each character
          chars.forEach((char) => {
            const charWidth = ctx.measureText(char).width;
            ctx.fillText(
              char,
              xOffset + charWidth / 2,
              lineIndex * lineHeight - ((lines.length - 1) * lineHeight) / 2
            );
            xOffset += charWidth + letterSpacing;
          });
        }
      });

      // Draw selection UI if text is selected or being manipulated
      const textRect = calculateTextRect(canvas, text);
      if (textRect) {
        const isDraggingThisText =
          isDraggingText &&
          (text.id === draggedTextId ||
            (draggedTextId === null && text === legacyTextOverlay));
        const isResizingThisText =
          isResizingText &&
          (text.id === resizingTextId ||
            (resizingTextId === null && text === legacyTextOverlay));

        if (isDraggingThisText || text.isSelected || isResizingThisText) {
          // Save the current context state
          ctx.restore();
          ctx.save();

          // Translate to the text position for rotation
          ctx.translate(textX, textY);
          ctx.rotate(text.rotation ? (text.rotation * Math.PI) / 180 : 0);

          // Draw selection rectangle
          ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue color
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -textRect.width / 2,
            -textRect.height / 2,
            textRect.width,
            textRect.height
          );

          // Draw resize handles
          ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
          const handleSize = 8;

          // Draw corner handles
          const corners = [
            { x: -textRect.width / 2, y: -textRect.height / 2 }, // Top-left
            { x: textRect.width / 2, y: -textRect.height / 2 }, // Top-right
            { x: -textRect.width / 2, y: textRect.height / 2 }, // Bottom-left
            { x: textRect.width / 2, y: textRect.height / 2 }, // Bottom-right
          ];

          corners.forEach((corner) => {
            ctx.fillRect(
              corner.x - handleSize / 2,
              corner.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });

          // Draw edge handles
          const edges = [
            { x: 0, y: -textRect.height / 2 }, // Top-center
            { x: 0, y: textRect.height / 2 }, // Bottom-center
            { x: -textRect.width / 2, y: 0 }, // Middle-left
            { x: textRect.width / 2, y: 0 }, // Middle-right
          ];

          edges.forEach((edge) => {
            ctx.fillRect(
              edge.x - handleSize / 2,
              edge.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });

          // Draw delete button at top right
          ctx.fillStyle = "#ef4444"; // Red color
          ctx.beginPath();
          ctx.arc(textRect.width / 2, -textRect.height / 2, 10, 0, Math.PI * 2);
          ctx.fill();

          // Draw X in delete button
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(textRect.width / 2 - 5, -textRect.height / 2 - 5);
          ctx.lineTo(textRect.width / 2 + 5, -textRect.height / 2 + 5);
          ctx.moveTo(textRect.width / 2 + 5, -textRect.height / 2 - 5);
          ctx.lineTo(textRect.width / 2 - 5, -textRect.height / 2 + 5);
          ctx.stroke();

          // Check if mouse is over a handle and update cursor
          if (mouseX !== undefined && mouseY !== undefined) {
            // Transform mouse coordinates to account for rotation
            const dx = mouseX - textX;
            const dy = mouseY - textY;
            const angle = text.rotation ? (text.rotation * Math.PI) / 180 : 0;
            const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
            const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

            // Check if mouse is over delete button
            const deleteButtonX = textRect.width / 2;
            const deleteButtonY = -textRect.height / 2;
            const deleteButtonRadius = 10;
            const distToDeleteButton = Math.sqrt(
              Math.pow(rotatedX - deleteButtonX, 2) +
                Math.pow(rotatedY - deleteButtonY, 2)
            );

            if (distToDeleteButton <= deleteButtonRadius) {
              canvas.style.cursor = "pointer";
            }
          }
        }
      }

      // Restore context
      ctx.restore();
    };

  // Function to render all text overlays
  const renderTexts = () => {
    // Draw all text overlays from the array
    textOverlays.forEach((text) => {
      if (text.isVisible && text.text) {
        drawTextOverlay(text);
      }
    });

    // Draw legacy text overlay if it exists
    if (legacyTextOverlay.isVisible && legacyTextOverlay.text) {
      drawTextOverlay(legacyTextOverlay);
    }
  };

  // Execute the rendering
  renderTexts();

  // This function doesn't return anything as it directly manipulates the canvas
  return;
};
