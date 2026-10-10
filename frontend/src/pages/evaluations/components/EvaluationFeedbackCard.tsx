type Props = {
  feedback: string;
  onChange: (val: string) => void;
};

export function EvaluationFeedbackCard({ feedback, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-brand-900">Feedback</h2>

      <textarea
        rows={4}
        placeholder="Escreva aqui um feedback para o(a) aluno(a)..."
        value={feedback}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full resize-none rounded-2xl border border-brand-100/80 bg-brand-50/40 p-4 text-sm text-ink placeholder:text-muted focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}
