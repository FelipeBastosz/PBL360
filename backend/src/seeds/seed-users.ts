import { UserType } from '@/users/domain/enums/user-type.enum';

export interface SeedUserData {
  name: string;
  email: string;
  type: UserType;
  registrationNumber?: string;
}

export const SEED_USERS: SeedUserData[] = [
  {
    name: 'Carlos Mendes',
    email: 'carlos@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Maria Santos',
    email: 'maria@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Ana Souza',
    email: '20240001@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240001',
  },
  {
    name: 'João Silva',
    email: '20240002@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240002',
  },
  {
    name: 'Roberto Almeida',
    email: 'roberto@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Fernanda Lima',
    email: 'fernanda@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Paulo Ribeiro',
    email: 'paulo@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Juliana Costa',
    email: 'juliana@uefs.br',
    type: UserType.TUTOR,
  },
  {
    name: 'Beatriz Oliveira',
    email: '20240003@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240003',
  },
  {
    name: 'Lucas Pereira',
    email: '20240004@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240004',
  },
  {
    name: 'Camila Rocha',
    email: '20240005@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240005',
  },
  {
    name: 'Gabriel Fernandes',
    email: '20240006@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240006',
  },
  {
    name: 'Larissa Carvalho',
    email: '20240007@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240007',
  },
  {
    name: 'Rafael Gomes',
    email: '20240008@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240008',
  },
  {
    name: 'Mariana Barbosa',
    email: '20240009@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240009',
  },
  {
    name: 'Pedro Araújo',
    email: '20240010@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240010',
  },
  {
    name: 'Isabela Martins',
    email: '20240011@discente.uefs.br',
    type: UserType.STUDENT,
    registrationNumber: '20240011',
  },
];
