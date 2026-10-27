import { useNavigate } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { BackHeader } from '@/components/layout/BackHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/routes/paths';
import { useProfile } from './hooks/useProfile';
import { ProfilePhotoSection } from './components/ProfilePhotoSection';
import { ProfileDetailsForm } from './components/ProfileDetailsForm';
import { ProfileLoadingState, ProfileErrorState } from './components/ProfileStates';

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    error,
    actionError,
    successMessage,
    reload,
    saveName,
    uploadPhoto,
    deletePhoto,
  } = useProfile();

  if (isLoading) return <ProfileLoadingState />;
  if (error || !profile) return <ProfileErrorState error={error} onRetry={reload} />;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader title="Meu Perfil" subtitle="Minha Conta" onBack={() => navigate(ROUTES.rooms)} />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mx-auto max-w-2xl py-6')}>
        <div className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-line pb-4">
            <h1 className="text-xl font-bold text-ink sm:text-2xl">Dados da Conta</h1>
            <p className="text-sm text-muted">
              Consulte suas informações acadêmicas e gerencie seu nome e foto de exibição.
            </p>
          </div>

          {actionError && (
            <div className="mb-4">
              <Alert tone="error">{actionError}</Alert>
            </div>
          )}

          {successMessage && (
            <div className="mb-4">
              <Alert tone="success">{successMessage}</Alert>
            </div>
          )}

          <ProfilePhotoSection profile={profile} onUpload={uploadPhoto} onDelete={deletePhoto} />

          <hr className="my-6 border-line" />

          <ProfileDetailsForm profile={profile} onSaveName={saveName} />
        </div>
      </main>
    </div>
  );
}
