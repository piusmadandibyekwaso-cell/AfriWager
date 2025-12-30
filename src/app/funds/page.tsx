'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import MockUSDCABI from '@/abis/MockERC20.json';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCcw, ExternalLink, CreditCard, Building2, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type DepositStep = 'selection' | 'details' | 'confirm' | 'processing' | 'success';
type DepositMethod = 'card' | 'bank' | 'crypto';

export default function FundsPage() {
    const { address, isConnected } = useAccount();
    const { authenticated, login } = usePrivy();

    // UI State
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositStep, setDepositStep] = useState<DepositStep>('selection');
    const [depositMethod, setDepositMethod] = useState<DepositMethod>('card');
    const [depositAmount, setDepositAmount] = useState('1000');

    // 1. Fetch Balances
    const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
        address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
        abi: MockUSDCABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: {
            enabled: !!address,
        }
    });

    const { data: ethBalance } = useBalance({
        address: address,
    });

    // 2. Write Contracts (Mint & Withdraw)
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Auto-advance to processing/success
    useEffect(() => {
        if (hash) setDepositStep('processing');
        if (isSuccess) {
            setDepositStep('success');
            refetchUSDC();
        }
    }, [hash, isSuccess, refetchUSDC]);

    const handleMint = () => {
        if (!address) return;
        writeContract({
            address: CONTRACT_ADDRESSES.usdc as `0x${string}`,
            abi: MockUSDCABI.abi,
            functionName: 'mint',
            args: [address, parseUnits(depositAmount, 6)],
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

    const resetDeposit = () => {
        setIsDepositModalOpen(false);
        setDepositStep('selection');
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
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
        <div className="max-w-4xl mx-auto px-4 py-12 relative min-h-screen">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Wallet</h1>
                    <p className="text-slate-400">Manage your USDC funds on Sepolia Testnet</p>
                </div>
                <button
                    onClick={() => {
                        refetchUSDC();
                    }}
                    className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/50"
                >
                    <RefreshCcw className={cn("w-5 h-5 text-slate-400", (isPending || isConfirming) && "animate-spin")} />
                </button>
            </div>

            {/* Gas Warning */}
            {ethBalance && ethBalance.value === 0n && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-amber-500 font-bold text-sm">Action Required: No Gas</h4>
                        <p className="text-slate-400 text-xs mt-1">
                            Your wallet needs a small amount of Sepolia ETH to pay for transaction fees.
                            <a href="https://sepoliafaucet.com/" target="_blank" className="text-amber-500 hover:underline ml-1 font-bold">Get free Gas here →</a>
                        </p>
                    </div>
                </div>
            )}

            {/* Balance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
                    <p className="text-slate-400 mb-2 font-medium">Available Balance</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black text-white">
                            {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
                        </h2>
                        <span className="text-xl font-bold text-emerald-500">USDC</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Connected to Sepolia Testnet</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col justify-center shadow-xl">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono text-sm opacity-60">
                                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
                            </span>
                        </div>
                        {address && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(address);
                                    alert('Address copied to clipboard!');
                                }}
                                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                            >
                                COPY FULL
                            </button>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm">Privy Secure Embedded Wallet</p>
                </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* DEPOSIT ACTION CARD */}
                <div
                    onClick={() => setIsDepositModalOpen(true)}
                    className="group bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 transition-all cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                    </div>

                    <div className="p-3 bg-indigo-500/20 rounded-2xl w-fit mb-6">
                        <ArrowDownCircle className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Deposit Funds</h3>
                    <p className="text-slate-400 text-sm mb-6">Add USDC to your wallet via Card, Bank Transfer, or Crypto.</p>

                    <div className="flex items-center text-indigo-400 font-bold text-sm gap-2 mt-auto">
                        Start Deposit <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* WITHDRAW ACTION CARD */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl">
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
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-slate-400">Amount (USDC)</label>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawAmount(usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0')}
                                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400"
                                >
                                    MAX
                                </button>
                            </div>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none rounded-2xl p-4 text-white transition-colors"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || isConfirming || !withdrawAmount || !withdrawAddress}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
                        >
                            {isPending || isConfirming ? 'Processing Transaction...' : 'Confirm Withdrawal'}
                        </button>
                    </form>
                </div>
            </div>

            {/* DEPOSIT MODAL (The Banking Experience) */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Deposit USDC</h3>
                            <button
                                onClick={resetDeposit}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <AlertCircle className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-8">
                            {/* STEP 1: Method Selection */}
                            {depositStep === 'selection' && (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm mb-6 text-center">Select your preferred deposit method</p>

                                    <button
                                        onClick={() => { setDepositMethod('card'); setDepositStep('details'); }}
                                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500/20 rounded-xl"><CreditCard className="w-5 h-5 text-indigo-400" /></div>
                                            <div className="text-left">
                                                <div className="font-bold text-white">Credit / Debit Card</div>
                                                <div className="text-xs text-slate-500 italic">Visa, Mastercard, Maestro</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => { setDepositMethod('bank'); setDepositStep('details'); }}
                                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-500/20 rounded-xl"><Building2 className="w-5 h-5 text-emerald-400" /></div>
                                            <div className="text-left">
                                                <div className="font-bold text-white">Bank Transfer</div>
                                                <div className="text-xs text-slate-500 italic">SWIFT, SEPA, Mobile Money</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                    </button>

                                    <div className="mt-8 text-center bg-slate-800/30 p-4 rounded-xl">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Powered by Secure Afrisights Bridge</p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Details Flow */}
                            {depositStep === 'details' && (
                                <div className="space-y-6">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Amount to fund</label>
                                        <span className="text-indigo-400 text-xs font-mono uppercase">Sepolia Testnet</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-2xl p-5 text-3xl font-black text-white outline-none transition-all"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-600">USDC</span>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-slate-400">Payment Channel</span>
                                                <span className="text-white font-bold capitalize">{depositMethod}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Account ID</span>
                                                <span className="text-white font-mono">{address?.slice(0, 4)}...{address?.slice(-4)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setDepositStep('confirm')}
                                            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            Continue to {depositMethod === 'card' ? 'Card Details' : 'Bank Confirmation'}
                                        </button>
                                        <button
                                            onClick={() => setDepositStep('selection')}
                                            className="w-full text-slate-500 hover:text-white text-sm transition-colors py-2"
                                        >
                                            Change Method
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Confirm Flow (Mocking Account Details) */}
                            {depositStep === 'confirm' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-950 rounded-2xl border-2 border-indigo-500/50 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-8">
                                                <CreditCard className="w-10 h-10 text-white/50" />
                                                <span className="text-xs text-indigo-400 font-black tracking-widest uppercase">Afrisights Checkout</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-white font-mono text-lg tracking-wider">**** **** **** 4242</div>
                                                <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                    <div>Card Holder</div>
                                                    <div>Expires</div>
                                                </div>
                                                <div className="flex justify-between text-sm text-white font-bold">
                                                    <div>AFRISIGHTS TESTER</div>
                                                    <div>12 / 28</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                        <p className="text-[10px] text-amber-500 font-bold uppercase leading-tight">
                                            Notice: This is a Testnet deployment. Clicking "Complete Purchase" will process this as a free test transaction on Sepolia.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleMint}
                                        disabled={isPending || isConfirming}
                                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {isPending || isConfirming ? 'Processing Securely...' : 'Complete Deposit'}
                                    </button>
                                    <button
                                        onClick={() => setDepositStep('details')}
                                        className="w-full text-slate-500 hover:text-white text-sm transition-colors py-2"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            )}

                            {/* STEP 4: Processing Flow */}
                            {depositStep === 'processing' && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <div className="relative w-24 h-24 mb-6">
                                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Processing Securely</h4>
                                    <p className="text-slate-500 text-sm max-w-[200px]">We are updating your balance on the blockchain network...</p>

                                    {hash && (
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${hash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-6 text-xs text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            View Progress on Etherscan <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* STEP 5: Success Flow */}
                            {depositStep === 'success' && (
                                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-2">Deposit Successful!</h4>
                                    <p className="text-slate-400 text-sm mb-8">
                                        Your account has been credited with {Number(depositAmount).toLocaleString()} USDC.
                                    </p>
                                    <button
                                        onClick={resetDeposit}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all"
                                    >
                                        Back to Wallet
                                    </button>
                                </div>
                            )}

                            {/* Error Handling */}
                            {writeError && depositStep !== 'selection' && (
                                <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                    <p className="text-[10px] text-rose-500 font-bold uppercase mb-1">Transaction Failed</p>
                                    <p className="text-rose-200 text-xs leading-tight">
                                        {writeError.message.includes('insufficient funds')
                                            ? "Insufficient Sepolia ETH for gas. Please check the gas warning below."
                                            : "Something went wrong. Please try again."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
