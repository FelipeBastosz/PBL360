import { profileLabel } from '@/utils/profile';
import type { ChangePasswordPayload, UserProfileResponse } from '@/types/user';
import { ProfileNameField } from './ProfileNameField';
import { ChangePasswordForm } from './ChangePasswordForm';

interface ProfileDetailsFormProps {
  profile: UserProfileResponse;
  onSaveName: (name: string) => Promise<boolean>;
  onSavePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
}

export function ProfileDetailsForm({
  profile,
  onSaveName,
  onSavePassword,
}: ProfileDetailsFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <ProfileNameField initialName={profile.nome} onSaveName={onSaveName} />

      <div className="flex flex-col gap-1.5">
        <label className="text-lg text-brand-accent">E-mail institucional</label>
        <p className="flex h-12 w-full items-center rounded-xl border border-border bg-brand-soft/50 px-4 text-base text-muted shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
          {profile.email}
        </p>
        <span className="text-sm text-brand-300">Apenas para consulta.</span>
      </div>

      {profile.tipo === 'ALUNO' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-lg text-brand-accent">Matrícula</label>
          <p className="flex h-12 w-full items-center rounded-xl border border-border bg-brand-soft/50 px-4 text-base text-muted shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
            {profile.matricula ?? 'Não informada'}
          </p>
          <span className="text-sm text-brand-300">Apenas para consulta.</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-lg text-brand-accent">Tipo de conta</label>
        <p className="flex h-12 w-full items-center rounded-xl border border-border bg-brand-soft/50 px-4 text-base text-muted shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
          {profileLabel(profile.tipo)}
        </p>
      </div>

      <hr className="my-1 border-border" />

      <ChangePasswordForm onSavePassword={onSavePassword} />
    </div>
  );
}
