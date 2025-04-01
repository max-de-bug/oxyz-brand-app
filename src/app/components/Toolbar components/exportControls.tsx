"use client";

import { useState } from "react";
import { useImageStore } from "@/app/store/imageStore";
import { Download, Copy, AlertCircle } from "lucide-react";

export const captureVisibleCanvas = async (): Promise<string | null> => {
  try {
    console.log("Capturing visible canvas");

    // Find the canvas element
    const canvasElement = document.querySelector("canvas");
    if (!canvasElement) {
      console.error("Canvas element not found");
      return null;
    }

    // Create a new canvas with the same dimensions as the visible canvas
    const exportCanvas = document.createElement("canvas");
    const visibleWidth = canvasElement.clientWidth;
    const visibleHeight = canvasElement.clientHeight;

    // Set dimensions to match the visible canvas
    exportCanvas.width = visibleWidth;
    exportCanvas.height = visibleHeight;

    // Get context
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get export canvas context");
      return null;
    }

    // Fill with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, visibleWidth, visibleHeight);

    // Draw the visible canvas onto our export canvas
    ctx.drawImage(canvasElement, 0, 0, visibleWidth, visibleHeight);

    // Try to get data URL
    try {
      const dataUrl = exportCanvas.toDataURL("image/png");
      if (dataUrl && dataUrl.startsWith("data:")) {
        console.log("Successfully captured visible canvas");
        return dataUrl;
      }
    } catch (dataUrlError) {
      console.error(
        "Error getting data URL from visible canvas:",
        dataUrlError
      );
    }

    // If toDataURL fails, try blob approach
    return new Promise((resolve) => {
      try {
        exportCanvas.toBlob((blob) => {
          if (!blob) {
            console.error("Blob capture failed");
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log("Successfully read blob as data URL");
            resolve(result);
          };
          reader.onerror = () => {
            console.error("FileReader error");
            resolve(null);
          };
          reader.readAsDataURL(blob);
        }, "image/png");
      } catch (blobError) {
        console.error("Blob approach failed:", blobError);
        resolve(null);
      }
    });
  } catch (error) {
    console.error("Error in captureVisibleCanvas:", error);
    return null;
  }
};

const ExportControls = () => {
  const { imageUrl } = useImageStore();
  const [activeTab, setActiveTab] = useState<"SVG" | "Video" | "PNG" | "GIF">(
    "SVG"
  );
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Separate function to just switch to PNG tab without downloading
  const switchToPngTab = () => {
    setActiveTab("PNG");
    setExportError(null);
  };

  const handleExportPNG = async () => {
    setExportError(null);
    setIsExporting(true);

    // No longer require an image to be present for export
    // This allows exporting when there's only text on the canvas
    try {
      // Show loading state
      setExportError("Preparing canvas for export...");
      console.log("Starting PNG export process");

      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Export timeout")), 30000); // 30 seconds timeout
      });

      // Use the successful captureVisibleCanvas method directly
      try {
        const screenshotDataUrl = await Promise.race([
          captureVisibleCanvas(),
          timeoutPromise,
        ]);

        if (screenshotDataUrl && screenshotDataUrl.startsWith("data:")) {
          downloadPNG(screenshotDataUrl);
        } else {
          throw new Error("Failed to create screenshot");
        }
      } catch (error) {
        console.error("Export failed:", error);
        setExportError(
          "Export failed. Please try again by clicking the button below."
        );

        // Add a retry button
        const retryButton = document.createElement("button");
        retryButton.innerText = "Try Again";
        retryButton.className =
          "mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium";
        retryButton.onclick = async () => {
          setExportError("Trying export again...");
          setIsExporting(true);

          try {
            const retryDataUrl = await captureVisibleCanvas();

            if (retryDataUrl && retryDataUrl.startsWith("data:")) {
              downloadPNG(retryDataUrl);
            } else {
              throw new Error("Failed to create screenshot on retry");
            }
          } catch (retryError) {
            console.error("Retry failed:", retryError);
            setExportError(
              "Export failed. Please refresh the page and try again."
            );
            setIsExporting(false);
          }
        };

        // Find the error message container and append the button
        setTimeout(() => {
          const errorContainer = document.querySelector(".bg-red-100");
          if (errorContainer) {
            errorContainer.appendChild(retryButton);
          }
        }, 100);

        setIsExporting(false);
      }
    } catch (error) {
      console.error("Error during export process:", error);
      setExportError("Export failed. Please try again.");
      setIsExporting(false);
    }
  };

  // Helper function to download PNG
  const downloadPNG = (dataUrl: string) => {
    try {
      console.log("Initiating download with data URL length:", dataUrl.length);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `oxyz-export-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Small delay before removing the link
      setTimeout(() => {
        document.body.removeChild(link);
        console.log("Download initiated successfully");
        // Clear any error messages on success
        setExportError(null);
        setIsExporting(false);
      }, 100);
    } catch (downloadError) {
      console.error("Error during download:", downloadError);
      setExportError("Failed to download the image. Please try again.");
      setIsExporting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="block text-xs font-medium mb-2">Export:</div>
      <ul className="flex flex-wrap text-xs font-medium text-center text-gray-500 dark:text-gray-400 gap-2">
        <li className="flex-1">
          <button
            onClick={() => setActiveTab("SVG")}
            className={`flex items-center justify-center w-full h-10 px-4 rounded-lg ${
              activeTab === "SVG"
                ? "text-white bg-neutral-800 hover:bg-neutral-700"
                : "hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            SVG
          </button>
        </li>
        <li className="flex-1">
          <button
            onClick={() => setActiveTab("Video")}
            className={`flex items-center justify-center w-full h-10 px-4 rounded-lg ${
              activeTab === "Video"
                ? "text-white bg-neutral-800 hover:bg-neutral-700"
                : "hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            Video
          </button>
        </li>
        <li className="flex-1">
          <button
            onClick={switchToPngTab}
            className={`flex items-center justify-center w-full h-10 px-4 rounded-lg ${
              activeTab === "PNG"
                ? "text-white bg-neutral-800 hover:bg-neutral-700"
                : "hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            PNG
          </button>
        </li>
        <li className="flex-1">
          <button
            onClick={() => setActiveTab("GIF")}
            className={`flex items-center justify-center w-full h-10 px-4 rounded-lg ${
              activeTab === "GIF"
                ? "text-white bg-neutral-800 hover:bg-neutral-700"
                : "hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            GIF
          </button>
        </li>
      </ul>

      {activeTab === "SVG" && (
        <div className="mt-4">
          <p className="text-xs mb-2">SVG Code:</p>
          <pre className="bg-white dark:bg-neutral-800 p-2 rounded-lg text-xs max-h-[10rem] text-left overflow-x-auto text-neutral-600 dark:text-neutral-400"></pre>
          <div className="mt-4 flex space-x-2 w-full justify-between">
            <button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center">
              <Copy size={14} className="mr-2" /> Copy SVG
            </button>
            <button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center">
              <Download size={14} className="mr-2" /> Download SVG
            </button>
          </div>
        </div>
      )}

      {activeTab === "PNG" && (
        <div className="mt-4">
          <p className="text-xs mb-2">PNG Export:</p>
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg text-center">
            {isExporting ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 mb-2"></div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {exportError || "Preparing canvas for export..."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                  {!imageUrl
                    ? "Click the button below to download your text design as a PNG image."
                    : "Click the button below to download your design as a PNG image."}
                </p>
                <button
                  onClick={handleExportPNG}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-lg flex items-center mx-auto font-medium"
                  disabled={isExporting}
                >
                  <Download size={16} className="mr-2" /> Download PNG
                </button>

                {exportError && (
                  <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-lg flex items-center text-xs">
                    <AlertCircle size={14} className="mr-2" />
                    {exportError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
