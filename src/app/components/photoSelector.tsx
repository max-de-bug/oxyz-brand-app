import Image from "next/image";
import { useState } from "react";

interface PhotoSelectorProps {
  onSelect: (imageUrl: string) => void;
}

const photos = [
  "/sample-photos/photo1.jpg",
  "/sample-photos/photo2.jpg",
  "/sample-photos/photo3.jpg",
  "/sample-photos/photo4.jpg",
  "/sample-photos/photo5.jpg",
];

export default function PhotoSelector({ onSelect }: PhotoSelectorProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handlePhotoClick = (photo: string) => {
    setSelectedPhoto(photo);
    onSelect(photo);
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Choose a Photo</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedPhoto === photo
                ? "border-primary"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePhotoClick(photo)}
          >
            <Image
              src={photo || "/placeholder.svg"}
              alt={`Sample photo ${index + 1}`}
              width={400}
              height={400}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
