import { InvalidSessionError } from '../errors/invalid-session.error';
import { Session } from './session.entity';

describe('Session Entity', () => {
  describe('evaluation releases', () => {
    const now = new Date('2026-10-07T12:00:00Z');
    const tomorrow = new Date('2026-10-08T12:00:00Z');
    const yesterday = new Date('2026-10-06T12:00:00Z');
    const newSession = () =>
      Session.create({
        problemId: 'prob-1',
        title: 'Abertura',
        description: null,
        date: '2026-10-07',
      });

    it('starts with both evaluations closed', () => {
      const session = newSession();

      expect(session.selfEvalReleased).toBe(false);
      expect(session.peerEvalReleased).toBe(false);
      expect(session.isReleaseOpen('self', now)).toBe(false);
    });

    it('releases self evaluation with a deadline and records author and time', () => {
      const session = newSession();

      session.changeRelease('self', { released: true, deadline: tomorrow }, 'tutor-2', now);

      expect(session.selfEvalReleased).toBe(true);
      expect(session.selfEvalDeadline).toBe(tomorrow);
      expect(session.peerEvalReleased).toBe(false);
      expect(session.releasedAt).toBe(now);
      expect(session.releasedBy).toBe('tutor-2');
    });

    it('releases peer evaluation with and without a deadline', () => {
      const session = newSession();

      session.changeRelease('peer', { released: true, deadline: tomorrow }, 'tutor-1', now);
      expect(session.peerEvalDeadline).toBe(tomorrow);

      session.changeRelease('peer', { released: true, deadline: null }, 'tutor-1', now);
      expect(session.peerEvalDeadline).toBeNull();
      expect(session.releasedBy).toBe('tutor-1');
    });

    it('rejects a deadline in the past', () => {
      const session = newSession();

      expect(() =>
        session.changeRelease('peer', { released: true, deadline: yesterday }, 'tutor-1', now),
      ).toThrow(InvalidSessionError);
      expect(session.peerEvalReleased).toBe(false);
    });

    it('is open only while released and before the deadline', () => {
      const session = newSession();
      session.changeRelease('self', { released: true, deadline: tomorrow }, 'tutor-1', now);

      expect(session.isReleaseOpen('self', now)).toBe(true);
      expect(session.isReleaseOpen('self', tomorrow)).toBe(false);
      expect(session.isReleaseOpen('peer', now)).toBe(false);
    });

    it('closes submissions when released is turned off', () => {
      const session = newSession();
      session.changeRelease('self', { released: true, deadline: null }, 'tutor-1', now);

      session.changeRelease('self', { released: false, deadline: null }, 'tutor-1', now);

      expect(session.isReleaseOpen('self', now)).toBe(false);
    });
  });
});
