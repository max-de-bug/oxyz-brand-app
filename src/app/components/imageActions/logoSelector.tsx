interface LogoSelectorProps {
  onSelect: (logoUrl: string) => void;
}

const LogoSelector = ({ onSelect }: LogoSelectorProps) => {
  const logos = ["/logos/logo1.png", "logos/logo2.png", "logos/logo3.png"];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Logo
      </label>
      <div className="grid grid-cols-3 gap-2">
        {logos.map((logo, index) => (
          <button
            key={index}
            onClick={() => onSelect(logo)}
            className="border border-gray-300 rounded p-2 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <img
              src={logo || "/placeholder.svg"}
              alt={`Logo ${index + 1}`}
              className="w-full h-auto"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LogoSelector;
