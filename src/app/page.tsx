import MainComponent from "./components/mainComponent";
import Navigation from "./components/navigation";
import { ThemeToggle } from "./components/themeToggle";
import { ThemeProvider } from "next-themes";
export default function Home() {
  return (
    <ThemeProvider attribute="class">
      <main className="container mx-auto p-4">
        <Navigation />
        <MainComponent />
      </main>
    </ThemeProvider>
  );
}
