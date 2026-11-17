import type { Content, Node, NodeQueries, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ReportDocument, ReportIdentification } from '../../domain/report-document';
import { EMPTY_DOCUMENT_MESSAGE } from '../report-cell';
import { formatIssuedAt } from '../report-issued-at';
import { INK } from '../report-palette';
import { pageBackground, pageFooter, pageHeader } from './pdf-page-frame';
import { SECTION_HEADLINE_LEVEL, sectionContent } from './pdf-section-content';
import { breakLongWords, messageContent } from './pdf-text-format';
import { BASE_FONT_SIZE, PAGE_MARGINS, PDF_FONT, PDF_STYLES } from './pdf-theme';

const COMPACT_IDENTIFICATION_LENGTH = 80;

export const keepSectionTitleWithContent = (node: Node, queries: NodeQueries): boolean =>
  node.headlineLevel === SECTION_HEADLINE_LEVEL && queries.getFollowingNodesOnPage().length === 0;

const identificationItem =
  (width: 'auto' | '*') =>
  ({ label, value }: ReportIdentification) => ({
    width,
    stack: [
      { text: label.toUpperCase(), style: 'identificationLabel' },
      { text: breakLongWords(value), style: 'identificationValue' },
    ],
  });

export const identificationContent = ({ identification }: ReportDocument): Content[] => {
  if (identification.length === 0) return [];
  const length = identification.reduce((total, { value }) => total + value.length, 0);
  const width = length <= COMPACT_IDENTIFICATION_LENGTH ? 'auto' : '*';
  return [
    {
      columns: identification.map(identificationItem(width)),
      columnGap: 21,
      margin: [0, 12, 0, 4],
    },
  ];
};

const documentBody = ({ sections }: ReportDocument): Content[] =>
  sections.length === 0
    ? [messageContent(EMPTY_DOCUMENT_MESSAGE)]
    : sections.flatMap(sectionContent);

export const buildPdfDefinition = (
  document: ReportDocument,
  logoSvg: string,
  issuedAt: Date = new Date(),
): TDocumentDefinitions => {
  const issued = formatIssuedAt(issuedAt);
  return {
    info: { title: document.title, creator: 'PBL360', producer: 'PBL360' },
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: PAGE_MARGINS,
    defaultStyle: { font: PDF_FONT, fontSize: BASE_FONT_SIZE, lineHeight: 1.2, color: INK },
    styles: PDF_STYLES,
    background: pageBackground(logoSvg),
    header: pageHeader(document, logoSvg, issued),
    footer: pageFooter(issued),
    pageBreakBefore: keepSectionTitleWithContent,
    content: [...identificationContent(document), ...documentBody(document)],
  };
};
