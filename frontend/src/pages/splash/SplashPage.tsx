import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_TAGLINE } from '@/assets/brand';
import { LogoMark } from '@/components/ui/LogoMark';
import { Wordmark } from '@/components/ui/Wordmark';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';

const SPLASH_DURATION_MS = 1800;

export default function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const target = isAuthenticated ? ROUTES.home : ROUTES.profileSelection;
    const id = window.setTimeout(() => navigate(target, { replace: true }), SPLASH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [isAuthenticated, navigate]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-card bg-brand-900">
      <h1 className="sr-only">PBL360</h1>
      <LogoMark
        animated
        className="size-[min(293px,75vw)] animate-fade-up text-brand-900 lg:size-80"
        discClassName="fill-card"
      />
      <Wordmark
        decorative
        className="mt-6 h-12 w-auto animate-fade-up [animation-delay:400ms] lg:h-14"
      />
      <p className="mt-4 hidden animate-fade-up text-xl text-card/80 [animation-delay:700ms] lg:block">
        {APP_TAGLINE}
      </p>
    </main>
  );
}
