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
import SelectionControls from "./Toolbar components/selectionControls";
import PresetBuilder from "./Toolbar components/filterBuilder";
import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Settings,
  Image,
  Type,
  Layout,
  Save,
  Share,
} from "lucide-react";

const ToolBar = () => {
  const { colorValue, setColorValue } = useDesignStore();

  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    design: true,
    assets: false,
    text: false,
    export: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Section header component
  const SectionHeader = ({
    title,
    section,
    icon,
  }: {
    title: string;
    section: keyof typeof expandedSections;
    icon: React.ReactNode;
  }) => (
    <button
      className="w-full flex items-center justify-between py-3 px-4 text-lg font-medium text-white hover:opacity-80 transition-opacity"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronDown size={18} />
      ) : (
        <ChevronRight size={18} />
      )}
    </button>
  );

  return (
    <div className="bg-gradient-to-br from-[#070707] to-[#1a1a1a] flex flex-col h-screen fixed top-0 right-0 overflow-hidden w-80 md:w-96 border-l border-[#333333]">
      <h2 className="text-xl font-semibold text-center sticky top-0 backdrop-blur-md bg-black/30 z-10 py-4 px-4 border-b border-[#333333]">
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          O.Designer
        </span>
      </h2>

      {/* Scrollable content container - takes full height */}
      <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-[#333333] scrollbar-track-transparent">
        {/* Main controls section */}
        <div className="border-b border-[#333333]">
          <SectionHeader
            title="Main Controls"
            section="main"
            icon={<Settings size={18} />}
          />
          {expandedSections.main && (
            <div className="px-4 py-3 space-y-4">
              <HeaderControls />
              <div className="pt-2 pb-2">
                <p className="text-[#888] text-xs mb-2">Color</p>
                <ColorPicker
                  colorValue={colorValue}
                  setColorValue={setColorValue}
                />
              </div>
            </div>
          )}
        </div>

        {/* Design settings section */}
        <div className="border-b border-[#333333]">
          <SectionHeader
            title="Design Settings"
            section="design"
            icon={<Layout size={18} />}
          />
          {expandedSections.design && (
            <div className="px-4 py-3 space-y-6">
              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">
                  Filter Effects
                </p>
                <PresetBuilder />
              </div>

              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">
                  Canvas Format
                </p>
                <AspectRatioControls />
              </div>

              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">
                  Selection Controls
                </p>
                <SelectionControls />
              </div>
            </div>
          )}
        </div>

        {/* Assets section */}
        <div className="border-b border-[#333333]">
          <SectionHeader
            title="Assets"
            section="assets"
            icon={<Image size={18} />}
          />
          {expandedSections.assets && (
            <div className="px-4 py-3 space-y-6">
              <div className="pt-1">
                <p className="text-[#888] text-xs uppercase mb-2">
                  Saved Designs
                </p>
                <SavedDesigns />
              </div>

              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">Presets</p>
                <PresetDesigns />
              </div>

              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">Logos</p>
                <LogoDesigns />
              </div>

              <div className="pt-2">
                <p className="text-[#888] text-xs uppercase mb-2">Images</p>
                <ImageUploader />
              </div>
            </div>
          )}
        </div>

        {/* Text section */}
        <div className="border-b border-[#333333]">
          <SectionHeader
            title="Text"
            section="text"
            icon={<Type size={18} />}
          />
          {expandedSections.text && (
            <div className="px-4 py-3">
              <TextControls />
            </div>
          )}
        </div>

        {/* Export section */}
        <div className="border-b border-[#333333]">
          <SectionHeader
            title="Export"
            section="export"
            icon={<Share size={18} />}
          />
          {expandedSections.export && (
            <div className="px-4 py-3">
              <ExportControls />
            </div>
          )}
        </div>
      </div>

      {/* Footer is outside the scrollable area - always visible at bottom */}
      <div className="mt-auto sticky bottom-0 backdrop-blur-md bg-black/30 border-t border-[#333333] px-4 py-3">
        <Footer />
      </div>
    </div>
  );
};

export default ToolBar;
