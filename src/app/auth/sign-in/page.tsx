"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useAuth } from "@/app/store/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Zod schema for form validation
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();
  const { signInWithMagicLink, isLoading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      console.error("Error sending magic link:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!emailSent ? (
            <motion.div
              key="sign-in-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Sign in to your account using your email
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
                  >
                    {error.message}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Sending link..." : "Send magic link"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Check your inbox
                </h2>

                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300">
                    We've sent a magic link to
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {email}
                  </p>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  Click the link in the email to sign in to your account. If you
                  don't see it, check your spam folder.
                </p>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Use a different email
                  </Button>

                  <a
                    href={`https://${email.split("@")[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Open email provider →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
