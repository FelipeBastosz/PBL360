import type { ReactNode } from 'react';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import type { PokerConnection } from '@/types/planningPoker';
import { cn } from '@/utils/cn';
import { PokerStatusBar, ShuffleNotice } from './PokerStatusBar';

type PokerLayoutProps = {
  wide: boolean;
  connection: PokerConnection;
  anonymous: boolean;
  showShuffle: boolean;
  roundLabel: string;
  onOpenProgress?: () => void;
  table: ReactNode;
  panelFirst?: boolean;
  children: ReactNode;
};

export function PokerLayout({
  wide,
  table,
  panelFirst = false,
  showShuffle,
  children,
  ...status
}: PokerLayoutProps) {
  return (
    <>
      <PokerStatusBar {...status} />
      {showShuffle && <ShuffleNotice />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            PAGE_CONTAINER_CLASS,
            'flex min-h-full',
            wide ? 'flex-row items-center gap-8 pt-3 pb-6' : 'flex-col gap-5 pt-4 pb-7',
          )}
        >
          {table}
          <div
            className={cn(
              'flex shrink-0 flex-col gap-3',
              wide ? 'w-[340px]' : 'w-full',
              panelFirst && !wide && '-order-1',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
