import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3 px-5 py-5 text-white bg-brand-500">
      <button type="button" onClick={() => navigate(-1)} aria-label="Voltar">
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
      </div>
    </header>
  );
}
