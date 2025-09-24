import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 text-slate-400">
      <div className="container mx-auto px-6 max-w-7xl py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="font-serif text-[18px] text-[var(--accent-gold)]">Kanun AI</div>
          <div className="text-sm text-slate-400">Indian legal intelligence</div>
        </div>

        <nav className="flex gap-5">
          <a href="/privacy" className="text-sm hover:text-white transition-colors">Privacy</a>
          <a href="/terms" className="text-sm hover:text-white transition-colors">Terms</a>
          <a href="/contact" className="text-sm hover:text-white transition-colors">Contact</a>
        </nav>

        <div className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Kanun AI
        </div>
      </div>
    </footer>
  );
};

export default Footer;
