import AuthButton from "./authButton";
import { ThemeToggle } from "./themeToggle";

const Navigation = () => {
  return (
    <nav className="container p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">O.XYZ Media Kit App</h1>
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navigation;
