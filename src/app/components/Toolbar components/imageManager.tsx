// "use client";

// import React, { useState } from "react";
// import { useImageStore } from "@/app/store/imageStore";
// import { Trash2, Image, Plus, Move, Minus } from "lucide-react";
// import { Slider } from "@/components/ui/slider";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// const ImageManager = () => {
//   const { images, addImage, updateImage, selectImage, deleteImage } =
//     useImageStore();

//   const [uploadingImage, setUploadingImage] = useState(false);

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files || e.target.files.length === 0) return;

//     const file = e.target.files[0];
//     setUploadingImage(true);

//     // Create a temporary URL for the image
//     const url = URL.createObjectURL(file);
//     addImage(url);

//     setUploadingImage(false);
//     e.target.value = ""; // Reset the input
//   };

//   return (
//     <div className="p-4 space-y-4">
//       <div className="flex justify-between items-center">
//         <h2 className="text-lg font-semibold">Images</h2>
//         <div>
//           <input
//             id="image-upload"
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={handleFileUpload}
//             disabled={uploadingImage}
//           />
//           <label
//             htmlFor="image-upload"
//             className="inline-flex items-center px-3 py-2 bg-gray-800 text-white text-sm rounded cursor-pointer hover:bg-gray-700"
//           >
//             <Plus size={16} className="mr-2" />
//             Add Image
//           </label>
//         </div>
//       </div>

//       {images.length === 0 ? (
//         <div className="text-center py-4 text-gray-500">
//           No images added. Click "Add Image" to begin.
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {images.map((image) => (
//             <div
//               key={image.id}
//               className={`p-3 border rounded-lg ${
//                 image.isSelected
//                   ? "border-blue-500 bg-blue-50"
//                   : "border-gray-200"
//               }`}
//               onClick={() => selectImage(image.id)}
//             >
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
//                   <img
//                     src={image.url}
//                     alt="Image thumbnail"
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <div className="text-sm font-medium">
//                     Image {image.id.substring(0, 6)}
//                   </div>
//                   <div className="text-xs text-gray-500">
//                     {image.size.toFixed(0)}% size
//                   </div>
//                 </div>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     deleteImage(image.id);
//                   }}
//                   className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded"
//                 >
//                   <Trash2 size={14} />
//                 </button>
//               </div>

//               {image.isSelected && (
//                 <div className="space-y-2">
//                   <div>
//                     <Label
//                       htmlFor={`opacity-${image.id}`}
//                       className="text-xs mb-1 block"
//                     >
//                       Opacity: {image.opacity}%
//                     </Label>
//                     <Slider
//                       id={`opacity-${image.id}`}
//                       value={[image.opacity]}
//                       min={0}
//                       max={100}
//                       step={5}
//                       onValueChange={(value) => {
//                         updateImage(image.id, { opacity: value[0] });
//                       }}
//                     />
//                   </div>

//                   <div>
//                     <Label
//                       htmlFor={`size-${image.id}`}
//                       className="text-xs mb-1 block"
//                     >
//                       Size: {image.size.toFixed(0)}%
//                     </Label>
//                     <Slider
//                       id={`size-${image.id}`}
//                       value={[image.size]}
//                       min={10}
//                       max={100}
//                       step={5}
//                       onValueChange={(value) => {
//                         updateImage(image.id, { size: value[0] });
//                       }}
//                     />
//                   </div>

//                   <div className="flex justify-between gap-2 mt-3">
//                     <Button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         selectImage(image.id);
//                       }}
//                       className="flex-1 h-8 text-xs"
//                       variant="outline"
//                     >
//                       <Move size={12} className="mr-1" /> Position
//                     </Button>
//                     <Button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         // Move this image to the front (end of the array)
//                         const newImages = [
//                           ...images.filter((img) => img.id !== image.id),
//                           image,
//                         ];
//                         newImages.forEach((img, i) => {
//                           updateImage(img.id, {
//                             isSelected: i === newImages.length - 1,
//                           });
//                         });
//                       }}
//                       className="flex-1 h-8 text-xs"
//                       variant="outline"
//                     >
//                       Bring to Front
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageManager;
