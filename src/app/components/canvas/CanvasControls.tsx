"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface CanvasControlsProps {
  activeFilter: any | null;
  imageUrl: string | null;
  logos: any[];
  textOverlay: any;
  textOverlays: any[];
  devMode: boolean;
  toggleDevMode: () => void;
  resetMainImage: () => void;
  selectLogo: (id: string | null) => void;
  handleDeleteMainImage: () => void;
  resizeStatus: string | null;
  canvasWidth: number;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  activeFilter,
  imageUrl,
  logos,
  textOverlay,
  textOverlays,
  devMode,
  toggleDevMode,
  resetMainImage,
  selectLogo,
  handleDeleteMainImage,
  resizeStatus,
}) => {
  return (
    <>
      <div className="flex justify-between items-center w-full mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
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

        {/* Dev Mode Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDevMode}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              devMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            {devMode ? "Dev Mode On" : "Dev Mode Off"}
          </button>

          {devMode && (
            <button
              onClick={resetMainImage}
              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300"
              title="Reset image position and scale"
            >
              Reset Image
            </button>
          )}
        </div>
      </div>

      {/* Status message for resizing and aspect ratio changes */}
      {resizeStatus && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md z-20 text-sm">
          {resizeStatus}
        </div>
      )}

      {imageUrl && (
        <button
          className="absolute top-3 right-3 p-1 rounded-full bg-red-500 text-white opacity-50 hover:opacity-100 z-10"
          onClick={handleDeleteMainImage}
          title="Remove image from canvas"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* Empty state message */}
      {!imageUrl &&
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

      {/* Dynamic spacer that adjusts based on the aspect ratio */}
    </>
  );
};
