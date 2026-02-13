'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import ProfileMenu from './ProfileMenu';
import AuthModal from './AuthModal';
import WalletModal from './WalletModal';

export default function Navbar() {
  const { user, isAuthModalOpen, closeAuthModal, openAuthModal } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  // const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Removed local state

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all group-hover:scale-110 group-active:scale-95">
                <img
                  src="/logo.svg"
                  alt="AfriWager Logo"
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-sans group-hover:text-emerald-400 transition-colors">
                AfriWager
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/markets" className="text-slate-300 hover:text-white transition-colors font-medium">Markets</Link>
              <Link href="/activity" className="text-slate-300 hover:text-white transition-colors font-medium">Activity</Link>
              <Link href="/ranks" className="text-slate-300 hover:text-white transition-colors font-medium">Ranks</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Currency Toggle */}
              {/* Currency Toggle - Only visible when logged in */}
              {user && (
                <button
                  onClick={() => setCurrency(currency === 'USD' ? 'UGX' : 'USD')}
                  className="hidden md:flex items-center gap-2 rounded-lg bg-white/5 py-1.5 px-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <span className={currency === 'USD' ? 'text-emerald-500' : ''}>USD</span>
                  <span className="text-zinc-600">/</span>
                  <span className={currency === 'UGX' ? 'text-emerald-500' : ''}>UGX</span>
                </button>
              )}

              <div className="hidden md:block">
                {/* AfriVault Wallet Button - Only visible when logged in */}
                {user && (
                  <button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-white tracking-widest group-hover:text-emerald-400">
                      ${user.balance?.toFixed(2) || '0.00'}
                    </span>
                  </button>
                )}
              </div>

              {!user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openAuthModal}
                    className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <ProfileMenu />
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
