import { useState } from 'react';
import { api, type KeywordGapResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResultBlock, ScoreBar, KeywordChips } from '@/components/ResultComponents';

function KeywordGapResults({ result }: { result: KeywordGapResult }) {
  const missing = result.missing_keywords ?? [];
  const priority = result.high_priority_keywords ?? [];
  const coverage = result.coverage_percentage ?? 0;

  const copyText = [
    `Coverage: ${coverage}%`,
    '',
    'High-Priority Missing Keywords:',
    priority.join(', '),
    '',
    'All Missing Keywords:',
    missing.join(', '),
  ].join('\n');

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Coverage */}
      <ResultBlock label="Keyword Coverage">
        <div className="space-y-3">
          <ScoreBar label="Overall Coverage" value={coverage} />
          <p className="text-xs text-muted-foreground">
            {coverage >= 70
              ? 'Your resume covers most keywords in this job description.'
              : coverage >= 40
              ? 'You\'re partially aligned — consider adding the keywords below.'
              : 'Significant keyword gaps detected. Adding these will greatly improve your match rate.'}
          </p>
        </div>
      </ResultBlock>

      {/* High priority */}
      {priority.length > 0 && (
        <ResultBlock
          label={`High-Priority Keywords (${priority.length})`}
          copyText={priority.join(', ')}
        >
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Add these first — they appear frequently in the job description.
            </p>
            <KeywordChips keywords={priority} variant="priority" />
          </div>
        </ResultBlock>
      )}

      {/* All missing */}
      {missing.length > 0 && (
        <ResultBlock
          label={`All Missing Keywords (${missing.length})`}
          copyText={copyText}
        >
          <KeywordChips keywords={missing} variant="missing" />
        </ResultBlock>
      )}

      {missing.length === 0 && priority.length === 0 && (
        <ResultBlock>
          <p className="text-sm text-green-600 font-medium text-center py-2">
            ✓ No significant keyword gaps detected!
          </p>
        </ResultBlock>
      )}
    </div>
  );
}

export function KeywordGap() {
  const { toast } = useToast();
  const [form, setForm] = useState({ resume_text: '', job_description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [result, setResult] = useState<KeywordGapResult | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      const res = await api.resume.keywordGap({
        resume_text: form.resume_text.trim(),
        job_description: form.job_description.trim(),
      });
      if (res.success) {
        setResult(res.data);
        toast({ title: 'Keyword gap analysis complete ✓' });
      }
    } catch (err: unknown) {
      toast({
        title: 'Analysis failed',
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
        <div>
          <Label htmlFor="kw-resume">Resume Text *</Label>
          <div className="mt-2 mb-2">
            <Input
              id="kw-resume-file"
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
            id="kw-resume"
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
          <Label htmlFor="kw-jd">Job Description *</Label>
          <Textarea
            id="kw-jd"
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
            'Analyze Keyword Gap'
          )}
        </Button>
      </form>

      {result && <KeywordGapResults result={result} />}
    </div>
  );
}
