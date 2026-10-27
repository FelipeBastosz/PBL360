import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { seatPositions } from '@/utils/seatLayout';
import { PokerSeat } from './PokerSeat';
import type { SeatView } from './pokerSeats';

type PokerTableProps = {
  seats: SeatView[];
  wide: boolean;
  children: ReactNode;
};

const PORTRAIT_HEXAGON = '50,0 100,22 100,78 50,100 0,78 0,22';
const LANDSCAPE_HEXAGON = '0,50 22,0 78,0 100,50 78,100 22,100';

export function PokerTable({ seats, wide, children }: PokerTableProps) {
  const positions = seatPositions(seats.length, wide);

  return (
    <div className="flex w-full min-w-0 flex-1 items-center justify-center">
      <div
        role="group"
        aria-label="Mesa tutorial"
        className={cn(
          'relative w-full animate-fade-in',
          wide
            ? 'aspect-[5/3] max-w-[620px]'
            : 'aspect-[3/5] max-w-[330px] max-[359px]:max-w-[290px]',
        )}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={cn(
            'absolute overflow-visible',
            wide ? 'top-[22%] left-[16%] h-[56%] w-[68%]' : 'top-[16%] left-[22%] h-[68%] w-[56%]',
          )}
          aria-hidden
        >
          <polygon
            points={wide ? LANDSCAPE_HEXAGON : PORTRAIT_HEXAGON}
            className="fill-brand-50 stroke-brand-900"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 flex w-[118px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center max-[359px]:w-[100px] lg:w-[150px]">
          {children}
        </div>
        {seats.map((seat, index) => (
          <PokerSeat key={seat.lugar} seat={seat} position={positions[index]!} />
        ))}
      </div>
    </div>
  );
}
