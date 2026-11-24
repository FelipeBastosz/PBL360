import { InvalidProblemDeliveryError } from '../errors/invalid-problem-delivery.error';
import { isValidHttpsDeliveryUrl, MAX_DELIVERY_URL_LENGTH } from './delivery-url';
import { ProblemDelivery } from './problem-delivery.entity';

const BASE_PROPS = {
  roomId: '11111111-1111-4111-8111-111111111111',
  problemId: '22222222-2222-4222-8222-222222222222',
  submittedBy: '33333333-3333-4333-8333-333333333333',
};

describe('ProblemDelivery entity', () => {
  it('accepts a valid Google Drive HTTPS folder link', () => {
    const url = 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing';
    const delivery = ProblemDelivery.create({ ...BASE_PROPS, url });

    expect(delivery.url).toBe(url);
    expect(delivery.roomId).toBe(BASE_PROPS.roomId);
    expect(delivery.problemId).toBe(BASE_PROPS.problemId);
    expect(delivery.submittedBy).toBe(BASE_PROPS.submittedBy);
  });

  it('accepts a valid GitHub repository HTTPS link and trims surrounding whitespace', () => {
    const delivery = ProblemDelivery.create({
      ...BASE_PROPS,
      url: '  HTTPS://github.com/uefs/pbl360-entrega  ',
    });

    expect(delivery.url).toBe('https://github.com/uefs/pbl360-entrega');
  });

  it.each([
    '',
    '   ',
    'http://github.com/uefs/pbl360',
    'ftp://files.example.com/archive.zip',
    'javascript:alert(1)',
    'drive.google.com/drive/folders/123',
    'https://',
    'https://localhost',
    'https://invalid-host',
    'https://example.com/with space',
    `https://example.com/${'a'.repeat(MAX_DELIVERY_URL_LENGTH)}`,
  ])('rejects invalid or non-HTTPS URL: %s', (url) => {
    expect(isValidHttpsDeliveryUrl(url)).toBe(false);
    expect(() => ProblemDelivery.create({ ...BASE_PROPS, url })).toThrow(
      InvalidProblemDeliveryError,
    );
  });

  it('rejects non-string values in URL predicate', () => {
    expect(isValidHttpsDeliveryUrl(null)).toBe(false);
    expect(isValidHttpsDeliveryUrl(undefined)).toBe(false);
    expect(isValidHttpsDeliveryUrl(123)).toBe(false);
  });

  it('rejects missing roomId, problemId, or submittedBy', () => {
    const validUrl = 'https://github.com/uefs/pbl360';

    expect(() => ProblemDelivery.create({ ...BASE_PROPS, roomId: '  ', url: validUrl })).toThrow(
      InvalidProblemDeliveryError,
    );
    expect(() => ProblemDelivery.create({ ...BASE_PROPS, problemId: '', url: validUrl })).toThrow(
      InvalidProblemDeliveryError,
    );
    expect(() => ProblemDelivery.create({ ...BASE_PROPS, submittedBy: '', url: validUrl })).toThrow(
      InvalidProblemDeliveryError,
    );
  });
});
