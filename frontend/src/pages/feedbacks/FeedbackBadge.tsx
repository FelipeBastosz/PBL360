type FeedbackBadgeProps = {
  isNew?: boolean;
};

export function FeedbackBadge({ isNew }: FeedbackBadgeProps) {
  if (!isNew) return null;
  return (
    <span
      data-testid="badge-novo"
      className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-900 border border-brand-200"
    >
      Novo
    </span>
  );
}
