import { profileLabel } from '@/utils/profile';
import type { UserProfileResponse } from '@/types/user';
import { ProfileNameField } from './ProfileNameField';

interface ProfileDetailsFormProps {
  profile: UserProfileResponse;
  onSaveName: (name: string) => Promise<boolean>;
}

export function ProfileDetailsForm({ profile, onSaveName }: ProfileDetailsFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <ProfileNameField initialName={profile.nome} onSaveName={onSaveName} />

      <div>
        <label className="text-sm font-semibold text-ink">E-mail institucional</label>
        <p className="mt-1 rounded-xl border border-line/60 bg-brand-50/50 px-3 py-2.5 text-base text-muted">
          {profile.email}
        </p>
        <span className="text-xs text-muted">Apenas para consulta.</span>
      </div>

      {profile.tipo === 'ALUNO' && (
        <div>
          <label className="text-sm font-semibold text-ink">Matrícula</label>
          <p className="mt-1 rounded-xl border border-line/60 bg-brand-50/50 px-3 py-2.5 text-base text-muted">
            {profile.matricula ?? 'Não informada'}
          </p>
          <span className="text-xs text-muted">Apenas para consulta.</span>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-ink">Tipo de conta</label>
        <p className="mt-1 rounded-xl border border-line/60 bg-brand-50/50 px-3 py-2.5 text-base text-muted">
          {profileLabel(profile.tipo)}
        </p>
      </div>
    </div>
  );
}
