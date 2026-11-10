import type request from 'supertest';
import { Workbook } from 'exceljs';

export const binaryParser = (
  res: request.Response,
  callback: (err: Error | null, body: Buffer) => void,
) => {
  res.setEncoding('binary');
  let data = '';
  res.on('data', (chunk: string) => {
    data += chunk;
  });
  res.on('end', () => {
    callback(null, Buffer.from(data, 'binary'));
  });
};

export async function loadWorkbook(body: unknown): Promise<Workbook> {
  const workbook = new Workbook();
  await workbook.xlsx.load(body as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}
