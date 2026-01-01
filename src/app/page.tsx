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
      {/* Pulsing Logo Only - Cropped via CSS */}
      <div className="relative h-24 w-24 md:h-32 md:w-32 animate-pulse overflow-hidden rounded-[2.5rem]">
        <img
          src="/app_icon_512.png"
          alt="AfriSights Logo"
          className="h-full w-full object-cover scale-125"
        />
      </div>
    </div>
  );
}
