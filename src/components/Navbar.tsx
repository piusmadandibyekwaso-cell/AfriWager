import { userService, UserProfile } from '@/services/userService';
import ProfileMenu from './ProfileMenu';

export default function Navbar() {
  const { login, authenticated } = usePrivy();

  return (
    <>
      <OnboardingModal />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all group-hover:scale-110 group-active:scale-95">
                <img
                  src="/app_icon_512.png"
                  alt="AfriSights Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-sans group-hover:text-emerald-400 transition-colors">
                AfriSights
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/markets" className="text-slate-300 hover:text-white transition-colors font-medium">Markets</Link>
              <Link href="/activity" className="text-slate-300 hover:text-white transition-colors font-medium">Activity</Link>
              <Link href="/ranks" className="text-slate-300 hover:text-white transition-colors font-medium">Ranks</Link>
              {/* Wallet link removed in favor of Menu */}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {!authenticated ? (
                <button
                  onClick={login}
                  className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                >
                  Sign In
                </button>
              ) : (
                <ProfileMenu />
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
