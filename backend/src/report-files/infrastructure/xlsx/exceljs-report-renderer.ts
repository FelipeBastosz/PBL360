import { Injectable } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';
import type { ReportDocument, ReportSection } from '../../domain/report-document';
import type { ReportRenderer } from '../../domain/services/report-renderer';
import { EMPTY_DOCUMENT_MESSAGE } from '../report-cell';
import { createSheetNamer } from './xlsx-sheet-name';
import { writeMessage, writePreamble } from './xlsx-sheet-layout';
import { writeTableSheet, writeTextSheet } from './xlsx-section-sheets';

const EMPTY_DOCUMENT_SHEET_NAME = 'Relatório';

@Injectable()
export class ExceljsReportRenderer implements ReportRenderer {
  async render(document: ReportDocument): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'PBL360';
    workbook.title = document.title;

    if (document.sections.length === 0) addEmptySheet(workbook, document);
    const sheetName = createSheetNamer();
    document.sections.forEach((section, index) =>
      addSectionSheet(
        workbook.addWorksheet(sheetName(section.title, index + 1)),
        document,
        section,
      ),
    );

    const content = await workbook.xlsx.writeBuffer();
    return Buffer.from(content);
  }
}

const addEmptySheet = (workbook: Workbook, document: ReportDocument): void => {
  const sheet = workbook.addWorksheet(EMPTY_DOCUMENT_SHEET_NAME);
  writePreamble(sheet, document, null);
  writeMessage(sheet, EMPTY_DOCUMENT_MESSAGE);
  sheet.getColumn(1).width = 32;
  sheet.getColumn(2).width = 60;
};

const addSectionSheet = (
  sheet: Worksheet,
  document: ReportDocument,
  section: ReportSection,
): void => {
  if (section.kind === 'table') return writeTableSheet(sheet, document, section);
  writeTextSheet(sheet, document, section);
};
