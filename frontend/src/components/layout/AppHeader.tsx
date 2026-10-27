import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-brand-900 shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <HorizontalLogo className="animate-slide-down" />
        <UserMenuButton user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
