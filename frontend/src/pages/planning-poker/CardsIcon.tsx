type CardsIconProps = {
  className?: string;
  backFill?: string;
};

export function CardsIcon({ className, backFill = 'var(--color-brand-50)' }: CardsIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect x="3.5" y="5.5" width="10" height="14" rx="2" transform="rotate(-10 8.5 12.5)" />
      <rect
        x="10"
        y="4.5"
        width="10"
        height="14"
        rx="2"
        fill={backFill}
        transform="rotate(8 15 11.5)"
      />
    </svg>
  );
}
