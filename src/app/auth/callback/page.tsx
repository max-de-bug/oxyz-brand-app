"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/";

      if (!code) {
        setError("No authentication code found");
        return;
      }

      try {
        // Start progress animation
        setProgress(20);

        // Exchange code for session
        await supabase.auth.exchangeCodeForSession(code);
        setProgress(60);

        // Simulate a bit more progress while session is being established
        setTimeout(() => setProgress(80), 200);

        // Final redirect with a slight delay for smooth transition
        setTimeout(() => {
          setProgress(100);
          router.push(next);
        }, 500);
      } catch (err) {
        console.error("Error exchanging code for session:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => {
          router.push("/auth/sign-in?error=callback-failed");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {error ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Authentication Error
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="mt-4 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-gray-900 dark:text-gray-100" />
              {/* Progress circle */}
              {/* <div className="absolute inset-0">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-600 dark:text-blue-500 transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (progress / 100) * 264}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>
              </div> */}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Completing Your Sign In
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {progress < 30
                  ? "Verifying your credentials..."
                  : progress < 60
                  ? "Setting up your session..."
                  : progress < 90
                  ? "Almost there..."
                  : "Redirecting you..."}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-400 dark:text-gray-500">
              This will only take a moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
