"use client";

import ModularCanvas from "./canvas/ModularCanvas";
import ToolBar from "./toolBar";

const MainComponent = () => {
  return (
    <main className="container mx-auto p-4 min-h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 h-full">
        <div className="lg:flex-1 mb-8 lg:mb-0">
          <ModularCanvas />
        </div>
        <div className="lg:w-96 flex-shrink-0">
          <ToolBar />
        </div>
      </div>
    </main>
  );
};

export default MainComponent;
