"use client";
import { Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium text-[#888888]">
            O.XYZ Media Kit Builder
          </h2>
          <p className="text-[10px] text-[#555555] mt-1">Version 1.0.0</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <Twitter size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
