import { ThemeToggle } from '@/components/ThemeToggle';
import { UAEFlagStrip } from '@/components/UAEFlag';
import { GoogleAuthCard } from '@/components/GoogleAuthCard';

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-hero text-primary-foreground relative overflow-hidden">
      <UAEFlagStrip className="absolute top-0 left-0 right-0 w-full rounded-none h-2" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[hsl(145_63%_32%/0.15)]" />
        <div className="absolute bottom-10 -left-10 h-40 w-40 rounded-full bg-[hsl(0_84%_40%/0.12)]" />
      </div>

      <div className="relative flex items-center gap-3">
        <img src="/taleef_logo.png" alt="Taleef Technologies logo" className="h-12 w-12 rounded-xl object-contain bg-white/90 p-1" />
        <div>
          <span className="text-lg font-semibold tracking-tight">ATS Buddy</span>
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold tracking-widest opacity-90">
            🇦🇪 UAE
          </span>
          <p className="text-[11px] opacity-80 mt-0.5">by Taleef Technologies</p>
        </div>
      </div>

      <div className="relative space-y-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-light opacity-80">
            Secure Google Sign-In
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Access your resume toolkit with{' '}
            <span className="text-gradient-gold">Google authentication</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed opacity-80">
            ATS Buddy uses Google sign-up and sign-in only, giving you a secure and faster access experience.
          </p>
        </div>

        <UAEFlagStrip className="h-1 opacity-60" />
      </div>

      <p className="relative text-xs opacity-50">
        © {new Date().getFullYear()} ATS Buddy UAE by Taleef Technologies. All rights reserved.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="relative flex flex-col items-center justify-center px-4 sm:px-6 py-12 bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <UAEFlagStrip className="absolute top-0 left-0 right-0 w-full rounded-none" />

        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/taleef_logo.png" alt="Taleef Technologies logo" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <span className="text-base font-semibold text-foreground">ATS Buddy 🇦🇪 UAE</span>
            <p className="text-[11px] text-muted-foreground">by Taleef Technologies</p>
          </div>
        </div>

        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Continue with Google</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manual email/password login has been removed. Use your Google account to access ATS Buddy.
            </p>
          </div>

          <GoogleAuthCard className="mb-0" />
        </div>
      </div>
    </div>
  );
}
