import { UserType } from '../enums/user-type.enum';

export interface UserProps {
  id?: string;
  nome: string;
  email: string;
  senhaHash: string;
  matricula?: string | null;
  fotoUrl?: string | null;
  tipo: UserType;
  ativo?: boolean;
  criadoEm?: Date;
}

export class User {
  protected readonly _id?: string;
  protected _nome: string;
  protected _email: string;
  protected _senhaHash: string;
  protected _matricula: string | null;
  protected _fotoUrl: string | null;
  protected readonly _tipo: UserType;
  protected _ativo: boolean;
  protected readonly _criadoEm: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._nome = props.nome;
    this._email = props.email;
    this._senhaHash = props.senhaHash;
    this._matricula = props.matricula ?? null;
    this._fotoUrl = props.fotoUrl ?? null;
    this._tipo = props.tipo;
    this._ativo = props.ativo ?? true;
    this._criadoEm = props.criadoEm ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get nome(): string {
    return this._nome;
  }

  get email(): string {
    return this._email;
  }

  get senhaHash(): string {
    return this._senhaHash;
  }

  get matricula(): string | null {
    return this._matricula;
  }

  get fotoUrl(): string | null {
    return this._fotoUrl;
  }

  get tipo(): UserType {
    return this._tipo;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  get criadoEm(): Date {
    return this._criadoEm;
  }

  public isTutor(): boolean {
    return this._tipo === UserType.TUTOR;
  }

  public isAluno(): boolean {
    return this._tipo === UserType.ALUNO;
  }

  public desativar(): void {
    this._ativo = false;
  }

  public ativar(): void {
    this._ativo = true;
  }
}
