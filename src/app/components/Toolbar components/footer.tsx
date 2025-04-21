"use client";

// Custom Discord icon component
const DiscordIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
  </svg>
);

// Since Lucide doesn't have an X icon by default, we'll create a custom X icon component
const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium text-[#888888]">O.XYZ Designer</h2>
          <p className="text-[10px] text-[#555555] mt-1">Beta Version 1.0.0</p>
        </div>

        <div className="text-[10px] text-[#555555]">
          Created by{" "}
          <a
            href="https://x.com/CryptoMax_07"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#888888] hover:text-white transition-colors"
          >
            Connor
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://discord.com/invite/oxyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] hover:text-white transition-colors"
            aria-label="Discord"
          >
            <DiscordIcon />
          </a>
          <a
            href="https://x.com/o_fndn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] hover:text-white transition-colors"
            aria-label="X (formerly Twitter)"
          >
            <XIcon />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
