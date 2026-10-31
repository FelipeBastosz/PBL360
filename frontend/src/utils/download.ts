import { toApiError } from '@/services/apiError';

async function readBlobAsText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blob.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export async function parseBlobError(error: unknown): Promise<string> {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob || (data && typeof (data as Blob).text === 'function')) {
    try {
      const text = await readBlobAsText(data as Blob);
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.message) && parsed.message.length > 0) {
          return parsed.message[0];
        }
        if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
          return parsed.message;
        }
      }
      if (text) return text;
    } catch {
      // fallback
    }
  }
  return toApiError(error).message;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
