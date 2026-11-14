import type { Content } from 'pdfmake/interfaces';
import type { ReportSection } from '../../domain/report-document';
import { tableContent } from './pdf-table-content';
import { textContent } from './pdf-text-content';

export const SECTION_HEADLINE_LEVEL = 1;

export const sectionContent = (section: ReportSection): Content[] => [
  {
    text: section.title,
    style: 'sectionTitle',
    headlineLevel: SECTION_HEADLINE_LEVEL,
    ...(section.kind === 'table' && section.startOnNewPage ? { pageBreak: 'before' as const } : {}),
  },
  section.kind === 'table' ? tableContent(section) : textContent(section),
];
