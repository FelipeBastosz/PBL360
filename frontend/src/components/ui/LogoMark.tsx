import type { CSSProperties } from 'react';
import { LOGO_ARCS, LOGO_LAPTOP, LOGO_SEATS, LOGO_TABLE, type LogoSeat } from '@/assets/logoParts';
import { LOGO_DISC_PATH, LOGO_FIGURE_PATHS, LOGO_VIEW_BOX } from '@/assets/logoPaths';
import { cn } from '@/utils/cn';

type LogoMarkProps = {
  className?: string;
  discClassName?: string;
  title?: string;
  animated?: boolean;
};

const SEAT_DISTANCE = 18;

const TALK_ORDER = [0, 3, 5, 1, 6, 2, 4];

function Part({ index, className }: { index: number; className?: string }) {
  return (
    <path
      d={LOGO_FIGURE_PATHS[index]}
      className={className}
      fillRule="evenodd"
      clipRule="evenodd"
    />
  );
}

function seatStyle(seat: LogoSeat, order: number): CSSProperties {
  const [dx, dy] = seat.direction;
  return {
    '--seat-x': `${dx * SEAT_DISTANCE}px`,
    '--seat-y': `${dy * SEAT_DISTANCE}px`,
    '--seat-order': order,
    '--talk-slot': TALK_ORDER[order],
  } as CSSProperties;
}

function Seat({ seat, order }: { seat: LogoSeat; order: number }) {
  return (
    <g className="logo-seat" style={seatStyle(seat, order)}>
      {seat.chair !== undefined && <Part index={seat.chair} />}
      <g className="logo-person">
        <Part index={seat.body} />
        <Part index={seat.head} className="logo-head" />
        {seat.hand !== undefined && <Part index={seat.hand} className="logo-hand" />}
      </g>
      {seat.props.map((index) => (
        <Part
          key={index}
          index={index}
          className={index === LOGO_LAPTOP ? 'logo-laptop' : undefined}
        />
      ))}
    </g>
  );
}

function AnimatedFigures() {
  return (
    <g className="logo-animated">
      {LOGO_ARCS.map((index) => (
        <Part key={index} index={index} className="logo-arc" />
      ))}
      <Part index={LOGO_TABLE} className="logo-table" />
      {LOGO_SEATS.map((seat, order) => (
        <Seat key={seat.head} seat={seat} order={order} />
      ))}
    </g>
  );
}

export function LogoMark({ className, discClassName, title, animated }: LogoMarkProps) {
  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('shrink-0', className)}
      fill="currentColor"
    >
      {discClassName && <path d={LOGO_DISC_PATH} className={discClassName} />}
      {animated ? (
        <AnimatedFigures />
      ) : (
        LOGO_FIGURE_PATHS.map((path) => (
          <path key={path.slice(0, 24)} d={path} fillRule="evenodd" clipRule="evenodd" />
        ))
      )}
    </svg>
  );
}
