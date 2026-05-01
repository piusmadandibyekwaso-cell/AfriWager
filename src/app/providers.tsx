'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
    mainnet,
    polygon,
    sepolia,
} from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { PrivyProvider } from '@privy-io/react-auth';

const config = getDefaultConfig({
    appName: 'AfriWager',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Reusing ID if available or fallback
    chains: [polygon, mainnet, sepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

    return (
        <PrivyProvider
            appId={privyAppId}
            config={{
                loginMethods: ['email', 'google'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#10b981',
                    logo: 'https://www.afriwager.com/logo_v3.png',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                    noPromptOnSignature: false // To ensure users see the gasless transaction being signed
                },
                defaultChain: polygon,
                supportedChains: [polygon]
            }}
        >
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider theme={darkTheme({
                        accentColor: '#10b981',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}>
                        <CurrencyProvider>
                            <AuthProvider>
                                {children}
                            </AuthProvider>
                        </CurrencyProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </PrivyProvider>
    );
}
