import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { useAuth } from '@/hooks/useAuth';
import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';
import { MyFormulasPage } from './MyFormulasPage';
import { MyFormulaDetailPage } from './MyFormulaDetailPage';
import { ManageMyFormulasPage } from './ManageMyFormulasPage';
import { CreateMyFormulaPage } from './CreateMyFormulaPage';
import { EditMyFormulaPage } from './EditMyFormulaPage';

vi.mock('@/services/performance-table.service');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockTeacher = { id: 'prof-123', nome: 'Professor Carlos', name: 'Professor Carlos' };

const mockTables: PerformanceTableSummary[] = [
  {
    id: 'f-padrao-1',
    nome: 'Fórmula Padrão Oficial',
    descricao: 'Padrão do sistema',
    quantidadeCriterios: 3,
    isDefault: true,
    origem: 'PADRAO',
  },
  {
    id: 'f-turma-1',
    nome: 'Fórmula da Turma XYZ',
    descricao: 'Criada para a turma',
    quantidadeCriterios: 4,
    origem: 'TURMA',
    professorId: 'prof-123',
  },
  {
    id: 'f-outro-prof',
    nome: 'Fórmula de Outro Professor',
    descricao: 'Pertence a outro',
    quantidadeCriterios: 2,
    professorId: 'outro-prof-id',
    isDefault: false,
  },
  {
    id: 'f-original-1',
    nome: 'Minha Fórmula de Algoritmos',
    descricao: 'Fórmula pessoal para módulo de algoritmos',
    quantidadeCriterios: 2,
    professorId: 'prof-123',
    isDefault: false,
  },
  {
    id: 'f-original-2',
    nome: 'Minha Fórmula Especial de Apresentação',
    descricao: 'Fórmula pessoal para seminários',
    quantidadeCriterios: 3,
    professorId: 'prof-123',
    isDefault: false,
  },
];

const mockDetail: PerformanceTable = {
  id: 'f-original-1',
  professorId: 'prof-123',
  nome: 'Minha Fórmula de Algoritmos',
  descricao: 'Fórmula pessoal para módulo de algoritmos',
  criterios: [
    { id: 'crit-1', nome: 'Lógica', descricao: 'Avalia raciocínio', peso: 6, ordem: 1 },
    { id: 'crit-2', nome: 'Clareza', descricao: 'Avalia código limpo', peso: 4, ordem: 2 },
  ],
  criadoEm: '2026-03-01T10:00:00Z',
  atualizadoEm: '2026-03-01T10:00:00Z',
};

describe('MyFormulas - Módulo Desvinculado de Minhas Fórmulas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockTeacher,
      isAuthenticated: true,
      token: 'fake-jwt',
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      verifyAccount: vi.fn(),
      resendVerification: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  describe('MyFormulasPage (Listagem)', () => {
    it('renders header "Minhas Fórmulas" and exclusively original formulas without author name or trash icon', async () => {
      vi.mocked(performanceTableService.list).mockResolvedValue(mockTables);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas']}>
          <MyFormulasPage />
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Minhas Fórmulas' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Minhas fórmulas · 2/i)).toBeInTheDocument();

      expect(screen.getByText('Minha Fórmula de Algoritmos')).toBeInTheDocument();
      expect(screen.getByText('Minha Fórmula Especial de Apresentação')).toBeInTheDocument();

      expect(screen.queryByText('Professor Carlos')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /excluir fórmula/i })).not.toBeInTheDocument();

      expect(screen.queryByText('Fórmula Padrão Oficial')).not.toBeInTheDocument();
      expect(screen.queryByText('Fórmula da Turma XYZ')).not.toBeInTheDocument();
      expect(screen.queryByText('Fórmula de Outro Professor')).not.toBeInTheDocument();
    });

    it('filters formulas using the search field with standard container', async () => {
      vi.mocked(performanceTableService.list).mockResolvedValue(mockTables);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas']}>
          <MyFormulasPage />
        </MemoryRouter>,
      );

      await screen.findByText('Minha Fórmula de Algoritmos');
      const searchInput = screen.getByLabelText('Pesquisar fórmula');
      await userEvent.type(searchInput, 'Especial');

      expect(screen.getByText('Minha Fórmula Especial de Apresentação')).toBeInTheDocument();
      expect(screen.queryByText('Minha Fórmula de Algoritmos')).not.toBeInTheDocument();
    });
  });

  describe('MyFormulaDetailPage (Visualização somente leitura)', () => {
    it('renders details without "Editar fórmula" button', async () => {
      vi.mocked(performanceTableService.getById).mockResolvedValue(mockDetail);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas/f-original-1']}>
          <Routes>
            <Route path="/minhas-formulas/:id" element={<MyFormulaDetailPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Minha Fórmula de Algoritmos' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Lógica')).toBeInTheDocument();
      expect(screen.getByText('Clareza')).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /editar fórmula/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Aplicar fórmula' })).not.toBeInTheDocument();
    });
  });

  describe('ManageMyFormulasPage (Seleção para edição via FAB)', () => {
    it('lists exclusively teacher original formulas and allows selection to edit', async () => {
      vi.mocked(performanceTableService.list).mockResolvedValue(mockTables);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas/gerenciar']}>
          <Routes>
            <Route path="/minhas-formulas/gerenciar" element={<ManageMyFormulasPage />} />
            <Route path="/minhas-formulas/:id/editar" element={<p>Página de Edição</p>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Minha Fórmula de Algoritmos')).toBeInTheDocument();
      expect(screen.getByText('Minha Fórmula Especial de Apresentação')).toBeInTheDocument();
      expect(screen.queryByText('Fórmula Padrão Oficial')).not.toBeInTheDocument();
      expect(screen.queryByText('Fórmula de Outro Professor')).not.toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: 'Selecionar fórmula' });
      expect(submitBtn).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'Minha Fórmula de Algoritmos' }));
      expect(submitBtn).toBeEnabled();

      await userEvent.click(submitBtn);
      expect(screen.getByText('Página de Edição')).toBeInTheDocument();
    });
  });

  describe('CreateMyFormulaPage (Criação de nova fórmula pessoal)', () => {
    it('creates a new formula without roomId and navigates back to /minhas-formulas', async () => {
      vi.mocked(performanceTableService.create).mockResolvedValue({
        ...mockDetail,
        id: 'new-id',
        nome: 'Fórmula Inédita',
      });

      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/minhas-formulas/nova', state: { nome: 'Fórmula Inédita' } },
          ]}
        >
          <Routes>
            <Route path="/minhas-formulas/nova" element={<CreateMyFormulaPage />} />
            <Route path="/minhas-formulas" element={<p>Lista de Minhas Fórmulas</p>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByDisplayValue('Fórmula Inédita')).toBeInTheDocument();
      expect(screen.getByText('Soma dos pesos')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salvar fórmula/i })).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: '+Adicionar critério' }));
      await userEvent.type(screen.getByLabelText('Nome do critério'), 'Pontualidade');
      const weightInput = screen.getByLabelText('Peso (0 a 10)');
      await userEvent.clear(weightInput);
      await userEvent.type(weightInput, '10');
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

      const saveButton = screen.getByRole('button', { name: /salvar fórmula/i });
      expect(saveButton).toBeEnabled();
      await userEvent.click(saveButton);

      expect(performanceTableService.create).toHaveBeenCalledWith({
        nome: 'Fórmula Inédita',
        descricao: undefined,
        criterios: [
          {
            nome: 'Pontualidade',
            descricao: undefined,
            peso: 10,
            ordem: 1,
          },
        ],
        roomId: undefined,
      });

      expect(await screen.findByText('Lista de Minhas Fórmulas')).toBeInTheDocument();
    });

    it('allows adding criteria exceeding 10, displays warning and keeps save button disabled until equal to 10', async () => {
      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/minhas-formulas/nova', state: { nome: 'Fórmula Pessoal' } },
          ]}
        >
          <Routes>
            <Route path="/minhas-formulas/nova" element={<CreateMyFormulaPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByDisplayValue('Fórmula Pessoal');
      const saveBtn = screen.getByRole('button', { name: /salvar fórmula/i });
      expect(saveBtn).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: '+Adicionar critério' }));
      await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério 1');
      const weightInput = screen.getByLabelText('Peso (0 a 10)');
      await userEvent.clear(weightInput);
      await userEvent.type(weightInput, '7');
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

      expect(screen.getByText('Critério 1')).toBeInTheDocument();
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
      expect(screen.getByText(/A soma dos pesos deve ser exatamente 10/i)).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: '+Adicionar critério' }));
      await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério 2');
      const weightInput2 = screen.getByLabelText('Peso (0 a 10)');
      await userEvent.clear(weightInput2);
      await userEvent.type(weightInput2, '5');
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

      expect(screen.getByText('Critério 2')).toBeInTheDocument();
      expect(screen.getByText('12 / 10')).toBeInTheDocument();
      expect(screen.getByText(/A soma dos pesos ultrapassou 10/i)).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'Editar critério Critério 2' }));
      const editWeight = screen.getByLabelText('Peso');
      await userEvent.clear(editWeight);
      await userEvent.type(editWeight, '3');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar Edição' }));

      expect(screen.getByText('10 / 10')).toBeInTheDocument();
      expect(screen.queryByText(/A soma dos pesos (ultrapassou|deve)/i)).not.toBeInTheDocument();
      expect(saveBtn).toBeEnabled();
    });

    it('formats decimal weights with comma and at most one decimal place', async () => {
      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/minhas-formulas/nova', state: { nome: 'Fórmula Pessoal' } },
          ]}
        >
          <Routes>
            <Route path="/minhas-formulas/nova" element={<CreateMyFormulaPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByDisplayValue('Fórmula Pessoal');
      await userEvent.click(screen.getByRole('button', { name: '+Adicionar critério' }));
      await userEvent.type(screen.getByLabelText('Nome do critério'), 'Critério Decimal');
      const weightInput = screen.getByLabelText('Peso (0 a 10)');
      await userEvent.clear(weightInput);
      await userEvent.type(weightInput, '5.55');
      expect(weightInput).toHaveValue('5,5');

      await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
      expect(screen.getByText('5,5')).toBeInTheDocument();
      expect(screen.getByText('5,5 / 10')).toBeInTheDocument();
    });
  });

  describe('EditMyFormulaPage (Edição e exclusão de fórmula original)', () => {
    it('updates teacher original formula and prompts warning modal explaining original formula scope', async () => {
      vi.mocked(performanceTableService.getById).mockResolvedValue(mockDetail);
      vi.mocked(performanceTableService.update).mockResolvedValue(mockDetail);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas/f-original-1/editar']}>
          <Routes>
            <Route path="/minhas-formulas/:id/editar" element={<EditMyFormulaPage />} />
            <Route path="/minhas-formulas" element={<p>Lista de Minhas Fórmulas</p>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(await screen.findByText('Lógica')).toBeInTheDocument();
      expect(screen.getByText('Clareza')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

      expect(screen.getByText('Salvar alterações na fórmula?')).toBeInTheDocument();
      expect(screen.getByText(/apenas na sua fórmula original/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Cópias já associadas ou utilizadas em sessões/i),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

      expect(performanceTableService.update).toHaveBeenCalledWith('f-original-1', {
        nome: 'Minha Fórmula de Algoritmos',
        descricao: 'Fórmula pessoal para módulo de algoritmos',
        criterios: [
          { id: 'crit-1', nome: 'Lógica', descricao: 'Avalia raciocínio', ordem: 1, peso: 6 },
          { id: 'crit-2', nome: 'Clareza', descricao: 'Avalia código limpo', ordem: 2, peso: 4 },
        ],
      });

      expect(await screen.findByText('Lista de Minhas Fórmulas')).toBeInTheDocument();
    });

    it('allows deleting the formula from the edit page', async () => {
      vi.mocked(performanceTableService.getById).mockResolvedValue(mockDetail);
      vi.mocked(performanceTableService.remove).mockResolvedValue(undefined);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas/f-original-1/editar']}>
          <Routes>
            <Route path="/minhas-formulas/:id/editar" element={<EditMyFormulaPage />} />
            <Route path="/minhas-formulas" element={<p>Lista de Minhas Fórmulas</p>} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByText('Lógica');
      await userEvent.click(screen.getByRole('button', { name: 'Excluir essa fórmula' }));

      expect(screen.getByText('Excluir fórmula?')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir fórmula' }));

      expect(performanceTableService.remove).toHaveBeenCalledWith('f-original-1');
      expect(await screen.findByText('Lista de Minhas Fórmulas')).toBeInTheDocument();
    });

    it('disables save button and displays warning when criterion deletion makes weight sum different from 10', async () => {
      vi.mocked(performanceTableService.getById).mockResolvedValue(mockDetail);

      render(
        <MemoryRouter initialEntries={['/minhas-formulas/f-original-1/editar']}>
          <Routes>
            <Route path="/minhas-formulas/:id/editar" element={<EditMyFormulaPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByText('Lógica');
      const concludeBtn = screen.getByRole('button', { name: 'Concluir edição' });
      expect(concludeBtn).toBeEnabled();
      expect(screen.getByText('10 / 10')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Excluir critério Clareza' }));
      expect(screen.getByRole('heading', { name: 'Excluir critério?' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir critério' }));

      expect(concludeBtn).toBeDisabled();
      expect(screen.getByText('6 / 10')).toBeInTheDocument();
      expect(screen.getByText(/A soma dos pesos deve ser exatamente 10/i)).toBeInTheDocument();
    });
  });
});
