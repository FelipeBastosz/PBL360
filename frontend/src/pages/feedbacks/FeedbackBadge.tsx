type FeedbackBadgeProps = {
  isNew?: boolean;
};

export function FeedbackBadge({ isNew }: FeedbackBadgeProps) {
  if (!isNew) return null;
  return (
    <span
      data-testid="badge-novo"
      className="inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-accent border border-brand-border"
    >
      Novo
    </span>
  );
}
