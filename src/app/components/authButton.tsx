"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "../store/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { useUpdateUsername, useUserProfile } from "@/lib/api/queries";

// Zod schema for username validation
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username can only contain letters, numbers, periods, underscores, and hyphens"
  );

export default function AuthButton() {
  const { user, defaultImage, signOut } = useAuth();
  const updateUsernameMutation = useUpdateUsername();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [validationError, setValidationError] = useState("");

  // Get current username from user profile or fallback to email
  const currentUsername = userProfile?.name || user?.email?.split("@")[0] || "";

  // Set initial value of newUsername when dialog opens
  useEffect(() => {
    if (isOpen && currentUsername) {
      setNewUsername(currentUsername);
    }
  }, [isOpen, currentUsername]);

  const handleSignIn = () => {
    router.push("/auth/sign-in");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    setValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    try {
      // Validate username
      const result = usernameSchema.safeParse(newUsername);
      if (!result.success) {
        setValidationError(result.error.errors[0].message);
        return;
      }

      // If username is the same as current, no need to update
      if (newUsername === currentUsername) {
        setValidationError("New username is the same as current one");
        return;
      }

      // Update the username in our database
      await updateUsernameMutation.mutateAsync(newUsername);

      // Show success toast
      toast({
        title: "Username updated",
        description: "Your username has been successfully updated",
        duration: 3000,
      });

      // Close dialog
      setIsOpen(false);
    } catch (err) {
      console.error("Error updating username:", err);
      setValidationError(
        err instanceof Error ? err.message : "An error occurred"
      );
    }
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={handleSignIn}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={userProfile?.image || defaultImage?.url || ""}
            alt={userProfile?.name || user.email || ""}
            onError={(e) => {
              // If user image fails to load, fall back to default image
              if (defaultImage?.url) {
                (e.target as HTMLImageElement).src = defaultImage.url;
              }
            }}
          />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden md:inline-block">
          {isProfileLoading ? "Loading..." : currentUsername || "User"}
        </span>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Update your username while keeping your email address the same.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current-username">Current Username</Label>
                <Input id="current-username" value={currentUsername} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-username">New Username</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={handleUsernameChange}
                  placeholder="Enter new username"
                  autoComplete="off"
                  autoFocus
                />
                {validationError && (
                  <p className="text-sm text-red-500">{validationError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Username must be 3-30 characters and can only contain letters,
                  numbers, periods, underscores, and hyphens.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateUsernameMutation.isPending ||
                  !newUsername ||
                  newUsername === currentUsername
                }
              >
                {updateUsernameMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Username"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
