import type { UserTypePayload } from '@/types/auth';
import { cn } from '@/utils/cn';
import { profileLabel } from '@/utils/profile';

const PROFILES: UserTypePayload[] = ['ALUNO', 'PROFESSOR'];

type ProfileToggleProps = {
  value: UserTypePayload;
  onChange: (value: UserTypePayload) => void;
};

export function ProfileToggle({ value, onChange }: ProfileToggleProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-lg text-brand-900">Perfil</legend>
      <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-black/20 p-1 bg-white">
        {PROFILES.map((profile) => (
          <label
            key={profile}
            className={cn(
              'flex h-10 cursor-pointer items-center justify-center rounded-lg text-base font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-900',
              value === profile ? 'text-white bg-brand-900' : 'text-brand-900 hover:bg-brand-50',
            )}
          >
            <input
              type="radio"
              name="tipo"
              value={profile}
              checked={value === profile}
              onChange={() => onChange(profile)}
              className="sr-only"
            />
            {profileLabel(profile)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
