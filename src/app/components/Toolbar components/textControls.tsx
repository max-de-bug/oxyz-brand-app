"use client";
import { Bold, EyeOff, Eye, Italic, Type } from "lucide-react";
import { useDesignStore } from "../../store/designStore";
import { NumberInput } from "../../utils/numberInput";
const TextControls = () => {
  const { textOverlay, setTextOverlay } = useDesignStore();

  return (
    <>
      <ul className="flex flex-wrap text-xs font-medium text-center justify-center text-gray-500 dark:text-gray-400 gap-2 mb-2">
        <li className="flex-1">
          <button
            className="flex justify-center py-3 px-3 rounded-lg text-white bg-neutral-800 hover:bg-neutral-700"
            onClick={() =>
              setTextOverlay({ isVisible: !textOverlay.isVisible })
            }
          >
            {textOverlay.isVisible ? <Type /> : <EyeOff />}
          </button>
        </li>
        <li></li>
      </ul>
      <div className="col-span-2">
        <div className="flex justify-between items-center mb-2">
          <div className="block text-xs font-medium">Custom Text</div>
        </div>
        <input
          type="text"
          className="text-xs w-full p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
          maxLength={20}
          placeholder="Enter your text here"
          value={textOverlay.text}
          onChange={(e) => setTextOverlay({ text: e.target.value })}
        />
        <div className="flex text-xs gap-2 mt-2">
          <button
            className={`px-3 py-3 rounded-lg ${
              textOverlay.isBold
                ? "bg-neutral-800 text-white"
                : "text-black dark:text-white"
            }`}
            onClick={() => setTextOverlay({ isBold: !textOverlay.isBold })}
          >
            <Bold />
          </button>
          <button
            className={`px-3 py-3 rounded-lg ${
              textOverlay.isItalic
                ? "bg-neutral-800 text-white"
                : "text-black dark:text-white"
            }`}
            onClick={() => setTextOverlay({ isItalic: !textOverlay.isItalic })}
          >
            <Italic />
          </button>
          <input
            type="color"
            value={textOverlay.color}
            onChange={(e) => setTextOverlay({ color: e.target.value })}
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
            value={textOverlay.fontFamily}
            onChange={(e) => setTextOverlay({ fontFamily: e.target.value })}
          >
            <option value="Space Grotesk">Space Grotesk</option>
            <option value="Inter">Inter</option>
          </select>
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="fontSize" className="block text-xs font-medium">
              Font Size
            </label>
            <NumberInput
              value={textOverlay.fontSize}
              onChange={(value) => setTextOverlay({ fontSize: value })}
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
            value={textOverlay.fontSize}
            onChange={(e) =>
              setTextOverlay({ fontSize: parseInt(e.target.value) })
            }
            className="w-full mt-2"
          />
        </div>
      </div>
    </>
  );
};

export default TextControls;
