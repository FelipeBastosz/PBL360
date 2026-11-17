import type { Content, CustomTableLayout } from 'pdfmake/interfaces';
import type { ReportTextEntry, ReportTextSection } from '../../domain/report-document';
import { EMPTY_TEXT_SECTION_MESSAGE, MISSING_TEXT_LABEL } from '../report-cell';
import { BRAND_700, CARD } from '../report-palette';
import { breakLongWords, messageContent } from './pdf-text-format';

export const TEXT_CARD_LAYOUT: CustomTableLayout = {
  fillColor: () => CARD,
  hLineWidth: () => 0,
  vLineWidth: (index) => (index === 0 ? 2.5 : 0),
  vLineColor: () => BRAND_700,
  paddingLeft: () => 12,
  paddingRight: () => 10,
  paddingTop: () => 8,
  paddingBottom: () => 8,
};

const entryText = (text: string | null): Content =>
  text === null ? { text: MISSING_TEXT_LABEL, style: 'missing' } : { text: breakLongWords(text) };

const entryCard = ({ label, text }: ReportTextEntry): Content => ({
  table: {
    widths: ['*'],
    body: [[{ stack: [{ text: breakLongWords(label), style: 'entryLabel' }, entryText(text)] }]],
  },
  layout: TEXT_CARD_LAYOUT,
  margin: [0, 0, 0, 6],
});

export const textContent = ({ entries }: ReportTextSection): Content => {
  if (entries.length === 0) return messageContent(EMPTY_TEXT_SECTION_MESSAGE);
  return entries.map(entryCard);
};
