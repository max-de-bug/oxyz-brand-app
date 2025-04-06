"use client";
import { SessionProvider } from "next-auth/react";
import MainComponent from "./components/mainComponent";
import { ThemeToggle } from "./components/themeToggle";
import { ThemeProvider } from "next-themes";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <>
      <main className="container mx-auto p-4">
        <MainComponent />
      </main>
    </>
  );
}
