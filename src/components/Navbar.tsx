import React from 'react';
import { Wallet } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-emerald-500" />
            <span className="text-xl font-bold tracking-tight text-white">
              AFRISIGHTS
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Markets</a>
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Activity</a>
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Ranks</a>
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Learn</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors">
              <Wallet className="h-4 w-4" />
              Connect
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
