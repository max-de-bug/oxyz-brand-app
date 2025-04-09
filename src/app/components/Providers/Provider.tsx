"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/app/store/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            retry: 1,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          enableColorScheme={true}
          defaultTheme="system"
        >
          <Toaster />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
