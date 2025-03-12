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
  } = useDesignStore();

  return (
    <div className="px-4 max-w-4xl mx-auto lg:max-w-96 lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:bg-neutral-200 lg:dark:bg-neutral-900 lg:overflow-y-auto">
      <HeaderControls />
      <hr className="h-px border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800 hidden lg:block" />

      <ColorPicker colorValue={colorValue} setColorValue={setColorValue} />

      <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

      <SavedDesigns />

      <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

      <PresetDesigns />

      <LogoDesigns />

      <ImageUploader />

      <TypographyDesigns />

      <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

      <TextControls />

      <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

      <PositionControls
        translationX={translationX}
        setTranslationX={setTranslationX}
        translationY={translationY}
        setTranslationY={setTranslationY}
      />

      <SizeControls
        minSize={minSize}
        setMinSize={setMinSize}
        maxSize={maxSize}
        setMaxSize={setMaxSize}
        spacing={spacing}
        setSpacing={setSpacing}
        rotation={rotation}
        setRotation={setRotation}
      />

      <hr className="h-px my-4 border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800" />

      <ExportControls />

      <Footer />
    </div>
  );
};

export default ToolBar;
