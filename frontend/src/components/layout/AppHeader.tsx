import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-brand-900 shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <HorizontalLogo className="animate-slide-down" />
        <UserAvatar user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
