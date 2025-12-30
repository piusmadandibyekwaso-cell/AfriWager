import React from 'react';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();

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
            <Link href="/markets" className="text-slate-300 hover:text-white transition-colors">Markets</Link>
            <Link href="/activity" className="text-slate-300 hover:text-white transition-colors">Activity</Link>
            <Link href="/ranks" className="text-slate-300 hover:text-white transition-colors">Ranks</Link>
            {authenticated && (
              <Link href="/funds" className="text-slate-300 hover:text-white transition-colors">Wallet</Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!authenticated ? (
              <button
                onClick={login}
                className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition-all"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <User className="h-4 w-4" />
                  <span>{user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)}</span>
                </div>
                <button
                  onClick={logout}
                  className="rounded-full bg-white/5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
