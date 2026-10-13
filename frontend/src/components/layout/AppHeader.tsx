import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 bg-brand-900 shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <HorizontalLogo className="animate-slide-down" />
        <div className="flex items-center gap-2">
          <UserAvatar user={user} className="animate-pop-in ring-2 ring-white/20" />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
            className="rounded-full p-2 text-white transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ArrowRightStartOnRectangleIcon className="size-6" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
