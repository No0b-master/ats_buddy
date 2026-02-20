import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UAEFlagStrip } from '@/components/UAEFlag';

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

// ─── Field error ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e: Record<string, string | null> = {};
    if (!fields.full_name || fields.full_name.trim().length < 2)
      e.full_name = 'Full name must be at least 2 characters';
    e.email = validateEmail(fields.email);
    e.password = validatePassword(fields.password);
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const registerRes = await api.auth.register({
        full_name: fields.full_name.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });

      if (registerRes.success) {
        toast({
          title: 'Registration successful',
          description: 'Your account was created. Signing you in now...',
        });

        const loginRes = await api.auth.login({
          email: fields.email.trim().toLowerCase(),
          password: fields.password,
        });

        if (loginRes.success && loginRes.data?.access_token) {
          login(loginRes.data.access_token);
          toast({
            title: 'Welcome to ATS Buddy UAE',
            description: `Hi ${fields.full_name.trim()}, your account is ready.`,
          });
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reg-name">Full Name</Label>
        <Input
          id="reg-name"
          placeholder="Ahmed Al Mansouri"
          value={fields.full_name}
          onChange={set('full_name')}
          autoComplete="name"
          disabled={loading}
        />
        <FieldError message={errors.full_name} />
      </div>
      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          value={fields.email}
          onChange={set('email')}
          autoComplete="email"
          disabled={loading}
        />
        <FieldError message={errors.email} />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Min. 8 characters"
          value={fields.password}
          onChange={set('password')}
          autoComplete="new-password"
          disabled={loading}
        />
        <FieldError message={errors.password} />
      </div>
      <Button type="submit" className="w-full" disabled={loading} variant="brand">
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e: Record<string, string | null> = {};
    e.email = validateEmail(fields.email);
    e.password = validatePassword(fields.password);
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.auth.login({
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });
      if (res.success && res.data?.access_token) {
        login(res.data.access_token);
        toast({
          title: 'Login successful',
          description: 'Welcome back! Redirecting to your dashboard.',
        });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={fields.email}
          onChange={set('email')}
          autoComplete="email"
          disabled={loading}
        />
        <FieldError message={errors.email} />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={fields.password}
          onChange={set('password')}
          autoComplete="current-password"
          disabled={loading}
        />
        <FieldError message={errors.password} />
      </div>
      <Button type="submit" className="w-full" disabled={loading} variant="brand">
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}

// ─── Brand panel ──────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-hero text-primary-foreground relative overflow-hidden">
      {/* UAE flag strip at the very top */}
      <UAEFlagStrip className="absolute top-0 left-0 right-0 w-full rounded-none h-2" />

      {/* Subtle flag-colour accent blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[hsl(145_63%_32%/0.15)]" />
        <div className="absolute bottom-10 -left-10 h-40 w-40 rounded-full bg-[hsl(0_84%_40%/0.12)]" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-gold">
          <span className="text-lg font-bold text-accent-foreground">A</span>
        </div>
        <div>
          <span className="text-lg font-semibold tracking-tight">ATS Buddy</span>
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold tracking-widest opacity-90">
            🇦🇪 UAE
          </span>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative space-y-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-light opacity-80">
            Built for UAE Job Seekers
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Land your dream job in the{' '}
            <span className="text-gradient-gold">UAE job market</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed opacity-80">
            Optimize your resume with AI, check your ATS score instantly, and identify
            keyword gaps — all tailored for the UAE and GCC market.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            { icon: '✓', text: 'ATS compatibility check in seconds' },
            { icon: '✓', text: 'AI-powered resume optimization' },
            { icon: '✓', text: 'Keyword gap analysis for UAE roles' },
          ].map(item => (
            <li key={item.text} className="flex items-center gap-3 text-sm opacity-90">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-accent-foreground text-xs font-bold shrink-0">
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>

        {/* UAE flag colours row */}
        <UAEFlagStrip className="h-1 opacity-60" />
      </div>

      {/* Footer note */}
      <p className="relative text-xs opacity-50">
        © {new Date().getFullYear()} ATS Buddy UAE. All rights reserved.
      </p>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      {/* Right: Auth card */}
      <div className="relative flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Theme toggle — top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* UAE flag strip at top of right panel */}
        <UAEFlagStrip className="absolute top-0 left-0 right-0 w-full rounded-none" />

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-brand-md">
            <span className="text-base font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-base font-semibold text-foreground">ATS Buddy 🇦🇪 UAE</span>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Get started</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an account or sign in to access your tools.
            </p>
          </div>

          <Tabs defaultValue="register">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="login">Sign In</TabsTrigger>
            </TabsList>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
