'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserAvatar from '@/components/Avatar';
import {
    User,
    Wallet,
    BarChart2,
    Bell,
    Code,
    Key,
    Upload,
    ChevronRight
} from 'lucide-react';

type SettingsTab = 'Profile' | 'Account' | 'Trading' | 'Notifications' | 'Builder Codes' | 'Export Private Key';

export default function SettingsPage() {
    const { user } = usePrivy();
    const { profile } = useUserProfile();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');

    const address = user?.wallet?.address;
    const username = profile?.username || 'User';
    const email = user?.email?.address || ''; // Privy email if available

    const sidebarItems: { name: SettingsTab; icon: any }[] = [
        { name: 'Profile', icon: User },
        { name: 'Account', icon: Wallet },
        { name: 'Trading', icon: BarChart2 },
        { name: 'Notifications', icon: Bell },
        { name: 'Builder Codes', icon: Code },
        { name: 'Export Private Key', icon: Key },
    ];

    return (
        <div className="min-h-screen bg-black text-white pt-20 pb-12">
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Sidebar */}
                <div className="md:col-span-1">
                    <nav className="flex flex-col space-y-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.name
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${activeTab === item.name ? 'text-emerald-400' : ''}`} />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <h1 className="text-2xl font-bold mb-8">{activeTab === 'Profile' ? 'Profile Settings' : activeTab}</h1>

                    {activeTab === 'Profile' && (
                        <div className="space-y-8 animate-in fade-in duration-300">

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <UserAvatar
                                    name={profile?.avatar_seed || address || 'user'}
                                    size={80}
                                    className="ring-4 ring-[#1C1C1E]"
                                />
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#2C2C2E] transition-colors">
                                    <Upload className="w-4 h-4 text-zinc-400" />
                                    Upload
                                </button>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email || 'madandipiusb@gmail.com'} // Placeholder based on screenshot
                                        disabled
                                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
                                    <input
                                        type="text"
                                        defaultValue={username}
                                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                    <p className="mt-2 text-xs text-zinc-500 font-mono">
                                        {address}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Tell us about yourself"
                                        defaultValue="Bio"
                                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholders for other tabs */}
                    {activeTab !== 'Profile' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] border border-white/5 rounded-2xl">
                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                {activeTab === 'Account' && <Wallet className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Trading' && <BarChart2 className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Notifications' && <Bell className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Builder Codes' && <Code className="w-8 h-8 text-zinc-500" />}
                                {activeTab === 'Export Private Key' && <Key className="w-8 h-8 text-zinc-500" />}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{activeTab} Settings</h3>
                            <p className="text-zinc-500 text-sm">This section is coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
