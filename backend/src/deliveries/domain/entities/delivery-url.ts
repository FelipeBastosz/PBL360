import { isIP } from 'node:net';
import { InvalidProblemDeliveryError } from '../errors/invalid-problem-delivery.error';

export const MAX_DELIVERY_URL_LENGTH = 2048;

const AUTHORITY_USERINFO_PATTERN = /^https:\/\/[^/?#]*@/i;

const isIpAddress = (hostname: string): boolean => {
  if (hostname.startsWith('[') || hostname.endsWith(']')) {
    return true;
  }
  return isIP(hostname) !== 0;
};

const hasValidHostname = (hostname: string): boolean => {
  if (!hostname || hostname.startsWith('.') || hostname.endsWith('.') || isIpAddress(hostname)) {
    return false;
  }
  return hostname.includes('.') && !hostname.includes('..');
};

const parseHttpsUrl = (trimmed: string): URL | null => {
  if (
    !trimmed ||
    trimmed.length > MAX_DELIVERY_URL_LENGTH ||
    /\s/.test(trimmed) ||
    AUTHORITY_USERINFO_PATTERN.test(trimmed)
  ) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return null;
    }
    return hasValidHostname(parsed.hostname) ? parsed : null;
  } catch {
    return null;
  }
};

export const isValidHttpsDeliveryUrl = (value: unknown): value is string =>
  typeof value === 'string' && parseHttpsUrl(value.trim()) !== null;

export const normalizeDeliveryUrl = (value: string): string => {
  const trimmed = value?.trim() ?? '';
  if (!parseHttpsUrl(trimmed)) {
    throw new InvalidProblemDeliveryError('Informe uma URL HTTPS válida para a entrega.');
  }
  return trimmed.replace(/^https:\/\//i, 'https://');
};
