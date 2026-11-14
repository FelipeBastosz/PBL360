import type { Content } from 'pdfmake/interfaces';

const ZERO_WIDTH_SPACE = '\u200B';
const LONG_WORD = /\S{25,}/gu;
const WORD_CHUNK = /(\S{20})(?=\S)/gu;

export const breakLongWords = (text: string): string =>
  text.replace(LONG_WORD, (word) => word.replace(WORD_CHUNK, `$1${ZERO_WIDTH_SPACE}`));

export const messageContent = (message: string): Content => ({ text: message, style: 'message' });
