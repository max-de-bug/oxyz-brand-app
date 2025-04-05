"use client";
import {
  Bold,
  EyeOff,
  Italic,
  Type,
  Plus,
  Trash,
  Edit,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
} from "lucide-react";
import { TextOverlay, useDesignStore } from "../../store/designStore";
import { NumberInput } from "../../utils/numberInput";
import { useState, useEffect, useRef } from "react";

// Define available fonts
const FONT_OPTIONS = [
  { value: "ABCDiatype-Regular", label: "ABC Diatype" },
  { value: "ABCDiatypeMono-Regular", label: "ABC Diatype Mono" },
  { value: "NeueMachina-Regular", label: "Neue Machina" },
  { value: "NeueMachina-Medium", label: "Neue Machina Medium" },
  { value: "NeueMachina-Ultrabold", label: "Neue Machina Ultrabold" },
  { value: "NeueMachina-Ultralight", label: "Neue Machina Ultralight" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "Inter", label: "Inter" },
];

// Default values for when no text is selected
const DEFAULT_TEXT_VALUES = {
  text: "",
  isVisible: true,
  color: "#000000",
  fontFamily: "ABCDiatype-Regular",
  fontSize: 24,
  isBold: false,
  isItalic: false,
  rotation: 0,
  spacing: 0,
};

// Add type definition for the global window property
declare global {
  interface Window {
    isEditingText: boolean;
  }
}

// Initialize global variable to track when we're editing text
// This will be used in imageRender.tsx to prevent keyboard shortcuts
if (typeof window !== "undefined") {
  window.isEditingText = false;
}

const TextControls = () => {
  const {
    textOverlays,
    addText,
    updateText,
    deleteTextById,
    selectTextById,
    getSelectedText,
  } = useDesignStore();

  const [newTextInput, setNewTextInput] = useState("");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  // Reference to the editing input field
  const editingInputRef = useRef<HTMLInputElement>(null);

  // Get the currently selected text
  const selectedText = getSelectedText();

  // Reset editing state when selected text changes
  useEffect(() => {
    setEditingTextId(null);
  }, [selectedText]);

  // Update the global editing state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.isEditingText = editingTextId !== null;
    }
    return () => {
      if (typeof window !== "undefined") {
        window.isEditingText = false;
      }
    };
  }, [editingTextId]);

  // Handle adding new text
  const handleAddText = () => {
    if (newTextInput.trim()) {
      addText(newTextInput.trim());
      setNewTextInput("");
    }
  };

  // Handle updating selected text
  const handleUpdateSelectedText = (
    updates: Partial<Omit<TextOverlay, "id">>
  ) => {
    if (selectedText) {
      updateText(selectedText.id, updates);
    } else {
      // If no text is selected, create a new one with the settings
      if (newTextInput.trim() || updates.text) {
        const text = updates.text || newTextInput.trim() || "New Text";
        const newTextWithSettings = {
          ...DEFAULT_TEXT_VALUES,
          ...updates,
          text,
        };

        addText(text);
        setNewTextInput("");

        // Apply the settings to the newly created text
        setTimeout(() => {
          const newlyAddedText = useDesignStore
            .getState()
            .textOverlays.slice(-1)[0];
          if (newlyAddedText) {
            updateText(newlyAddedText.id, updates);
          }
        }, 0);
      }
    }
  };

  // Start editing a text item
  const startEditing = (text: TextOverlay) => {
    setEditingTextId(text.id);
    setEditingTextValue(text.text);

    // Focus the input field after a short delay (to allow the input to render)
    setTimeout(() => {
      if (editingInputRef.current) {
        editingInputRef.current.focus();
      }
    }, 50);
  };

  // Save the edited text
  const saveEditedText = () => {
    if (editingTextId && editingTextValue.trim()) {
      updateText(editingTextId, { text: editingTextValue.trim() });
    }
    setEditingTextId(null);
  };

  // Cancel text editing
  const cancelEditing = () => {
    setEditingTextId(null);
  };

  // Handle input changes during editing
  const handleEditingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTextValue(e.target.value);
  };

  // Handle key press in editing input
  const handleEditingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation for all key events to prevent global handlers from firing
    e.stopPropagation();

    // Only handle Enter and Escape keys to save or cancel
    if (e.key === "Enter") {
      saveEditedText();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  // Get the active text properties (selected text or defaults)
  const activeTextProps = selectedText || DEFAULT_TEXT_VALUES;

  return (
    <div className="space-y-4">
      {/* Add new text input */}
      <div>
        <p className="text-xs text-[#888888] mb-2">Add Text</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="text-xs w-full p-2 px-3 bg-[#171717] border border-[#333333] rounded-md text-white"
            placeholder="Enter text..."
            value={newTextInput}
            onChange={(e) => setNewTextInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddText()}
            maxLength={30}
          />
          <button
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity"
            onClick={handleAddText}
            title="Add text"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* List of existing text elements */}
      {textOverlays.length > 0 && (
        <div>
          <p className="text-xs text-[#888888] mb-2">
            Text Elements{" "}
            {selectedText && (
              <span className="text-blue-500 ml-1">
                ({textOverlays.filter((t) => t.isSelected).length} selected)
              </span>
            )}
          </p>
          <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#333333] scrollbar-track-transparent pr-1">
            {textOverlays.map((text) => (
              <div
                key={text.id}
                className={`p-2 rounded-md flex items-center justify-between ${
                  text.isSelected
                    ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/50"
                    : "bg-[#171717] border border-[#333333] hover:border-[#444444]"
                } transition-colors`}
              >
                {editingTextId === text.id ? (
                  <div className="flex items-center w-full">
                    <input
                      ref={editingInputRef}
                      type="text"
                      className="text-xs bg-[#111111] text-white border border-[#444444] rounded p-1 flex-grow mr-2"
                      value={editingTextValue}
                      onChange={handleEditingInputChange}
                      onKeyDown={handleEditingKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={30}
                    />
                    <button
                      onClick={saveEditedText}
                      className="p-1 text-green-500 hover:text-green-400"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-red-500 hover:text-red-400 ml-1"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="truncate mr-2 text-xs text-white cursor-pointer flex-grow"
                      onClick={() => selectTextById(text.id)}
                      style={{
                        fontFamily: text.fontFamily,
                        fontWeight: text.isBold ? "bold" : "normal",
                        fontStyle: text.isItalic ? "italic" : "normal",
                      }}
                    >
                      {text.text}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        className="p-1 text-[#888888] hover:text-white transition-colors"
                        onClick={() => startEditing(text)}
                        title="Edit text"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="p-1 text-[#888888] hover:text-white transition-colors"
                        onClick={() =>
                          updateText(text.id, { isVisible: !text.isVisible })
                        }
                        title={text.isVisible ? "Hide" : "Show"}
                      >
                        {text.isVisible ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>
                      <button
                        className="p-1 text-[#888888] hover:text-red-500 transition-colors"
                        onClick={() => deleteTextById(text.id)}
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text formatting controls (only shown when text is selected) */}
      {selectedText && (
        <div>
          <p className="text-xs text-[#888888] mb-2">Text Formatting</p>
          <div className="space-y-3 bg-[#171717] p-3 rounded-md border border-[#333333]">
            {/* Font family selection */}
            <div>
              <p className="text-xs text-[#777777] mb-1">Font</p>
              <select
                className="w-full p-2 bg-[#111111] border border-[#333333] rounded text-xs text-white"
                value={activeTextProps.fontFamily}
                onChange={(e) =>
                  handleUpdateSelectedText({ fontFamily: e.target.value })
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size, color, and style controls */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-[#777777] mb-1">Size</p>
                <div className="w-full p-2 bg-[#111111] border border-[#333333] rounded text-xs text-white">
                  <NumberInput
                    min={8}
                    max={72}
                    value={activeTextProps.fontSize}
                    onChange={(value) =>
                      handleUpdateSelectedText({ fontSize: value })
                    }
                    unit="px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#777777] mb-1">Color</p>
                <input
                  type="color"
                  className="w-full h-8 bg-[#111111] border border-[#333333] rounded cursor-pointer"
                  value={activeTextProps.color}
                  onChange={(e) =>
                    handleUpdateSelectedText({ color: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Style buttons */}
            <div className="flex gap-2">
              <button
                className={`flex-1 p-2 rounded border ${
                  activeTextProps.isBold
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-[#111111] text-[#888888] border-[#333333] hover:bg-[#222222]"
                } transition-colors`}
                onClick={() =>
                  handleUpdateSelectedText({ isBold: !activeTextProps.isBold })
                }
              >
                <Bold size={14} className="mx-auto" />
              </button>
              <button
                className={`flex-1 p-2 rounded border ${
                  activeTextProps.isItalic
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-[#111111] text-[#888888] border-[#333333] hover:bg-[#222222]"
                } transition-colors`}
                onClick={() =>
                  handleUpdateSelectedText({
                    isItalic: !activeTextProps.isItalic,
                  })
                }
              >
                <Italic size={14} className="mx-auto" />
              </button>
              <button
                className="flex-1 p-2 rounded bg-[#111111] text-[#888888] border border-[#333333] hover:bg-[#222222] transition-colors"
                onClick={() =>
                  handleUpdateSelectedText({
                    spacing: activeTextProps.spacing + 1,
                  })
                }
              >
                <AlignLeft size={14} className="mx-auto" />
              </button>
              <button
                className="flex-1 p-2 rounded bg-[#111111] text-[#888888] border border-[#333333] hover:bg-[#222222] transition-colors"
                onClick={() => handleUpdateSelectedText({ spacing: 0 })}
              >
                <AlignCenter size={14} className="mx-auto" />
              </button>
              <button
                className="flex-1 p-2 rounded bg-[#111111] text-[#888888] border border-[#333333] hover:bg-[#222222] transition-colors"
                onClick={() =>
                  handleUpdateSelectedText({
                    spacing: activeTextProps.spacing - 1,
                  })
                }
              >
                <AlignRight size={14} className="mx-auto" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextControls;
