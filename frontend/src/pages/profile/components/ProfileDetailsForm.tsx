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
        <label className="text-lg text-brand-900">E-mail institucional</label>
        <p className="flex h-12 w-full items-center rounded-xl border border-black/10 bg-brand-50/50 px-4 text-base text-gray-500 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
          {profile.email}
        </p>
        <span className="text-sm text-brand-300">Apenas para consulta.</span>
      </div>

      {profile.tipo === 'ALUNO' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-lg text-brand-900">Matrícula</label>
          <p className="flex h-12 w-full items-center rounded-xl border border-black/10 bg-brand-50/50 px-4 text-base text-gray-500 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
            {profile.matricula ?? 'Não informada'}
          </p>
          <span className="text-sm text-brand-300">Apenas para consulta.</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-lg text-brand-900">Tipo de conta</label>
        <p className="flex h-12 w-full items-center rounded-xl border border-black/10 bg-brand-50/50 px-4 text-base text-gray-500 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
          {profileLabel(profile.tipo)}
        </p>
      </div>

      <hr className="my-1 border-gray-200" />

      <ChangePasswordForm onSavePassword={onSavePassword} />
    </div>
  );
}
