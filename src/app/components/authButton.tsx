"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "../store/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function AuthButton() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/auth/sign-in");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
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
          <AvatarImage src={user.image || ""} alt={user.name || user.email} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden md:inline-block">
          {user.name || user.email}
        </span>
      </div>
      <Button variant="destructive" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
