import { Link } from 'react-router-dom';
import { BrandHero } from '@/components/layout/BrandHero';
import { ROUTES } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center bg-surface">
      <BrandHero />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Página não encontrada</h1>
        <p className="text-muted">O endereço acessado não existe ou foi removido.</p>
      </div>
      <Link to={ROUTES.splash} className="font-semibold text-brand-900 hover:underline">
        Voltar para o início
      </Link>
    </main>
  );
}
