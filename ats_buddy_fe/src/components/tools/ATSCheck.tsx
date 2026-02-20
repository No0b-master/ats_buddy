import { useState } from 'react';
import { api, type ATSCheckResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResultBlock, ScoreBar, KeywordChips, BulletList } from '@/components/ResultComponents';
import { cn } from '@/lib/utils';

// ─── Score circle ──────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 70 ? 'text-green-500' : clamped >= 40 ? 'text-amber-500' : 'text-red-500';
  const label =
    clamped >= 70 ? 'Great' : clamped >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-2">
      <div
        className={cn(
          'flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 bg-card shadow-brand-md',
          clamped >= 70
            ? 'border-green-400'
            : clamped >= 40
            ? 'border-amber-400'
            : 'border-red-400'
        )}
      >
        <span className={cn('text-3xl font-bold', color)}>{clamped}</span>
        <span className="text-xs font-medium text-muted-foreground">/ 100</span>
      </div>
      <span className={cn('text-sm font-semibold', color)}>{label}</span>
    </div>
  );
}

// ─── Results view ──────────────────────────────────────────────────────────────

function ATSResults({ result }: { result: ATSCheckResult }) {
  const breakdown = result.breakdown ?? result.score_breakdown ?? {};
  const matched = result.matched_keywords ?? [];
  const missing = result.missing_keywords ?? [];
  const gaps = result.section_gaps ?? [];
  const recs = result.recommendations ?? [];

  const summaryText = [
    `ATS Overall Score: ${result.overall_score}/100`,
    '',
    'Matched Keywords: ' + matched.join(', '),
    'Missing Keywords: ' + missing.join(', '),
    '',
    'Section Gaps: ' + gaps.join(', '),
    '',
    'Recommendations:',
    ...recs.map((r, i) => `${i + 1}. ${r}`),
  ].join('\n');

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Score */}
      <ResultBlock label="Overall ATS Score">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreCircle score={result.overall_score} />
          {Object.keys(breakdown).length > 0 && (
            <div className="flex-1 w-full space-y-3">
              {Object.entries(breakdown).map(([key, val]) => (
                <ScoreBar key={key} label={key} value={val} />
              ))}
            </div>
          )}
        </div>
      </ResultBlock>

      {/* Keywords */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ResultBlock label={`Matched Keywords (${matched.length})`} copyText={matched.join(', ')}>
          <KeywordChips keywords={matched} variant="matched" />
        </ResultBlock>
        <ResultBlock label={`Missing Keywords (${missing.length})`} copyText={missing.join(', ')}>
          <KeywordChips keywords={missing} variant="missing" />
        </ResultBlock>
      </div>

      {/* Gaps & Recommendations */}
      {gaps.length > 0 && (
        <ResultBlock label="Section Gaps" copyText={gaps.join('\n')}>
          <KeywordChips keywords={gaps} variant="priority" />
        </ResultBlock>
      )}

      {recs.length > 0 && (
        <ResultBlock label="Recommendations" copyText={summaryText}>
          <BulletList items={recs} />
        </ResultBlock>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ATSCheck() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    resume_text: '',
    job_description: '',
    target_role: '',
    industry: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [result, setResult] = useState<ATSCheckResult | null>(null);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.resume_text.trim() || form.resume_text.trim().length < 50)
      e.resume_text = 'Resume text must be at least 50 characters';
    if (!form.job_description.trim() || form.job_description.trim().length < 30)
      e.job_description = 'Job description must be at least 30 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.ats.check({
        resume_text: form.resume_text.trim(),
        job_description: form.job_description.trim(),
        ...(form.target_role.trim() && { target_role: form.target_role.trim() }),
        ...(form.industry.trim() && { industry: form.industry.trim() }),
      });
      if (res.success) {
        setResult(res.data);
        toast({ title: 'ATS check complete ✓' });
      }
    } catch (err: unknown) {
      toast({
        title: 'ATS check failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!(fileName.endsWith('.pdf') || fileName.endsWith('.docx'))) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a PDF or DOCX file.',
        variant: 'destructive',
      });
      ev.target.value = '';
      return;
    }

    setUploadLoading(true);
    try {
      const res = await api.resume.extractText(file);
      if (res.success) {
        setForm(prev => ({ ...prev, resume_text: res.data.extracted_text }));
        setErrors(prev => ({ ...prev, resume_text: '' }));
        toast({
          title: 'Resume uploaded successfully',
          description: `Extracted ${res.data.character_count} characters from ${res.data.file_name}.`,
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Resume upload failed',
        description: err instanceof Error ? err.message : 'Could not extract text from file',
        variant: 'destructive',
      });
    } finally {
      setUploadLoading(false);
      ev.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ats-role">Target Role (optional)</Label>
            <Input
              id="ats-role"
              placeholder="e.g. Product Manager"
              value={form.target_role}
              onChange={set('target_role')}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="ats-industry">Industry (optional)</Label>
            <Input
              id="ats-industry"
              placeholder="e.g. Banking, Technology"
              value={form.industry}
              onChange={set('industry')}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ats-resume">Resume Text *</Label>
          <div className="mt-2 mb-2">
            <Input
              id="ats-resume-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeUpload}
              disabled={loading || uploadLoading}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload PDF/DOCX to auto-fill resume text.
            </p>
          </div>
          <Textarea
            id="ats-resume"
            placeholder="Paste your full resume text here…"
            value={form.resume_text}
            onChange={set('resume_text')}
            rows={7}
            disabled={loading || uploadLoading}
            className="resize-none"
          />
          {errors.resume_text && (
            <p className="mt-1 text-xs text-destructive">{errors.resume_text}</p>
          )}
        </div>

        <div>
          <Label htmlFor="ats-jd">Job Description *</Label>
          <Textarea
            id="ats-jd"
            placeholder="Paste the job description here…"
            value={form.job_description}
            onChange={set('job_description')}
            rows={5}
            disabled={loading}
            className="resize-none"
          />
          {errors.job_description && (
            <p className="mt-1 text-xs text-destructive">{errors.job_description}</p>
          )}
        </div>

        <Button type="submit" variant="brand" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Analyzing…
            </>
          ) : (
            'Run ATS Check'
          )}
        </Button>
      </form>

      {result && <ATSResults result={result} />}
    </div>
  );
}
