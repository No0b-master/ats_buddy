import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UAEFlagStrip } from '@/components/UAEFlag';
import { GoogleAuthCard } from '@/components/GoogleAuthCard';

const FEATURES = [
  {
    title: 'ATS Check',
    detail:
      'Upload your resume text and compare it against a job description with a clear ATS compatibility score and recommendations.',
  },
  {
    title: 'Resume Optimizer',
    detail:
      'Generate AI-assisted resume improvements tailored to UAE market expectations, role context, and hiring language.',
  },
  {
    title: 'Keyword Gap Analysis',
    detail:
      'Identify missing high-priority keywords from job ads so your profile aligns better with recruiter and ATS screening.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm shadow-brand-sm">
        <UAEFlagStrip className="rounded-none h-1.5" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-5 py-3">
          <div className="flex items-center gap-3">
            <img src="/taleef_logo.png" alt="Taleef Technologies logo" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground leading-none">ATS Buddy</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-muted px-2 py-0.5 text-[10px] font-semibold text-accent-foreground uppercase tracking-wide">
                  🇦🇪 UAE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">by Taleef Technologies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="brand">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-3 sm:px-5 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-light">Taleef Technologies Platform</p>
          <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-5xl">
            Professional ATS and Resume Intelligence for the UAE Job Market
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            ATS Buddy helps candidates optimize resumes, close keyword gaps, and improve interview readiness with practical, data-backed feedback tailored for UAE hiring standards.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-brand-sm">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Integrated resume tools</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-brand-sm">
              <p className="text-2xl font-bold text-foreground">Google</p>
              <p className="text-xs text-muted-foreground">Secure single sign-on only</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-brand-sm">
              <p className="text-2xl font-bold text-foreground">UAE</p>
              <p className="text-xs text-muted-foreground">Localized role-focused guidance</p>
            </div>
          </div>

          <div className="space-y-3">
            {FEATURES.map(feature => (
              <article key={feature.title} className="rounded-xl border border-border bg-card p-5 shadow-brand-sm">
                <h2 className="text-base font-semibold text-foreground">{feature.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4 lg:pt-12">
          <GoogleAuthCard />
          <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-brand-sm">
            <h3 className="text-sm font-semibold text-foreground">How it works</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Sign in securely with your Google account.</li>
              <li>2. Open the dashboard and choose your resume tool.</li>
              <li>3. Paste resume/job content and get actionable guidance instantly.</li>
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}
