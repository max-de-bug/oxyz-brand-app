"use client";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import AuthButton from "../authButton";

const HeaderControls = () => {
  return (
    <div className="my-4 hidden lg:block w-full">
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-6 py-3 rounded-lg">
            Save
          </Button>
          <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-6 py-3 rounded-lg">
            Share
          </Button>
        </div>

        <div className="w-full flex justify-center">
          <AuthButton />
        </div>
      </div>
    </div>
  );
};

export default HeaderControls;
