import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn('h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground', className)}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  );
}

// ─── ResultBlock ──────────────────────────────────────────────────────────────

interface ResultBlockProps {
  label?: string;
  children: React.ReactNode;
  copyText?: string;
  className?: string;
}

export function ResultBlock({ label, children, copyText, className }: ResultBlockProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card shadow-brand-sm overflow-hidden', className)}>
      {(label || copyText) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-secondary/40">
          {label && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          )}
          {copyText && <CopyButton text={copyText} />}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  value: number; // 0–100
}

export function ScoreBar({ label, value }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped >= 70
      ? 'bg-green-500'
      : clamped >= 40
      ? 'bg-amber-400'
      : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="font-semibold text-foreground">{clamped}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ─── Keyword chips ────────────────────────────────────────────────────────────

interface KeywordChipsProps {
  keywords: string[];
  variant?: 'matched' | 'missing' | 'priority' | 'neutral';
}

const chipStyles = {
  matched: 'bg-green-50 text-green-700 border border-green-200',
  missing: 'bg-red-50 text-red-700 border border-red-200',
  priority: 'bg-amber-50 text-amber-700 border border-amber-200',
  neutral: 'bg-secondary text-secondary-foreground border border-border',
};

export function KeywordChips({ keywords, variant = 'neutral' }: KeywordChipsProps) {
  if (!keywords.length) {
    return <p className="text-sm text-muted-foreground italic">None found</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map(kw => (
        <span key={kw} className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', chipStyles[variant])}>
          {kw}
        </span>
      ))}
    </div>
  );
}

// ─── BulletList ───────────────────────────────────────────────────────────────

export function BulletList({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground italic">None</p>;
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            {i + 1}
          </span>
          <span className="text-foreground leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}
