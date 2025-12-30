'use client';

import * as React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig as createPrivyConfig } from '@privy-io/wagmi';

const queryClient = new QueryClient();

// Wagmi config for Privy
const wagmiConfig = createConfig({
    chains: [sepolia, mainnet, polygon],
    transports: {
        [sepolia.id]: http(),
        [mainnet.id]: http(),
        [polygon.id]: http(),
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    return (
        <PrivyProvider
            appId={appId}
            config={{
                // Customize Privy's appearance in your dashboard
                appearance: {
                    theme: 'dark',
                    accentColor: '#10b981', // emerald-500
                    showWalletLoginFirst: false,
                },
                // Create embedded wallets for users who login with email or social
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                loginMethods: ['email', 'wallet', 'google'],
                defaultChain: sepolia,
                supportedChains: [sepolia, mainnet, polygon],
            }}
        >
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </WagmiProvider>
        </PrivyProvider>
    );
}
