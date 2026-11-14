import type { Margins, StyleDictionary } from 'pdfmake/interfaces';
import { BRAND_900, INK, MISSING, MUTED, WHITE } from '../report-palette';

export const PDF_FONT = 'Roboto';
export const BASE_FONT_SIZE = 8.25;
export const PAGE_SIDE_MARGIN = 42;
export const PAGE_MARGINS: Margins = [PAGE_SIDE_MARGIN, 70, PAGE_SIDE_MARGIN, 48];

export const PDF_STYLES: StyleDictionary = {
  documentTitle: { fontSize: 10.5, bold: true, color: BRAND_900 },
  issuedAt: { fontSize: 7.5, color: MUTED, margin: [0, 2, 0, 0] },
  continuation: { fontSize: 7.5, bold: true, color: MUTED },
  identificationLabel: { fontSize: 6.75, bold: true, color: MUTED, characterSpacing: 0.4 },
  identificationValue: { fontSize: 9, bold: true, color: INK, margin: [0, 2, 0, 0] },
  sectionTitle: { fontSize: 10, bold: true, color: BRAND_900, margin: [0, 20, 0, 8] },
  tableHeader: { fontSize: 7.5, bold: true, color: WHITE },
  rowLead: { bold: true },
  status: { bold: true, noWrap: true },
  result: { bold: true },
  missing: { color: MISSING, italics: true },
  message: { color: MUTED, italics: true },
  entryLabel: { bold: true, margin: [0, 0, 0, 3] },
  footer: { fontSize: 6.75, color: MUTED },
  footerPage: { fontSize: 6.75, bold: true, color: BRAND_900 },
};
