import type {
  Content,
  DynamicContent,
  Node,
  NodeQueries,
  PageOrientation,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import type { ReportDocument } from '../../domain/report-document';
import { EMPTY_DOCUMENT_MESSAGE } from '../report-cell';
import { SECTION_HEADLINE_LEVEL, messageContent, sectionContent } from './pdf-section-content';

export const PDF_FONT = 'Roboto';
export const LANDSCAPE_COLUMN_THRESHOLD = 6;

const PDF_STYLES: StyleDictionary = {
  title: { fontSize: 16, bold: true, margin: [0, 0, 0, 6] },
  identification: { fontSize: 9, margin: [0, 0, 0, 2] },
  sectionTitle: { fontSize: 12, bold: true, margin: [0, 14, 0, 6] },
  tableHeader: { bold: true },
  entryLabel: { bold: true, margin: [0, 0, 0, 2] },
  missing: { color: '#6B7785', italics: true },
  message: { color: '#6B7785', italics: true },
  footer: { fontSize: 8, color: '#6B7785' },
};

export const pageOrientationFor = ({ sections }: ReportDocument): PageOrientation => {
  const isWide = sections.some(
    (section) => section.kind === 'table' && section.columns.length > LANDSCAPE_COLUMN_THRESHOLD,
  );
  return isWide ? 'landscape' : 'portrait';
};

export const pageFooter =
  (logoSvg: string): DynamicContent =>
  (currentPage, pageCount) => ({
    margin: [40, 14, 40, 0],
    columns: [
      { svg: logoSvg, width: 62 },
      {
        text: `Página ${currentPage} de ${pageCount}`,
        style: 'footer',
        alignment: 'right',
        margin: [0, 9, 0, 0],
      },
    ],
  });

export const keepSectionTitleWithContent = (node: Node, queries: NodeQueries): boolean =>
  node.headlineLevel === SECTION_HEADLINE_LEVEL && queries.getFollowingNodesOnPage().length === 0;

const identificationContent = ({ identification }: ReportDocument): Content[] =>
  identification.map(({ label, value }) => ({
    text: [{ text: `${label}: `, bold: true }, value],
    style: 'identification',
  }));

const documentHeader = (document: ReportDocument): Content[] => [
  { text: document.title, style: 'title' },
  ...(document.repeatIdentification ? [] : identificationContent(document)),
];

const pageHeader =
  (document: ReportDocument): DynamicContent =>
  () => ({
    stack: identificationContent(document),
    margin: [40, 20, 40, 0],
  });

const documentBody = ({ sections }: ReportDocument): Content[] =>
  sections.length === 0
    ? [messageContent(EMPTY_DOCUMENT_MESSAGE)]
    : sections.flatMap(sectionContent);

export const buildPdfDefinition = (
  document: ReportDocument,
  logoSvg: string,
): TDocumentDefinitions => ({
  info: { title: document.title, creator: 'PBL360', producer: 'PBL360' },
  pageSize: 'A4',
  pageOrientation: pageOrientationFor(document),
  pageMargins: [40, document.repeatIdentification ? 100 : 40, 40, 64],
  defaultStyle: { font: PDF_FONT, fontSize: 9, lineHeight: 1.2 },
  styles: PDF_STYLES,
  footer: pageFooter(logoSvg),
  header: document.repeatIdentification ? pageHeader(document) : undefined,
  pageBreakBefore: keepSectionTitleWithContent,
  content: [...documentHeader(document), ...documentBody(document)],
});
