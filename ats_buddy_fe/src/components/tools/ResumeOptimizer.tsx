import { useState } from 'react';
import { api, type ResumeOptimizeResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResultBlock, KeywordChips, BulletList } from '@/components/ResultComponents';

const UAE_EMIRATES = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
];

function OptimizeResults({ result }: { result: ResumeOptimizeResult }) {
  const bullets = result.rewritten_bullets ?? [];
  const skills = result.skills_to_add ?? [];
  const tips = result.uae_localization_tips ?? [];

  const allText = [
    result.optimized_summary ? `OPTIMIZED SUMMARY:\n${result.optimized_summary}` : '',
    bullets.length ? `\nREWRITTEN BULLETS:\n${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}` : '',
    skills.length ? `\nSKILLS TO ADD:\n${skills.join(', ')}` : '',
    tips.length ? `\nUAE LOCALIZATION TIPS:\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  return (
    <div className="space-y-4 animate-fade-up">
      {result.optimized_summary && (
        <ResultBlock label="Optimized Summary" copyText={result.optimized_summary}>
          <p className="text-sm leading-relaxed text-foreground">{result.optimized_summary}</p>
        </ResultBlock>
      )}

      {bullets.length > 0 && (
        <ResultBlock label={`Rewritten Bullets (${bullets.length})`} copyText={bullets.join('\n')}>
          <BulletList items={bullets} />
        </ResultBlock>
      )}

      {skills.length > 0 && (
        <ResultBlock label="Skills to Add" copyText={skills.join(', ')}>
          <KeywordChips keywords={skills} variant="priority" />
        </ResultBlock>
      )}

      {tips.length > 0 && (
        <ResultBlock label="UAE Localization Tips" copyText={allText}>
          <BulletList items={tips} />
        </ResultBlock>
      )}
    </div>
  );
}

export function ResumeOptimizer() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    resume_text: '',
    job_description: '',
    target_role: '',
    preferred_emirate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [result, setResult] = useState<ResumeOptimizeResult | null>(null);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.resume_text.trim() || form.resume_text.trim().length < 50)
      e.resume_text = 'Resume text must be at least 50 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.resume.optimize({
        resume_text: form.resume_text.trim(),
        ...(form.job_description.trim() && { job_description: form.job_description.trim() }),
        ...(form.target_role.trim() && { target_role: form.target_role.trim() }),
        ...(form.preferred_emirate && { preferred_emirate: form.preferred_emirate }),
      });
      if (res.success) {
        setResult(res.data);
        toast({ title: 'Resume optimized ✓' });
      }
    } catch (err: unknown) {
      toast({
        title: 'Optimization failed',
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
            <Label htmlFor="opt-role">Target Role (optional)</Label>
            <Input
              id="opt-role"
              placeholder="e.g. Senior Accountant"
              value={form.target_role}
              onChange={set('target_role')}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="opt-emirate">Preferred Emirate (optional)</Label>
            <select
              id="opt-emirate"
              value={form.preferred_emirate}
              onChange={set('preferred_emirate')}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select emirate…</option>
              {UAE_EMIRATES.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="opt-resume">Resume Text *</Label>
          <div className="mt-2 mb-2">
            <Input
              id="opt-resume-file"
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
            id="opt-resume"
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
          <Label htmlFor="opt-jd">Job Description (optional)</Label>
          <Textarea
            id="opt-jd"
            placeholder="Paste the target job description for better results…"
            value={form.job_description}
            onChange={set('job_description')}
            rows={4}
            disabled={loading}
            className="resize-none"
          />
        </div>

        <Button type="submit" variant="brand" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Optimizing…
            </>
          ) : (
            'Optimize Resume'
          )}
        </Button>
      </form>

      {result && <OptimizeResults result={result} />}
    </div>
  );
}
