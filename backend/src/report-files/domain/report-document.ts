export enum ReportFileFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
}

export enum ReportColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
}

export type ReportCellValue = string | number | null;

export interface ReportColumn {
  header: string;
  type: ReportColumnType;
  decimals?: number;
  pdfWidth?: number | 'auto' | '*';
}

export interface ReportTableSection {
  kind: 'table';
  title: string;
  columns: ReportColumn[];
  rows: ReportCellValue[][];
  keepRowsTogether?: boolean;
  startOnNewPage?: boolean;
}

export interface ReportTextEntry {
  label: string;
  text: string | null;
}

export interface ReportTextSection {
  kind: 'text';
  title: string;
  entries: ReportTextEntry[];
}

export type ReportSection = ReportTableSection | ReportTextSection;

export interface ReportIdentification {
  label: string;
  value: string;
}

export interface ReportDocument {
  format: ReportFileFormat;
  title: string;
  fileName: string;
  identification: ReportIdentification[];
  sections: ReportSection[];
}

export interface ReportFile {
  content: Buffer;
  fileName: string;
  contentType: string;
}
