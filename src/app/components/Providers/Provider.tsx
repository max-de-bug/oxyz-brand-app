"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/app/store/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        enableColorScheme={true}
        defaultTheme="system"
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
