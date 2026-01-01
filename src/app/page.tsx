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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white selection:bg-emerald-500/30">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Logo Area */}
        <div className="relative h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl shadow-emerald-500/20">
          <img
            src="/app_icon_512.png"
            alt="AfriSights Logo"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
          AfriSights
        </h1>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-12">
        <div className="h-1 w-32 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-1/3 animate-[loading_2s_infinite]" />
        </div>
      </div>

      <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
    </div>
  );
}
