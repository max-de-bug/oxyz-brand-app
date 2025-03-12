import Image from "next/image";
import { useState, useEffect } from "react";

interface PhotoSelectorProps {
  onSelect: (imageUrl: string) => void;
}

const PhotoSelector = ({ onSelect }: PhotoSelectorProps) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch("/api/photo");
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.logos.map((logo: any) => logo.url)); // Assuming the response structure
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (loading) {
    return <div>Loading photos...</div>;
  }

  return (
    <div className="mb-4 w-1/4">
      <h2 className="text-xl font-bold mb-2 text-center">Choose a Photo</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all"
            onClick={() => onSelect(photo)}
          >
            <Image
              src={photo}
              alt={`Sample photo ${index + 1}`}
              width={160} // Fixed width
              height={160} // Fixed height
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoSelector;
