import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LogoUploader from "../logoUploade";

interface Logo {
  id: string;
  url: string;
  filename: string;
}

interface LogoSelectorProps {
  onSelect: (logoUrl: string) => void;
}

const LogoSelector = ({ onSelect }: LogoSelectorProps) => {
  const { data: session } = useSession();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      if (session) {
        try {
          const response = await fetch("/api/logos");
          if (response.ok) {
            const data = await response.json();
            setLogos(data.logos);

            // Automatically select the first logo
            if (data.logos.length > 0) {
              onSelect(data.logos[0].url);
            }
          }
        } catch (error) {
          console.error("Error fetching logos:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLogos();
  }, [session]); // Only run when the session changes

  if (loading) {
    return <div>Loading logos...</div>;
  }

  return (
    <div className="mb-4 w-1/4">
      <label className="block text-xl font-bold mb-2 text-center">
        Select Logo
      </label>
      <div className="flex flex-col gap-4">
        {logos.map((logo, index) => (
          <div
            key={logo.id}
            onClick={() => onSelect(logo.url)}
            className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-all w-24 h-24"
          >
            <img
              src={logo.url}
              alt={`Logo ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
      <LogoUploader />
    </div>
  );
};

export default LogoSelector;
