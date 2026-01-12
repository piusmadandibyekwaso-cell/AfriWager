import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'UGX';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    exchangeRate: number; // 1 USD = X UGX
    formatAmount: (amountUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('USD');
    // Hardcoded for sandbox, in production fetch from API
    const exchangeRate = 3850;

    const formatAmount = (amountUSD: number) => {
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amountUSD);
        } else {
            return new Intl.NumberFormat('en-UG', {
                style: 'currency',
                currency: 'UGX',
                maximumFractionDigits: 0,
            }).format(amountUSD * exchangeRate);
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatAmount }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
