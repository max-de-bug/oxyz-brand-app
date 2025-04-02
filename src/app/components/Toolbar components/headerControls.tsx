"use client";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Save, Share, Copy, Loader2 } from "lucide-react";
import AuthButton from "../authButton";
import { useState } from "react";
import { captureVisibleCanvas } from "./exportControls";
import { useDesignStore } from "@/app/store/designStore";
import { useImageStore } from "@/app/store/imageStore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/store/auth-context";
import { useUploadImage } from "@/lib/api/queries";

const HeaderControls = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  // Access stores for image and design state
  const { imageUrl, setImage } = useImageStore();
  const { textOverlay, currentDesignId, setCurrentDesignId } = useDesignStore();

  // Use the upload image mutation from React Query
  const uploadImageMutation = useUploadImage();

  const handleSave = async () => {
    // Check if user is authenticated
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save designs",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }

    // Check if there's an image to save
    if (!imageUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add an image to save a design",
        duration: 3000,
      });
      return null;
    }

    setIsSaving(true);
    try {
      // Capture canvas as image using the imported function
      const capturedImage = await captureVisibleCanvas();

      if (!capturedImage) {
        throw new Error("Failed to capture canvas");
      }

      // Convert base64 to blob for upload
      const fetchResponse = await fetch(capturedImage);
      const blob = await fetchResponse.blob();

      // Create a File object from the blob
      const fileName = `design_${Date.now()}.png`;
      const fileToUpload = new File([blob], fileName, { type: "image/png" });

      // Upload the image using the mutation
      const uploadedImage = await uploadImageMutation.mutateAsync(fileToUpload);

      // Check if the upload was successful and we have a URL
      if (uploadedImage?.url) {
        // Store the URL from the server (not the data URL)
        setSavedImageUrl(uploadedImage.url);

        toast({
          title: "Success",
          description: "Design saved to your library!",
          duration: 3000,
        });

        return uploadedImage.url;
      } else {
        throw new Error("Upload successful but no URL was returned");
      }
    } catch (error) {
      console.error("Error saving design:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save design. Please try again.",
        duration: 3000,
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Function to copy image to clipboard
  const copyImageToClipboard = async () => {
    setIsCopying(true);
    try {
      // Check if there's content to copy
      if (!imageUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add an image to the canvas first",
          duration: 3000,
        });
        return false;
      }

      // Capture the canvas
      const capturedImage = await captureVisibleCanvas();
      if (!capturedImage) {
        throw new Error("Failed to capture canvas");
      }

      // Convert base64 to blob for clipboard
      const fetchResponse = await fetch(capturedImage);
      const blob = await fetchResponse.blob();

      try {
        // Try using the modern Clipboard API
        const clipboardItem = new ClipboardItem({
          "image/png": blob,
        });

        await navigator.clipboard.write([clipboardItem]);

        toast({
          title: "Success",
          description: "Design copied to clipboard!",
          duration: 3000,
        });

        return true;
      } catch (clipboardError) {
        console.error("Clipboard API error:", clipboardError);

        // Fallback method - create a temporary image element
        const img = document.createElement("img");
        img.src = capturedImage;

        // Try to use deprecated execCommand as fallback
        const tempContainer = document.createElement("div");
        tempContainer.appendChild(img);
        tempContainer.setAttribute("contenteditable", "true");
        tempContainer.style.position = "fixed";
        tempContainer.style.opacity = "0";
        document.body.appendChild(tempContainer);

        // Select the content
        const range = document.createRange();
        range.selectNodeContents(tempContainer);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Execute copy command
        const success = document.execCommand("copy");
        document.body.removeChild(tempContainer);

        if (success) {
          toast({
            title: "Success",
            description: "Design copied to clipboard (fallback method)!",
            duration: 3000,
          });
          return true;
        } else {
          throw new Error(
            "Clipboard copying failed. Please try downloading instead."
          );
        }
      }
    } catch (error) {
      console.error("Error copying design to clipboard:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to copy design to clipboard. Try a different browser.",
        duration: 5000,
      });
      return false;
    } finally {
      setIsCopying(false);
    }
  };

  const handleShare = async () => {
    try {
      // Check if there's content to share
      if (!imageUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add an image to the canvas before sharing",
          duration: 3000,
        });
        return;
      }

      setIsSharing(true);

      // First try to copy the image to clipboard
      const copied = await copyImageToClipboard();

      // Open Twitter compose window
      const tweetText = copied
        ? "Check out my design created with OXYZ Media App! 🎨\n\nYour image has been copied to clipboard - just paste (Ctrl+V) it into your tweet!"
        : "Check out my design created with OXYZ Media App! 🎨";

      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        tweetText
      )}`;

      // Open Twitter in a new window
      window.open(tweetUrl, "_blank");

      toast({
        title: "Ready to share!",
        description: copied
          ? "Your design is in your clipboard! Paste it into your tweet (Ctrl+V or Cmd+V)."
          : "Twitter opened in a new window. You might need to download and attach the image manually.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error sharing to Twitter:", error);
      toast({
        title: "Share failed",
        description:
          "There was an error preparing your design for sharing. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle resetting the canvas
  const handleReset = () => {
    // Confirm reset with the user
    if (
      window.confirm(
        "Are you sure you want to reset the canvas? This will clear all your changes."
      )
    ) {
      // Clear current design ID
      setCurrentDesignId(null);

      // Clear main image
      useImageStore.getState().clearMainImage();

      // Clear logos
      useImageStore.getState().clearLogos();

      // Reset filters
      useImageStore.getState().setFilter({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sepia: 0,
        opacity: 100,
      });

      // Clear text
      useDesignStore.getState().setTextOverlay({
        text: "",
        isVisible: false,
        color: "#000000",
        fontFamily: "Arial",
        fontSize: 24,
        isBold: false,
        isItalic: false,
        rotation: 0,
        spacing: 0,
        translationX: 0,
        translationY: 0,
        isSelected: false,
      });

      // Reset savedImageUrl state
      setSavedImageUrl(null);

      toast({
        title: "Reset complete",
        description: "Canvas has been reset to default state.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="my-4 hidden lg:block w-full">
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Button
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={handleReset}
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={isSaving || !imageUrl}
          >
            {isSaving || uploadImageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving || uploadImageMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={handleShare}
            disabled={
              isSharing ||
              isCopying ||
              uploadImageMutation.isPending ||
              !imageUrl
            }
          >
            {isSharing || isCopying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share className="w-4 h-4" />
            )}
            {isSharing ? "Sharing..." : isCopying ? "Copying..." : "Share"}
          </Button>
        </div>

        <div className="w-full flex justify-center">
          <AuthButton />
        </div>

        {/* Show success message with image thumbnail when saved */}
        {savedImageUrl && (
          <div className="mt-2 text-center">
            <p className="text-sm text-green-500 mb-1">
              Design saved to your library!
            </p>
            <div className="inline-block w-16 h-16 relative border border-gray-200 rounded overflow-hidden">
              <img
                src={savedImageUrl}
                alt="Saved design"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Show error message */}
        {uploadImageMutation.isError && (
          <div className="mt-2 text-center text-sm text-red-500">
            {uploadImageMutation.error instanceof Error
              ? uploadImageMutation.error.message
              : "Failed to save design"}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderControls;
