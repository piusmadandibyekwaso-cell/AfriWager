'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCcw, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function FundsPage() {
    const { address, isConnected } = useAccount();
    const { authenticated, login } = usePrivy();
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    // 1. Fetch Balance
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
        abi: MockUSDCABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: {
            enabled: !!address,
        }
    });

    // 2. Write Contracts (Mint & Withdraw)
    const { writeContract, data: hash, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleMint = () => {
        if (!address) return;
        writeContract({
            address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
            abi: MockUSDCABI.abi,
            functionName: 'mint',
            args: [address, parseUnits('1000', 6)], // Mint 1000 USDC
        });
    };

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawAddress || !withdrawAmount) return;
        writeContract({
            address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
            abi: MockUSDCABI.abi,
            functionName: 'transfer',
            args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount, 6)],
        });
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-80 text-center px-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <Wallet className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white">Manage Your Funds</h1>
                <p className="text-slate-400 max-w-md mb-8">
                    Please sign in to view your balance, deposit test funds, and withdraw your winnings.
                </p>
                <button
                    onClick={login}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                    Sign In to Access Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Wallet</h1>
                    <p className="text-slate-400">Manage your USDC funds on Sepolia Testnet</p>
                </div>
                <button
                    onClick={() => refetchBalance()}
                    className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/50"
                >
                    <RefreshCcw className={cn("w-5 h-5 text-slate-400", (isPending || isConfirming) && "animate-spin")} />
                </button>
            </div>

            {/* Balance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                    <p className="text-slate-400 mb-2 font-medium">Available Balance</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black text-white">
                            {balance ? Number(formatUnits(balance as bigint, 6)).toLocaleString() : '0.00'}
                        </h2>
                        <span className="text-xl font-bold text-emerald-500">USDC</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-slate-300 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-sm opacity-60">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    </div>
                    <p className="text-slate-400 text-sm">Sepolia Testnet Wallet Active</p>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Deposit Section */}
                <div className="space-y-6">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                <ArrowDownCircle className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Deposit</h3>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleMint}
                                disabled={isPending || isConfirming}
                                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
                            >
                                {isPending || isConfirming ? 'Processing Transaction...' : 'Get 1,000 Test USDC'}
                                <ArrowDownCircle className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                            </button>
                            <p className="text-xs text-slate-500 text-center">
                                This will mint free Test USDC directly to your wallet for testing purposes.
                            </p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800/50">
                            <div className="flex items-center justify-between opacity-50 gray-scale">
                                <span className="text-sm text-slate-400 font-medium">Fiat On-Ramp (Visa/Mobile Money)</span>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-full">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-rose-500/20 rounded-2xl">
                            <ArrowUpCircle className="w-6 h-6 text-rose-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Withdraw</h3>
                    </div>

                    <form onSubmit={handleWithdraw} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">Recipient Address</label>
                            <input
                                type="text"
                                placeholder="0x..."
                                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none rounded-2xl p-4 text-white font-mono text-sm transition-colors"
                                value={withdrawAddress}
                                onChange={(e) => setWithdrawAddress(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">Amount (USDC)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none rounded-2xl p-4 text-white transition-colors"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setWithdrawAmount(balance ? formatUnits(balance as bigint, 6) : '0')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500 hover:text-emerald-400"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || isConfirming || !withdrawAmount || !withdrawAddress}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
                        >
                            {isPending || isConfirming ? 'Confirming...' : 'Send Funds'}
                        </button>
                    </form>
                </div>
            </div>

            {hash && (
                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-slate-300">Transaction submitted!</span>
                    </div>
                    <a
                        href={`https://sepolia.etherscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-500 flex items-center gap-1 hover:underline"
                    >
                        View on Etherscan <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
