import { BookOpenIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { AuthShell } from '@/components/layout/AuthShell';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { BrandHero } from '@/components/layout/BrandHero';
import { ROUTES } from '@/routes/paths';
import { ProfileOption } from './ProfileOption';

export default function ProfileSelectionPage() {
  return (
    <AuthShell>
      <div className="flex flex-1 flex-col px-6 pt-8 pb-10 bg-surface lg:flex-none lg:rounded-[20px] lg:border lg:border-black/5 lg:p-10 lg:bg-card lg:shadow-xl">
        <BrandHeader />
        <BrandHero
          className="mt-16 lg:hidden"
          markClassName="size-32 text-card"
          discClassName="fill-brand-900"
        />
        <div className="mx-auto mt-12 flex w-full max-w-sm flex-col lg:mt-10">
          <h1 className="text-center text-[1.75rem] font-semibold text-ink">
            Como você vai acessar?
          </h1>
          <p className="mt-1 text-center font-semibold text-brand-300">
            Escolha seu perfil para personalizarmos sua experiência na plataforma.
          </p>
          <nav aria-label="Perfis de acesso" className="mt-16 flex flex-col gap-2 lg:mt-10">
            <ProfileOption
              to={`${ROUTES.login}?perfil=aluno`}
              title="Aluno"
              description="Acompanhar minhas sessões"
              Icon={BookOpenIcon}
            />
            <ProfileOption
              to={`${ROUTES.login}?perfil=professor`}
              title="Professor"
              description="Gerenciar turmas e avaliações"
              Icon={ClipboardIcon}
            />
          </nav>
        </div>
      </div>
    </AuthShell>
  );
}
