import type { DataSource } from 'typeorm';
import { PgUserRepository } from './pg-user.repository';
import { User } from '../domain/entities/user.entity';
import { UserType } from '../domain/enums/user-type.enum';

describe('PgUserRepository', () => {
  let repository: PgUserRepository;
  let dataSourceMock: jest.Mocked<Partial<DataSource>>;

  const dbRowMock = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nome: 'Felipe Bastos',
    email: 'felipe@uefs.br',
    senha_hash: 'hashed_password',
    matricula: '20201010',
    foto_url: null,
    tipo: 'ALUNO',
    ativo: true,
    criado_em: new Date(),
  };

  beforeEach(() => {
    dataSourceMock = {
      query: jest.fn(),
    };

    repository = new PgUserRepository(dataSourceMock as unknown as DataSource);
  });

  describe('findByEmail', () => {
    it('should return a mapped User when found', async () => {
      (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([dbRowMock]);

      const result = await repository.findByEmail('felipe@uefs.br');

      expect(dataSourceMock.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['felipe@uefs.br'],
      );
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(dbRowMock.id);
      expect(result?.email).toBe(dbRowMock.email);
      expect(result?.tipo).toBe(UserType.ALUNO);
    });

    it('should return null when user is not found', async () => {
      (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findByEmail('inexistente@uefs.br');

      expect(result).toBeNull();
    });
  });

  describe('findByID', () => {
    it('should return a mapped User when found', async () => {
      (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([dbRowMock]);

      const result = await repository.findByID(dbRowMock.id);

      expect(dataSourceMock.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [
        dbRowMock.id,
      ]);
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(dbRowMock.id);
    });

    it('should return null when user is not found', async () => {
      (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.findByID('random-id');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should insert and return a mapped User', async () => {
      (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([dbRowMock]);

      const newUser = new User({
        nome: dbRowMock.nome,
        email: dbRowMock.email,
        senhaHash: dbRowMock.senha_hash,
        matricula: dbRowMock.matricula,
        fotoUrl: dbRowMock.foto_url,
        tipo: UserType.ALUNO,
        ativo: true,
      });

      const result = await repository.save(newUser);

      expect(dataSourceMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuario'),
        [
          newUser.nome,
          newUser.email,
          newUser.senhaHash,
          newUser.matricula,
          newUser.fotoUrl,
          newUser.tipo,
          newUser.ativo,
        ],
      );
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(dbRowMock.id);
    });
  });
});
