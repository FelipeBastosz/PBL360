export const FEEDBACK_MAX_LENGTH = 2000;

export function appendFeedbackTemplate(currentText: string, templateText: string): string {
  const trimmedAddition = templateText.trim();
  if (!trimmedAddition) return currentText;

  const trimmedCurrent = currentText.trim();
  if (!trimmedCurrent) return trimmedAddition;

  return `${currentText.trimEnd()}\n\n${trimmedAddition}`;
}

export function isFeedbackOverLimit(text: string, max = FEEDBACK_MAX_LENGTH): boolean {
  return text.length > max;
}
