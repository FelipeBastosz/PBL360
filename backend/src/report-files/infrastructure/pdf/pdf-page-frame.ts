import type {
  Content,
  ContextPageSize,
  DynamicBackground,
  DynamicContent,
} from 'pdfmake/interfaces';
import type { ReportDocument } from '../../domain/report-document';
import type { ReportIssuedAt } from '../report-issued-at';
import { BRAND_900, LILAC_300 } from '../report-palette';
import { PAGE_SIDE_MARGIN } from './pdf-theme';

const BAND_HEIGHT = 6;
const WATERMARK_WIDTH = 450;
const WATERMARK_OPACITY = 0.07;
const WATERMARK_VERTICAL_CENTER = 0.54;
const LOGO_RATIO = 40 / 103;
const FIRST_PAGE_LOGO_WIDTH = 54;
const CONTINUATION_LOGO_WIDTH = 39;

export const bandSvg = (width: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${BAND_HEIGHT}">` +
  '<defs><linearGradient id="band" x1="0" y1="0" x2="1" y2="0">' +
  `<stop offset="0" stop-color="${BRAND_900}"/><stop offset="1" stop-color="${LILAC_300}"/>` +
  '</linearGradient></defs>' +
  `<path d="M0 0H${width}Q${width} ${BAND_HEIGHT} ${width - BAND_HEIGHT} ${BAND_HEIGHT}` +
  `H${BAND_HEIGHT}Q0 ${BAND_HEIGHT} 0 0Z" fill="url(#band)"/></svg>`;

export const watermarkSvg = (logoSvg: string): string =>
  logoSvg
    .replace(/<svg[^>]*>/, (open) => `${open}<g opacity="${WATERMARK_OPACITY}">`)
    .replace(/<\/svg>\s*$/, '</g></svg>');

const watermark = (logoSvg: string, { width, height }: ContextPageSize): Content => ({
  svg: watermarkSvg(logoSvg),
  width: WATERMARK_WIDTH,
  absolutePosition: {
    x: (width - WATERMARK_WIDTH) / 2,
    y: height * WATERMARK_VERTICAL_CENTER - (WATERMARK_WIDTH * LOGO_RATIO) / 2,
  },
});

export const pageBackground =
  (logoSvg: string): DynamicBackground =>
  (_currentPage, pageSize) => [
    { svg: bandSvg(pageSize.width), absolutePosition: { x: 0, y: 0 } },
    watermark(logoSvg, pageSize),
  ];

const firstPageHeader = (document: ReportDocument, logoSvg: string, issued: ReportIssuedAt) => ({
  margin: [PAGE_SIDE_MARGIN, 24, PAGE_SIDE_MARGIN, 0],
  columns: [
    { svg: logoSvg, width: FIRST_PAGE_LOGO_WIDTH },
    {
      width: '*',
      alignment: 'right',
      stack: [
        { text: document.title, style: 'documentTitle' },
        { text: `${issued.date} · ${issued.time}`, style: 'issuedAt' },
      ],
    },
  ],
});

const repeatedIdentification = ({ identification, repeatIdentification }: ReportDocument) =>
  repeatIdentification
    ? [{ text: identification.map(({ value }) => value).join(' · '), style: 'issuedAt' }]
    : [];

const continuationHeader = (document: ReportDocument, logoSvg: string) => ({
  margin: [PAGE_SIDE_MARGIN, 22, PAGE_SIDE_MARGIN, 0],
  columns: [
    { svg: logoSvg, width: CONTINUATION_LOGO_WIDTH },
    {
      width: '*',
      alignment: 'right',
      stack: [
        { text: `${document.title} · continuação`, style: 'continuation' },
        ...repeatedIdentification(document),
      ],
    },
  ],
});

export const pageHeader =
  (document: ReportDocument, logoSvg: string, issued: ReportIssuedAt): DynamicContent =>
  (currentPage) =>
    (currentPage === 1
      ? firstPageHeader(document, logoSvg, issued)
      : continuationHeader(document, logoSvg)) as Content;

export const pageFooter =
  (issued: ReportIssuedAt): DynamicContent =>
  (currentPage, pageCount) => ({
    margin: [PAGE_SIDE_MARGIN, 20, PAGE_SIDE_MARGIN, 0],
    columns: [
      {
        text: `PBL360 · Documento gerado automaticamente em ${issued.date} ${issued.time}`,
        style: 'footer',
      },
      {
        text: `Página ${currentPage} de ${pageCount}`,
        style: 'footerPage',
        alignment: 'right',
        width: 'auto',
      },
    ],
  });
