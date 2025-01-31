import { useState } from "react";
import Image from "next/image";

const logos = ["/logo1.png", "/logo2.png", "/logo3.png"];

interface LogoSelectorProps {
  onLogoSelect: (logo: string) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}

export default function LogoSelector({
  onLogoSelect,
  onPositionChange,
}: LogoSelectorProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  const handleLogoSelect = (logo: string) => {
    setSelectedLogo(logo);
    onLogoSelect(logo);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onPositionChange({
      x: name === "x" ? Number.parseInt(value) : 0,
      y: name === "y" ? Number.parseInt(value) : 0,
    });
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Select Logo</h2>
      <div className="flex space-x-4">
        {logos.map((logo) => (
          <button
            key={logo}
            onClick={() => handleLogoSelect(logo)}
            className={`border-2 p-2 rounded ${
              selectedLogo === logo ? "border-blue-500" : "border-gray-300"
            }`}
          >
            <Image
              src={logo || "/placeholder.svg"}
              alt="Logo"
              width={50}
              height={50}
            />
          </button>
        ))}
      </div>
      {selectedLogo && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Logo Position</h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              X:
              <input
                type="number"
                name="x"
                onChange={handlePositionChange}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
            <label className="flex items-center">
              Y:
              <input
                type="number"
                name="y"
                onChange={handlePositionChange}
                className="ml-2 border rounded px-2 py-1"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
