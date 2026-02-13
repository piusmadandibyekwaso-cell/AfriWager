'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Wait 2 seconds then redirect
    const timer = setTimeout(() => {
      router.push('/markets');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      {/* Pulsing Logo - Transparent Bent Green Bars */}
      <div className="relative h-32 w-32 animate-pulse">
        <img
          src="/logo_final.svg"
          alt="AfriWager Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
