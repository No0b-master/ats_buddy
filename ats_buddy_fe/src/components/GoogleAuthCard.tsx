import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface GoogleAuthCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function GoogleAuthCard({
  title = 'Continue with Google',
  description = 'Use your Google account to sign up or sign in securely.',
  className,
}: GoogleAuthCardProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
  const isConfigured = !!googleClientId;

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response?.credential) {
        toast({
          title: 'Google sign-in failed',
          description: 'No identity token was returned by Google.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.auth.google({ id_token: response.credential });
        if (res.success && res.data?.access_token) {
          login(res.data.access_token);
          toast({
            title: 'Signed in with Google',
            description: 'Welcome to ATS Buddy UAE.',
          });
          navigate('/dashboard');
        }
      } catch (err: unknown) {
        toast({
          title: 'Google sign-in failed',
          description: err instanceof Error ? err.message : 'Unable to authenticate with Google',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate, toast]
  );

  useEffect(() => {
    if (!isConfigured || !buttonRef.current) return;

    let cancelled = false;
    let initialized = false;

    const tryInitialize = () => {
      if (cancelled || initialized || !buttonRef.current) return;
      if (!window.google?.accounts?.id) return;

      initialized = true;
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 360,
        logo_alignment: 'left',
      });
    };

    const intervalId = window.setInterval(tryInitialize, 250);
    tryInitialize();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [googleClientId, handleGoogleCredential, isConfigured]);

  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-brand-sm ${className ?? ''}`}>
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      {isConfigured ? (
        <div className="space-y-2">
          <div ref={buttonRef} className={isLoading ? 'pointer-events-none opacity-70' : ''} />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Google sign-in is disabled until VITE_GOOGLE_CLIENT_ID is configured.
        </p>
      )}
    </div>
  );
}
