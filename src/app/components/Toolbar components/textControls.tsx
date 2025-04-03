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
} from "lucide-react";
import { TextOverlay, useDesignStore } from "../../store/designStore";
import { NumberInput } from "../../utils/numberInput";
import { useState, useEffect, useRef } from "react";

// Define available fonts
const FONT_OPTIONS = [
  { value: "ABCDiatype-Regular", label: "ABC Diatype" },
  { value: "ABCDiatypeMono-Regular", label: "ABC Diatype Mono" },
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

// Global variable to track when we're editing text
// This will be used in imageRender.tsx to prevent keyboard shortcuts

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
    // Only handle Enter and Escape keys to save or cancel
    // Don't intercept other keys like Backspace
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditedText();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }

    // Explicitly stop propagation for Backspace to ensure it doesn't trigger global handlers
    if (e.key === "Backspace" || e.key === "Delete") {
      e.stopPropagation();
    }
  };

  // Get the active text properties (selected text or defaults)
  const activeTextProps = selectedText || DEFAULT_TEXT_VALUES;

  return (
    <>
      <ul className="flex flex-wrap text-xs font-medium text-center justify-center text-gray-500 dark:text-gray-400 gap-2 mb-2">
        <li className="flex-1">
          <button className="flex justify-center py-3 px-3 rounded-lg text-white bg-neutral-800 hover:bg-neutral-700">
            <Type />
          </button>
        </li>
      </ul>

      {/* Add new text input and button */}
      <div className="col-span-2 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="block text-xs font-medium">Add New Text</div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="text-xs w-full p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            placeholder="Enter new text"
            value={newTextInput}
            onChange={(e) => setNewTextInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddText()}
            maxLength={30}
          />
          <button
            className="px-3 py-2 bg-neutral-800 text-white rounded-lg"
            onClick={handleAddText}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* List of existing text elements */}
      {textOverlays.length > 0 && (
        <div className="col-span-2 mb-4">
          <div className="block text-xs font-medium mb-2">
            Existing Texts{" "}
            {selectedText && (
              <span className="text-blue-500">(1 selected)</span>
            )}
          </div>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {textOverlays.map((text) => (
              <li
                key={text.id}
                className={`flex justify-between items-center p-2 rounded-lg ${
                  text.isSelected ? "bg-neutral-200 dark:bg-neutral-700" : ""
                } hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer`}
                onClick={() =>
                  editingTextId !== text.id && selectTextById(text.id)
                }
              >
                {editingTextId === text.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      ref={editingInputRef}
                      type="text"
                      className="text-xs flex-1 p-1 bg-white dark:bg-neutral-600 rounded"
                      value={editingTextValue}
                      onChange={handleEditingInputChange}
                      onKeyDown={handleEditingKeyDown}
                      maxLength={30}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="p-1 text-green-500 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEditedText();
                      }}
                      title="Save changes"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className="text-xs truncate"
                      style={{ maxWidth: "70%" }}
                    >
                      {text.text || "(empty text)"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 text-blue-500 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(text);
                        }}
                        title="Edit text"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTextById(text.id);
                        }}
                        title="Delete text"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Always show controls */}
      <div className="col-span-2">
        <div className="flex text-xs gap-2 mt-2">
          <button
            className={`px-3 py-3 rounded-lg ${
              activeTextProps.isBold
                ? "bg-neutral-800 text-white"
                : "text-black dark:text-white"
            }`}
            onClick={() =>
              handleUpdateSelectedText({ isBold: !activeTextProps.isBold })
            }
          >
            <Bold />
          </button>
          <button
            className={`px-3 py-3 rounded-lg ${
              activeTextProps.isItalic
                ? "bg-neutral-800 text-white"
                : "text-black dark:text-white"
            }`}
            onClick={() =>
              handleUpdateSelectedText({ isItalic: !activeTextProps.isItalic })
            }
          >
            <Italic />
          </button>
          <input
            type="color"
            value={activeTextProps.color}
            onChange={(e) =>
              handleUpdateSelectedText({ color: e.target.value })
            }
            className="w-10 h-10 rounded-lg"
          />
        </div>
        <div className="mt-2">
          <label
            htmlFor="fontFamily"
            className="block text-xs font-medium mb-1"
          >
            Font Family
          </label>
          <select
            id="fontFamily"
            className="text-xs w-full p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
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
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="fontSize" className="block text-xs font-medium">
              Font Size
            </label>
            <NumberInput
              value={activeTextProps.fontSize}
              onChange={(value) =>
                handleUpdateSelectedText({ fontSize: value })
              }
              min={0}
              max={100}
              unit="px"
            />
          </div>
          <input
            type="range"
            id="fontSize"
            min="0"
            max="100"
            value={activeTextProps.fontSize}
            onChange={(e) =>
              handleUpdateSelectedText({ fontSize: parseInt(e.target.value) })
            }
            className="w-full mt-2"
          />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="rotation" className="block text-xs font-medium">
              Rotation
            </label>
            <NumberInput
              value={activeTextProps.rotation}
              onChange={(value) =>
                handleUpdateSelectedText({ rotation: value })
              }
              min={-180}
              max={180}
              unit="°"
            />
          </div>
          <input
            type="range"
            id="rotation"
            min="-180"
            max="180"
            value={activeTextProps.rotation}
            onChange={(e) =>
              handleUpdateSelectedText({ rotation: parseInt(e.target.value) })
            }
            className="w-full mt-2"
          />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="spacing" className="block text-xs font-medium">
              Letter Spacing
            </label>
            <NumberInput
              value={activeTextProps.spacing}
              onChange={(value) => handleUpdateSelectedText({ spacing: value })}
              min={0}
              max={20}
              unit="px"
            />
          </div>
          <input
            type="range"
            id="spacing"
            min="0"
            max="20"
            value={activeTextProps.spacing}
            onChange={(e) =>
              handleUpdateSelectedText({ spacing: parseInt(e.target.value) })
            }
            className="w-full mt-2"
          />
        </div>
      </div>
    </>
  );
};

export default TextControls;
