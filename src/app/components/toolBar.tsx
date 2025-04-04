"use client";
import { useDesignStore } from "../store/designStore";

import HeaderControls from "./Toolbar components/headerControls";
import ColorPicker from "./Toolbar components/colorPicker";
import SavedDesigns from "./Toolbar components/savedDesigns";
import PresetDesigns from "./Toolbar components/presetDesign";
import TextControls from "./Toolbar components/textControls";
import PositionControls from "./Toolbar components/positionControls";
import SizeControls from "./Toolbar components/sizeControls";
import ExportControls from "./Toolbar components/exportControls";
import Footer from "./Toolbar components/footer";
import LogoDesigns from "./Toolbar components/logoDesign";
import TypographyDesigns from "./Toolbar components/typographyDesigns";
import ImageUploader from "./Toolbar components/imageUploader";
import AspectRatioControls from "./Toolbar components/aspectRatioControls";
import PresetBuilder from "./Toolbar components/presetBuilder";
import SelectionControls from "./Toolbar components/selectionControls";

const ToolBar = () => {
  const {
    rotation,
    setRotation,
    colorValue,
    setColorValue,
    translationX,
    setTranslationX,
    translationY,
    setTranslationY,
    minSize,
    setMinSize,
    maxSize,
    setMaxSize,
    spacing,
    setSpacing,
    aspectRatio,
    textOverlay,
    setTextRotation,
    setTextSpacing,
    setTextTranslationX,
    setTextTranslationY,
  } = useDesignStore();

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-l-lg shadow-md flex flex-col h-screen fixed top-0 right-0 overflow-hidden w-80 md:w-96 border-l border-neutral-200 dark:border-neutral-800">
      <h2 className="text-xl font-semibold text-center sticky top-0 bg-white dark:bg-neutral-950 z-10 py-3 px-4 border-b border-neutral-200 dark:border-neutral-900">
        Tools
      </h2>

      {/* Scrollable content container - takes full height */}
      <div className="overflow-y-auto flex-grow px-4 pb-4">
        <HeaderControls />
        <hr className="h-px border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800 hidden lg:block" />

        <ColorPicker colorValue={colorValue} setColorValue={setColorValue} />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <PresetBuilder />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <AspectRatioControls />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <SavedDesigns />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <PresetDesigns />

        <LogoDesigns />

        <ImageUploader />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <TextControls />

        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <SelectionControls />
        <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

        <ExportControls />

        {/* Always show selection controls if something is selected */}
      </div>

      {/* Footer is outside the scrollable area - always visible at bottom */}
      <div className="mt-auto sticky bottom-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 px-4 py-2">
        <Footer />
      </div>
    </div>
  );
};

export default ToolBar;
