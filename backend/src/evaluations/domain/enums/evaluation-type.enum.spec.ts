import { EvaluationType } from './evaluation-type.enum';

describe('EvaluationType', () => {
  it('exposes the supported evaluation types', () => {
    expect(Object.values(EvaluationType)).toEqual([
      'TUTOR_SESSION',
      'SELF_ASSESSMENT',
      'PEER_ASSESSMENT',
    ]);
  });
});
