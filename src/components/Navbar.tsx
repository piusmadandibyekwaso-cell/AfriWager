import { userService, UserProfile } from '@/services/userService';
import UserAvatar from './Avatar';
import OnboardingModal from './OnboardingModal';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const { profile, isLoading } = useUserProfile();

  return (
    <>
      <OnboardingModal />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all group-hover:scale-110 group-active:scale-95">
                <img
                  src="/app_icon_512.png"
                  alt="AfriSights Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-sans group-hover:text-emerald-400 transition-colors">
                AfriSights
              </span>
            </Link>

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
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <UserAvatar
                      name={profile?.avatar_seed || user?.wallet?.address || 'user'}
                      size={28}
                      className="ring-2 ring-black"
                    />
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-semibold text-white leading-none">
                        @{profile?.username || '...'}
                      </span>
                      <span className="text-[10px] text-zinc-500 leading-none mt-1">
                        {user?.wallet?.address?.slice(0, 4)}...{user?.wallet?.address?.slice(-4)}
                      </span>
                    </div>
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
    </>
  );
}
