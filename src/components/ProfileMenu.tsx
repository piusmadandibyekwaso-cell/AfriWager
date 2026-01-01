'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserAvatar from './Avatar';
import {
    Settings,
    Copy,
    Trophy,
    Coins,
    Hammer,
    LogOut,
    Moon,
    ExternalLink,
    ChevronRight,
    User
} from 'lucide-react';

export default function ProfileMenu() {
    const { logout, user } = usePrivy();
    const { profile } = useUserProfile();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const address = user?.wallet?.address;
    const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
    const username = profile?.username || 'User';

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            // Could add toast here
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#1C1C1E] border border-white/5 hover:bg-[#2C2C2E] transition-all group"
            >
                <UserAvatar
                    name={profile?.avatar_seed || address || 'user'}
                    size={28}
                    className="ring-2 ring-[#1C1C1E]"
                />
                <div className="flex flex-col text-right mr-1">
                    <span className="text-sm font-semibold text-white leading-none group-hover:text-emerald-400 transition-colors">
                        @{username}
                    </span>
                    <span className="text-[10px] text-zinc-500 leading-none mt-1 font-mono">
                        {shortAddress}
                    </span>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">

                    {/* Header */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <UserAvatar
                                name={profile?.avatar_seed || address || 'user'}
                                size={48}
                            />
                            <Link href="/settings" className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                <Settings className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">@{username}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500 font-mono">{address?.slice(0, 6)}...{address?.slice(-6)}</span>
                            <button onClick={copyAddress} className="text-zinc-500 hover:text-emerald-400 transition-colors">
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        <Link href="/ranks" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 rounded-xl transition-colors group">
                            <Trophy className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            Leaderboard
                        </Link>
                        <Link href="/rewards" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 rounded-xl transition-colors group">
                            <Coins className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                            Rewards
                        </Link>
                        <Link href="/builders" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 rounded-xl transition-colors group">
                            <Hammer className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                            Builders
                        </Link>
                    </div>

                    <div className="h-px bg-white/5 mx-4" />

                    {/* Footer Links */}
                    <div className="p-4 grid grid-cols-2 gap-y-2 text-xs text-zinc-500">
                        <Link href="/accuracy" className="hover:text-white transition-colors">Accuracy</Link>
                        <Link href="/support" className="hover:text-white transition-colors">Support</Link>
                        <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>

                    <div className="h-px bg-white/5 mx-4" />

                    {/* Logout */}
                    <div className="p-2">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
