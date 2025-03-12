"use client";

import ImageRender from "./imageRender";
import ToolBar from "./toolBar";

const MainComponent = () => {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center">
        <ToolBar />
        <ImageRender />
      </div>
    </main>
  );
};

export default MainComponent;
