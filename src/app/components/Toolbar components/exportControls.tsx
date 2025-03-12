"use client";

const ExportControls = () => {
  return (
    <div className="mt-4">
      <div className="block text-xs font-medium mb-2">Export:</div>
      <ul className="flex flex-wrap text-xs font-medium text-center text-gray-500 dark:text-gray-400 gap-2">
        <li className="flex-1">
          <a
            href="#"
            className="flex items-center justify-center w-full h-10 px-4 rounded-lg text-white bg-neutral-800 hover:bg-neutral-700"
            aria-current="page"
          >
            SVG
          </a>
        </li>
        <li className="flex-1">
          <a
            href="#"
            className="flex items-center justify-center w-full h-10 px-4 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            Video
          </a>
        </li>
        <li className="flex-1">
          <a
            href="#"
            className="flex items-center justify-center w-full h-10 px-4 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            PNG
          </a>
        </li>
        <li className="flex-1">
          <a
            href="#"
            className="flex items-center justify-center w-full h-10 px-4 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            GIF
          </a>
        </li>
      </ul>
      <div className="mt-4">
        <p className="text-xs mb-2">SVG Code:</p>
        <pre className="bg-white dark:bg-neutral-800 p-2 rounded-lg text-xs max-h-[10rem] text-left overflow-x-auto text-neutral-600 dark:text-neutral-400"></pre>
        <div className="mt-4 flex space-x-2 w-full justify-between">
          <button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center">
            Copy SVG
          </button>
          <button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 rounded-lg flex items-center">
            Download SVG{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportControls;
