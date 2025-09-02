"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useAuth } from "@/app/store/auth-context";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mail,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Zod schema for form validation
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();
  const { signInWithMagicLink, error } = useAuth();

  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      console.error("Error sending magic link:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#070707] to-[#1a1a1a] p-4">
      {/* Bacground decorative elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-md mb-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center text-[#888] hover:text-white transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo or brand */}
        <div className="flex justify-center mb-8">
          <div className="text-xl font-semibold">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              O.XYZ DESIGNER
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!emailSent ? (
            <motion.div
              key="sign-in-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111]/60 backdrop-blur-md border border-[#333333] p-8 rounded-lg"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                <p className="text-[#888888] mt-2 text-center">
                  Sign in to your account using your email
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-[#cccccc] block"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#171717] border border-[#333333] rounded-md text-white placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error.message}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-md flex items-center justify-center font-medium transition-all ${
                    isSubmitting || !email
                      ? "bg-[#333333] text-[#888888] cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                  }`}
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Sending link..." : "Send Magic Link"}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111]/60 backdrop-blur-md border border-[#333333] p-8 rounded-lg"
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
                  className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-white">
                  Check Your Inbox
                </h2>

                <div className="space-y-2">
                  <p className="text-[#cccccc]">We've sent a magic link to</p>
                  <p className="font-medium text-white">{email}</p>
                </div>

                <p className="text-sm text-[#888888] max-w-sm">
                  Click the link in the email to sign in to your account. If you
                  don't see it, check your spam folder.
                </p>

                <div className="pt-4 space-y-3 w-full">
                  <button
                    onClick={() => setEmailSent(false)}
                    className="w-full py-3 px-4 rounded-md border border-[#333333] bg-transparent text-white hover:bg-[#222222] transition-colors"
                  >
                    Use a different email
                  </button>

                  <a
                    href={`https://${email.split("@")[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Open email provider →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-[#888888]">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-[#555555] z-10">
        © {new Date().getFullYear()} O.XYZ Designer. All rights reserved.
      </div>
    </div>
  );
}
