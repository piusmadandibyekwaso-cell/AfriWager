'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Wait 3 seconds then redirect
    const timer = setTimeout(() => {
      router.push('/markets');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      {/* Pulsing Logo Only */}
      <div className="relative h-32 w-32 md:h-40 md:w-40 animate-pulse">
        <img
          src="/app_icon_512.png"
          alt="AfriSights Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
