import { BookOpenIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/layout/AuthCard';
import { AuthShell } from '@/components/layout/AuthShell';
import { BrandHero } from '@/components/layout/BrandHero';
import { ROUTES } from '@/routes/paths';
import { ProfileOption } from './ProfileOption';

const TEXT_LINK_CLASS = '-my-3 inline-block py-3 text-brand-900 hover:underline';

export default function ProfileSelectionPage() {
  return (
    <AuthShell>
      <AuthCard>
        <BrandHero
          className="mb-8 lg:hidden"
          markClassName="size-32 text-card"
          discClassName="fill-brand-900"
        />
        <div className="flex flex-col">
          <h1 className="text-center text-[1.75rem] font-semibold text-ink">
            Como você deseja se cadastrar?
          </h1>
          <p className="mt-1 text-center font-semibold text-brand-300">
            Escolha seu perfil para iniciar o cadastro na plataforma.
          </p>
          <nav aria-label="Perfis de cadastro" className="mt-8 flex flex-col gap-3">
            <ProfileOption
              to={`${ROUTES.register}?perfil=aluno`}
              title="Aluno"
              description="Acompanhar minhas sessões"
              Icon={BookOpenIcon}
            />
            <ProfileOption
              to={`${ROUTES.register}?perfil=professor`}
              title="Professor"
              description="Gerenciar turmas e avaliações"
              Icon={ClipboardIcon}
            />
          </nav>
          <div className="mt-8 flex flex-col items-center gap-1 text-sm">
            <p className="text-muted">
              Já tem uma conta?{' '}
              <Link to={ROUTES.login} className={TEXT_LINK_CLASS}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
