import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { PageView } from '../types';

interface NavbarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onScrollToSection }) => {
  const handleNavClick = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight flex items-center gap-1.5">
              Guardian
            </div>
            <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
              AI Payment Safety
            </div>
          </div>
        </button>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onNavigate('landing')}
            className="text-sm font-semibold text-violet-600 border-b-2 border-violet-600 pb-0.5"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('features')}
            className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('use-cases')}
            className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors cursor-pointer"
          >
            Use Cases
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
