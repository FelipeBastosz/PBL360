export const FEEDBACK_MAX_LENGTH = 2000;

export function appendFeedbackTemplate(
  currentText: string | null | undefined,
  templateText: string | null | undefined,
): string {
  const safeCurrent = currentText || '';
  const safeTemplate = templateText || '';
  const trimmedAddition = safeTemplate.trim();
  if (!trimmedAddition) return safeCurrent;

  const trimmedCurrent = safeCurrent.trim();
  if (!trimmedCurrent) return trimmedAddition;

  return `${safeCurrent.trimEnd()}\n\n${trimmedAddition}`;
}

export function isFeedbackOverLimit(
  text: string | null | undefined,
  max = FEEDBACK_MAX_LENGTH,
): boolean {
  const safeText = text || '';
  return safeText.length > max;
}
