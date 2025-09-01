"use client";
import { useAuth } from "@/app/store/auth-context";
import {
  LogOut,
  User,
  Settings,
  Edit,
  Check,
  X,
  Loader2,
  ChevronDown,
  Share2,
  RotateCcw,
  Save,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  useUserProfile,
  useUpdateUsername,
  useDefaultUserImage,
  useUploadImage,
} from "@/lib/api/queries";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useImageStore } from "@/app/store/imageStore";
import { useFilterStore } from "@/app/store/filterStore";
import { useDesignStore } from "@/app/store/designStore";
import { captureVisibleCanvas } from "./exportControls";
import { ThemeToggle } from "../themeToggle";

const HeaderControls = () => {
  const { user, signOut, session } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Image and Design Store access for reset functionality
  const {
    reset: resetImageState,
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    images,
    logos,
    addImage,
    removeImage,
    updateImage,
    selectImage,
  } = useImageStore();
  const { textOverlays, deleteTextById, setTextOverlay, textOverlay } =
    useDesignStore();
  const setActiveFilter = useFilterStore((state) => state.setActiveFilter);
  const uploadImageMutation = useUploadImage();

  // Check if canvas is empty
  const canvasIsEmpty =
    images.length === 0 &&
    logos.length === 0 &&
    !textOverlay.isVisible &&
    textOverlays.length === 0;

  // Fetch user profile using React Query
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useUserProfile();

  // Fetch default user image
  const { data: defaultUserImage, isLoading: isLoadingDefaultImage } =
    useDefaultUserImage();

  // Use the update username mutation
  const updateUsernameMutation = useUpdateUsername();

  // Handle Reset button click
  const handleReset = () => {
    if (canvasIsEmpty) {
      toast({
        description: "Nothing to reset - canvas is already empty",
      });
      return;
    }

    if (window.confirm("Reset all changes? This cannot be undone.")) {
      resetImageState();

      toast({
        title: "Canvas Reset",
        description: "All changes have been reset.",
      });
    }
  };

  // Function to copy image to clipboard
  const copyImageToClipboard = async () => {
    if (canvasIsEmpty) {
      toast({
        variant: "destructive",
        title: "Nothing to copy",
        description: "Add an image or text to the canvas first.",
      });
      return false;
    }

    setIsCopying(true);
    try {
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
        });

        return true;
      } catch (clipboardError) {
        console.error("Clipboard API error:", clipboardError);

        // Fallback method - create a temporary link element
        const link = document.createElement("a");
        link.download = `oxyz-design-${Date.now()}.png`;
        link.href = capturedImage;
        link.click();

        toast({
          title: "Downloaded",
          description: "Design downloaded as an image file.",
        });
        return false;
      }
    } catch (error) {
      console.error("Error copying design to clipboard:", error);
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: "Could not share your design. Please try again.",
      });
      return false;
    } finally {
      setIsCopying(false);
    }
  };

  // Handle Save button click
  const handleSave = async () => {
    // Check if canvas is empty
    if (canvasIsEmpty) {
      toast({
        variant: "destructive",
        title: "Nothing to save",
        description: "Add an image or text to the canvas first.",
      });
      return;
    }

    // Check if user is authenticated
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save designs",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Capture canvas as image
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

      // Upload the image using the mutation - this will automatically set the image in the store
      await uploadImageMutation.mutateAsync(fileToUpload);

      // Show success message
      toast({
        title: "Success",
        description: "Design saved to your library!",
      });
    } catch (error) {
      console.error("Error saving design:", error);

      // Provide a more specific error message
      let errorMessage = "Failed to save design. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Share button click
  const handleShare = async () => {
    // Check if canvas is empty
    if (canvasIsEmpty) {
      toast({
        variant: "destructive",
        title: "Nothing to share",
        description: "Add an image or text to the canvas first.",
      });
      return;
    }

    try {
      setIsSharing(true);

      // First try to copy the image to clipboard
      const copied = await copyImageToClipboard();

      // Open Twitter compose window
      const tweetText = copied
        ? "Check out my design created with O.XYZ Designer! 🎨\n\nYour image has been copied to clipboard - just paste (Ctrl+V) it into your tweet!"
        : "Check out my design created with O.XYZ Designer! 🎨";

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
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    // Close on escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  // Get display name from user profile or fallback to email
  const getDisplayName = () => {
    if (userProfile?.name) return userProfile?.name;
    if (user?.email) return user.email.split("@")[0];
    return "Guest";
  };

  const displayName = getDisplayName();

  // Log the user profile data for debugging

  // Get profile image - prioritize user profile image, fall back to default
  const getProfileImage = () => {
    if (userProfile?.image) return userProfile?.image;
    if (defaultUserImage?.url) return defaultUserImage.url;
    return null;
  };

  const profileImage = getProfileImage();

  const startEditingUsername = () => {
    setNewUsername(displayName);
    setIsEditingUsername(true);
    setTimeout(() => {
      usernameInputRef.current?.focus();
      usernameInputRef.current?.select();
    }, 50);
  };

  const cancelEditingUsername = () => {
    setIsEditingUsername(false);
  };

  const saveUsername = async () => {
    if (!newUsername || newUsername.trim() === "") {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description: "Username cannot be empty.",
      });
      return;
    }

    if (newUsername && newUsername !== displayName) {
      try {
        await updateUsernameMutation.mutateAsync(newUsername);
        setIsEditingUsername(false);
        toast({
          title: "Username updated",
          description: "Your username has been successfully updated.",
        });
      } catch (error) {
        console.error("Failed to update username:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update your username. Please try again.",
        });
      }
    } else {
      setIsEditingUsername(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveUsername();
    } else if (e.key === "Escape") {
      cancelEditingUsername();
    }
  };

  // Get the first initial for the avatar
  const getInitial = () => {
    if (displayName && displayName.length > 0) {
      return displayName.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Render avatar content with proper loading states
  const renderAvatarContent = (size: "small" | "large") => {
    const isLoading = isLoadingProfile || isLoadingDefaultImage;

    if (isLoading) {
      return (
        <div className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center">
          <Loader2
            size={size === "small" ? 14 : 18}
            className="animate-spin text-white/80"
          />
        </div>
      );
    }

    if (profileImage) {
      return (
        <div className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center">
          {!isImageLoaded && (
            <span className="text-white font-medium">{getInitial()}</span>
          )}
          <Image
            src={profileImage}
            alt={displayName}
            fill
            sizes={size === "small" ? "30px" : "40px"}
            className="object-cover"
            priority={true}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(false)}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center">
        <span className="text-white font-medium">{getInitial()}</span>
      </div>
    );
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -5,
      scale: 0.98,
      transition: { duration: 0.15, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.98,
      transition: { duration: 0.15, ease: "easeInOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="top-0 z-10 w-full">
      {/* Top tier - User profile */}
      <div className="flex justify-between items-center px-6 py-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-100/50 dark:border-neutral-800/50 relative z-20">
        {/* Left side - Theme toggle */}
        <div></div>

        {/* Right side - User profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 group"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden ring-2 ring-white/10 dark:ring-black/10 group-hover:ring-white/20 dark:group-hover:ring-black/20 transition-all">
              {renderAvatarContent("small")}
            </div>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 max-w-[120px] truncate hidden sm:inline-block">
              {isLoadingProfile ? "Loading..." : displayName || "Guest"}
            </span>
            <ChevronDown
              size={14}
              className={`text-neutral-400 transition-transform duration-200 ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={dropdownVariants}
                className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                      {renderAvatarContent("large")}
                    </div>

                    {isEditingUsername ? (
                      <div className="flex flex-col gap-2 flex-grow">
                        <div className="relative">
                          <input
                            ref={usernameInputRef}
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 w-full pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
                            maxLength={20}
                            disabled={updateUsernameMutation.isPending}
                            placeholder="Enter username"
                            aria-label="Edit username"
                          />
                          {updateUsernameMutation.isPending && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <Loader2
                                size={16}
                                className="animate-spin text-neutral-400"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveUsername}
                            className="flex-1 text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            disabled={updateUsernameMutation.isPending}
                            aria-label="Save username"
                          >
                            <Check size={14} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEditingUsername}
                            className="flex-1 text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            disabled={updateUsernameMutation.isPending}
                            aria-label="Cancel editing"
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-200">
                            {isLoadingProfile ? "Loading..." : displayName}
                          </h3>
                          {user && !isLoadingProfile && (
                            <button
                              onClick={startEditingUsername}
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full p-1"
                              title="Edit username"
                              aria-label="Edit username"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                        </div>
                        {!isLoadingProfile && userProfile?.email && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {userProfile?.email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {isProfileError && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                      Error loading profile. Please refresh and try again.
                    </div>
                  )}
                </div>

                <motion.div
                  className="py-2"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  <motion.button
                    variants={itemVariants}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                    }}
                    aria-label="Settings"
                  >
                    <Settings size={16} className="text-neutral-500" />
                    <span>Settings</span>
                  </motion.button>

                  {user ? (
                    <motion.button
                      variants={itemVariants}
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                      aria-label="Sign out"
                    >
                      <LogOut size={16} className="text-neutral-500" />
                      <span>Sign Out</span>
                    </motion.button>
                  ) : (
                    <motion.div variants={itemVariants}>
                      <Link
                        href="/auth/sign-in"
                        className="block w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                        aria-label="Sign in"
                      >
                        <User size={16} className="text-neutral-500" />
                        <span>Sign In</span>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom tier - Action buttons */}
      <div className="flex justify-between items-center px-6 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 text-sm font-medium ${
              canvasIsEmpty
                ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-70"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
            aria-label="Reset all changes"
            title={canvasIsEmpty ? "Nothing to reset" : "Reset all changes"}
            disabled={canvasIsEmpty}
          >
            <RotateCcw
              size={16}
              className={
                canvasIsEmpty ? "text-neutral-400" : "text-neutral-500"
              }
            />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
              isSaving || canvasIsEmpty
                ? "opacity-70 cursor-not-allowed"
                : "hover:opacity-90"
            } 
            ${
              session && !canvasIsEmpty
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
            }`}
            aria-label="Save design"
            title={
              canvasIsEmpty
                ? "Nothing to save"
                : session
                ? "Save your design"
                : "Sign in to save"
            }
            disabled={isSaving || canvasIsEmpty}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
              isSharing || canvasIsEmpty
                ? "opacity-70 cursor-not-allowed bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                : "hover:opacity-90 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            }`}
            aria-label="Share design"
            title={canvasIsEmpty ? "Nothing to share" : "Download your design"}
            disabled={isSharing || canvasIsEmpty}
          >
            {isSharing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Share2 size={16} />
            )}
            <span className="hidden sm:inline">
              {isSharing ? "Sharing..." : "Share"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderControls;
