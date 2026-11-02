import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ArrowRightStartOnRectangleIcon,
  BookOpenIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AuthContext } from '@/contexts/authContext';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';

type AvatarUser = Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'>;

type MenuItem = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
};

const ITEM_CLASS =
  'flex w-full items-center gap-4 rounded-xl px-3 py-3 text-base font-semibold text-brand-900';

function menuItems(isProfessor: boolean): MenuItem[] {
  return [
    { label: 'Meu Perfil', Icon: UserIcon, to: ROUTES.myAccount },
    { label: 'Minhas Turmas', Icon: BookOpenIcon, to: ROUTES.rooms },
    ...(isProfessor
      ? [
          {
            label: 'Minhas Fórmulas',
            Icon: AdjustmentsHorizontalIcon,
            to: ROUTES.performanceTables,
          },
          {
            label: 'Minhas Marcações',
            Icon: TagIcon,
            to: ROUTES.behaviorTags,
          },
        ]
      : []),
  ];
}

function MenuEntry({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  const content = (
    <>
      <item.Icon className="size-6 shrink-0" aria-hidden />
      <span className="flex-1 text-left">{item.label}</span>
    </>
  );

  if (!item.to) {
    return (
      <div aria-disabled className={cn(ITEM_CLASS, 'cursor-not-allowed opacity-50')}>
        {content}
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-muted">
          Em breve
        </span>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        ITEM_CLASS,
        'transition-colors duration-200 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-900',
      )}
    >
      {content}
    </Link>
  );
}

function useCloseOnEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
}

function DrawerHeader({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3 bg-brand-900 px-6 py-6 text-white">
      <UserAvatar user={user} className="size-11" />
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate text-lg leading-tight font-semibold">
          {user?.nome}
        </h2>
        {user?.matricula && (
          <p className="truncate text-sm text-brand-200">Matrícula: {user.matricula}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar menu"
        className="-mr-2 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
      >
        <XMarkIcon className="size-6" aria-hidden />
      </button>
    </div>
  );
}

function DrawerNav({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  return (
    <nav aria-label="Minha conta" className="flex-1 overflow-y-auto px-3 pt-6">
      <p className="px-3 text-xs font-bold tracking-widest text-brand-300 uppercase">Minha conta</p>
      <div className="mt-2 flex flex-col gap-1">
        {menuItems(user?.tipo === 'PROFESSOR').map((item) => (
          <MenuEntry key={item.label} item={item} onNavigate={onClose} />
        ))}
      </div>
    </nav>
  );
}

function DrawerFooter({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    onClose();
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <div className="border-t border-black/5 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={handleLogout}
        className={cn(
          ITEM_CLASS,
          'text-danger transition-colors duration-200 hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-danger',
        )}
      >
        <ArrowRightStartOnRectangleIcon className="size-6 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Sair da conta</span>
      </button>
    </div>
  );
}

function UserMenuDrawer({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useCloseOnEscape(true, onClose);

  useEffect(() => panelRef.current?.focus(), []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-xs animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl animate-drawer-in focus:outline-none"
      >
        <DrawerHeader titleId={titleId} onClose={onClose} />
        <DrawerNav onClose={onClose} />
        <DrawerFooter onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}

type UserMenuButtonProps = {
  user?: AvatarUser | null;
  className?: string;
};

export function UserMenuButton({ user, className }: UserMenuButtonProps) {
  const authUser = useContext(AuthContext)?.user ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu da conta"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="shrink-0 rounded-full transition-[scale] duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <UserAvatar user={user ?? authUser} className={className} />
      </button>
      {isOpen && <UserMenuDrawer onClose={close} />}
    </>
  );
}
