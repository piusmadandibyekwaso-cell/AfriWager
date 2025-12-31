'use client';

import * as React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, http } from 'wagmi';
import { sepolia, mainnet, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from '@privy-io/wagmi';

const queryClient = new QueryClient();

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
                appearance: {
                    theme: 'dark',
                    accentColor: '#10b981',
                    showWalletLoginFirst: false,
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                loginMethods: ['email', 'wallet', 'google', 'passkey'],
                defaultChain: polygon,
                supportedChains: [sepolia, mainnet, polygon],
                fundingMethodConfig: {
                    moonpay: {
                        useSandbox: false, // Production Mode
                    },
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
