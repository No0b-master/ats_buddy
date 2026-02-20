import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ATSCheck } from '@/components/tools/ATSCheck';
import { ResumeOptimizer } from '@/components/tools/ResumeOptimizer';
import { KeywordGap } from '@/components/tools/KeywordGap';
import { Button } from '@/components/ui/button';
import { LogOut, FileSearch2, Wand2, BarChart3, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UAEFlagStrip } from '@/components/UAEFlag';

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: 'ats',
    label: 'ATS Check',
    description: 'Score your resume against a job description for ATS compatibility.',
    icon: FileSearch2,
    badge: 'Popular',
  },
  {
    id: 'optimizer',
    label: 'Resume Optimizer',
    description: 'AI-powered rewrite tailored to UAE roles and emirates.',
    icon: Wand2,
    badge: 'AI',
  },
  {
    id: 'keyword-gap',
    label: 'Keyword Gap',
    description: 'Find missing keywords that recruiters and ATS systems look for.',
    icon: BarChart3,
    badge: null,
  },
] as const;

type ToolId = (typeof TOOLS)[number]['id'];

// ─── Tool card ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  tool: (typeof TOOLS)[number];
  active: boolean;
  onClick: () => void;
}

function ToolCard({ tool, active, onClick }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-xl border p-5 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-brand-lg'
          : 'border-border bg-card text-card-foreground shadow-brand-sm hover:border-primary/40 hover:shadow-brand-md'
      )}
    >
      {tool.badge && (
        <span
          className={cn(
            'absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-gold-muted text-accent-foreground'
          )}
        >
          {tool.badge}
        </span>
      )}
      <Icon
        className={cn(
          'mb-3 h-6 w-6 transition-colors',
          active ? 'text-primary-foreground' : 'text-primary'
        )}
      />
      <p className="font-semibold text-sm">{tool.label}</p>
      <p
        className={cn(
          'mt-1 text-xs leading-snug',
          active ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {tool.description}
      </p>
      {active && (
        <ChevronDown className="absolute bottom-3 right-3 h-4 w-4 text-primary-foreground/60" />
      )}
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolId>('ats');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const toggleTool = (id: ToolId) => {
    setActiveTool(id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm shadow-brand-sm">
        {/* UAE flag strip */}
        <UAEFlagStrip className="rounded-none h-1.5" />
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero shadow-brand-sm">
              <span className="text-sm font-bold text-primary-foreground">A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground leading-none">ATS Buddy</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-muted px-2 py-0.5 text-[10px] font-semibold text-accent-foreground uppercase tracking-wide">
                🇦🇪 UAE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Welcome */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Your Resume Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a tool below to optimize your job search in the UAE market.
          </p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up">
          {TOOLS.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              active={activeTool === tool.id}
              onClick={() => toggleTool(tool.id)}
            />
          ))}
        </div>

        {/* Active tool panel */}
        <div className="animate-fade-up rounded-2xl border border-border bg-card shadow-brand-md overflow-hidden">
          {/* Panel header */}
          <div className="border-b border-border bg-gradient-card px-6 py-4">
            {(() => {
              const tool = TOOLS.find(t => t.id === activeTool)!;
              const Icon = tool.icon;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{tool.label}</h2>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Panel content */}
          <div className="p-6">
            {activeTool === 'ats' && <ATSCheck />}
            {activeTool === 'optimizer' && <ResumeOptimizer />}
            {activeTool === 'keyword-gap' && <KeywordGap />}
          </div>
        </div>
      </main>
    </div>
  );
}
