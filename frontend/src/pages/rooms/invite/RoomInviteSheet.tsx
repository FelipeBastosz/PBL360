import { useId, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/utils/cn';
import { StudentInviteTab } from './StudentInviteTab';
import { TutorsTab } from './TutorsTab';

type InviteTab = 'alunos' | 'professores';

const TABS: { id: InviteTab; label: string }[] = [
  { id: 'alunos', label: 'Alunos' },
  { id: 'professores', label: 'Professores' },
];

type RoomInviteSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  roomCode: string;
  isOwner: boolean;
};

function TabSwitch({
  value,
  onChange,
  idPrefix,
}: {
  value: InviteTab;
  onChange: (tab: InviteTab) => void;
  idPrefix: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Quem convidar"
      className="relative grid grid-cols-2 rounded-xl bg-black/5 p-1"
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-[translate] duration-300 ease-out',
          value === 'professores' && 'translate-x-full',
        )}
      />
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${idPrefix}-${tab.id}`}
          aria-selected={value === tab.id}
          aria-controls={`${idPrefix}-${tab.id}-panel`}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative h-10 rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand-900',
            value === tab.id ? 'text-brand-900' : 'text-muted hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function RoomInviteSheet({
  isOpen,
  onClose,
  roomId,
  roomName,
  roomCode,
  isOwner,
}: RoomInviteSheetProps) {
  const [tab, setTab] = useState<InviteTab>('alunos');
  const idPrefix = useId();

  return (
    <Sheet isOpen={isOpen} title="Convidar para a turma" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <TabSwitch value={tab} onChange={setTab} idPrefix={idPrefix} />
        <div
          key={tab}
          role="tabpanel"
          id={`${idPrefix}-${tab}-panel`}
          aria-labelledby={`${idPrefix}-${tab}`}
          className="animate-fade-up [animation-duration:280ms]"
        >
          {tab === 'alunos' ? (
            <StudentInviteTab roomName={roomName} roomCode={roomCode} />
          ) : (
            <TutorsTab roomId={roomId} isOwner={isOwner} />
          )}
        </div>
      </div>
    </Sheet>
  );
}
