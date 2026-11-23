import {
  DEFAULT_SYSTEM_COLOR,
  DEFAULT_USER_THEME,
  UserPreferences,
} from './user-preferences.entity';
import { UserTheme } from '../enums/user-theme.enum';
import { InvalidUserError } from '../errors/invalid-user.error';

describe('UserPreferences', () => {
  it('creates default preferences with LIGHT theme and DEFAULT_SYSTEM_COLOR', () => {
    const preferences = UserPreferences.defaults('user-1');

    expect(preferences.userId).toBe('user-1');
    expect(preferences.theme).toBe(DEFAULT_USER_THEME);
    expect(preferences.color).toBe(DEFAULT_SYSTEM_COLOR);
    expect(preferences.color).toBe('#000077');
  });

  it('normalizes lowercase hex colors to uppercase on create', () => {
    const preferences = UserPreferences.create({
      userId: 'user-1',
      theme: UserTheme.DARK,
      color: '#ff00aa',
    });

    expect(preferences.theme).toBe(UserTheme.DARK);
    expect(preferences.color).toBe('#FF00AA');
  });

  it('applies defaults for omitted fields on create', () => {
    const themeOnly = UserPreferences.create({ userId: 'user-1', theme: UserTheme.DARK });
    const colorOnly = UserPreferences.create({ userId: 'user-1', color: '#1a2b3c' });

    expect(themeOnly.theme).toBe(UserTheme.DARK);
    expect(themeOnly.color).toBe(DEFAULT_SYSTEM_COLOR);
    expect(colorOnly.theme).toBe(DEFAULT_USER_THEME);
    expect(colorOnly.color).toBe('#1A2B3C');
  });

  it('returns a new instance preserving unsent fields on withUpdates', () => {
    const original = UserPreferences.create({
      userId: 'user-1',
      theme: UserTheme.DARK,
      color: '#112233',
    });

    const updatedColor = original.withUpdates({ color: '#abcdef' });
    const updatedTheme = updatedColor.withUpdates({ theme: UserTheme.LIGHT });

    expect(original.color).toBe('#112233');
    expect(updatedColor.theme).toBe(UserTheme.DARK);
    expect(updatedColor.color).toBe('#ABCDEF');
    expect(updatedTheme.theme).toBe(UserTheme.LIGHT);
    expect(updatedTheme.color).toBe('#ABCDEF');
  });

  it.each([null, undefined, '', 'CLARO', 'AZUL', 123])(
    'rejects invalid theme value %p',
    (invalidTheme) => {
      expect(() => UserPreferences.parseTheme(invalidTheme)).toThrow(InvalidUserError);
    },
  );

  it.each([
    null,
    undefined,
    '',
    '#fff',
    '112233',
    '#GGGGGG',
    'blue',
    ' #112233',
    '#112233 ',
    '#11223344',
    123456,
  ])('rejects invalid color value %p', (invalidColor) => {
    expect(() => UserPreferences.normalizeColor(invalidColor)).toThrow(InvalidUserError);
  });
});
