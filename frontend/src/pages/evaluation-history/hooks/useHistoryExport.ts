import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import {
  buildExportTable,
  exportFileName,
  toCsv,
  toPrintHtml,
} from '@/utils/evaluationHistoryExport';

const EXPORT_TITLE = 'Histórico de avaliações';

function downloadFile(content: string, fileName: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printInFrame(html: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
  frame.onload = () => {
    const frameWindow = frame.contentWindow;
    frameWindow?.addEventListener('afterprint', () => frame.remove());
    frameWindow?.focus();
    frameWindow?.print();
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
}

// A separate tab prints reliably on mobile browsers, which ignore printing inside an
// iframe; the iframe is the fallback when the tab is blocked. The browser print dialog
// offers "Salvar como PDF", so no PDF library is needed.
function printHtml(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    printInFrame(html);
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function useHistoryExport(students: StudentEvaluationHistoryItem[], hideNames: boolean) {
  const exportExcel = () => {
    const csv = toCsv(buildExportTable(students, hideNames));
    downloadFile(csv, exportFileName('csv', new Date()), 'text/csv;charset=utf-8');
  };

  const exportPdf = () => {
    printHtml(toPrintHtml(buildExportTable(students, hideNames), EXPORT_TITLE, new Date()));
  };

  return { exportExcel, exportPdf };
}
