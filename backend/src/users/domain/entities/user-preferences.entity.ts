import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserTheme } from '../enums/user-theme.enum';
import { InvalidUserError } from '../errors/invalid-user.error';
import { User } from './user.entity';

export const DEFAULT_USER_THEME = UserTheme.LIGHT;

// Base brand blue (--color-brand-900 in frontend/src/styles/index.css and theme-color in index.html).
export const DEFAULT_SYSTEM_COLOR = '#000077';

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface UserPreferencesProps {
  userId: string;
  theme?: UserTheme;
  color?: string;
}

@Entity('user_preferences')
@Check('chk_user_preferences_theme', `theme IN ('LIGHT', 'DARK')`)
@Check('chk_user_preferences_color', `color ~ '^#[0-9A-F]{6}$'`)
export class UserPreferences {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_user_preferences_user' })
  user?: User;

  @Column({ type: 'varchar', length: 10, default: DEFAULT_USER_THEME })
  theme: UserTheme;

  @Column({ type: 'varchar', length: 7, default: DEFAULT_SYSTEM_COLOR })
  color: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  static defaults(userId: string): UserPreferences {
    const preferences = new UserPreferences();
    preferences.userId = userId;
    preferences.theme = DEFAULT_USER_THEME;
    preferences.color = DEFAULT_SYSTEM_COLOR;

    return preferences;
  }

  static create(props: UserPreferencesProps): UserPreferences {
    const preferences = new UserPreferences();
    preferences.userId = props.userId;
    preferences.theme =
      props.theme === undefined ? DEFAULT_USER_THEME : UserPreferences.parseTheme(props.theme);
    preferences.color =
      props.color === undefined
        ? DEFAULT_SYSTEM_COLOR
        : UserPreferences.normalizeColor(props.color);

    return preferences;
  }

  static parseTheme(theme: unknown): UserTheme {
    if (theme === UserTheme.LIGHT || theme === UserTheme.DARK) {
      return theme;
    }

    throw new InvalidUserError('O tema deve ser CLARO ou ESCURO.');
  }

  static normalizeColor(color: unknown): string {
    if (typeof color !== 'string' || !HEX_COLOR_PATTERN.test(color)) {
      throw new InvalidUserError('A cor deve estar no formato hexadecimal completo #RRGGBB.');
    }

    return color.toUpperCase();
  }

  withUpdates(patch: { theme?: UserTheme; color?: string }): UserPreferences {
    return UserPreferences.create({
      userId: this.userId,
      theme: patch.theme === undefined ? this.theme : patch.theme,
      color: patch.color === undefined ? this.color : patch.color,
    });
  }
}
