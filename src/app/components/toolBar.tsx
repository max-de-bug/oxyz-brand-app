import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ToolBar = () => {
  return (
    <div className="px-4 max-w-4xl mx-auto lg: max-w-96 lg:h-screen lg:fixed lg:right-0 lg:top-0 lg:bg-neutral-200 lg:dark:bg-neutral-900 lg:overflow-y-auto">
      <div className="my-4 hidden lg:flex justify-between w-full">
        <div className="flex gap-2">
          <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 roounded=lg flex items-center">
            #
          </Button>
        </div>
        <div className="flex gap-2">
          <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-3 roounded=lg flex items-center">
            #
          </Button>
        </div>
      </div>
      <hr className="h-px border-0 bg-neutral-200 lg:bg-neutral-300 dark:bg-neutral-900 lg:dark:bg-neutral-800 hidden lg:block" />
      {/* colors bar */}
      <div className="grid gap-4">
        <Input
          type="color"
          className="w-full p-1 px-1 h-10 block bg-white border border-neutral-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"
          value="#000000"
        />
      </div>
    </div>
  );
};

export default ToolBar;
