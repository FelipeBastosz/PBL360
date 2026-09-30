import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import FormulasPage from './FormulasPage';
import { performanceTableService } from '@/services/performance-table.service';

vi.mock('@/services/performance-table.service', () => {
  return {
    performanceTableService: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

describe('FormulasPage', () => {
  const mockSummaries = [
    {
      id: 'mock-table-1',
      nome: 'Fórmula Padrão',
      descricao: 'Padrão',
      quantidadeCriterios: 3,
      quantidadeProblemas: 0,
      isDefault: true,
      criadoEm: '2026-09-01T10:00:00.000Z',
      atualizadoEm: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'mock-table-2',
      nome: 'Apenas participação',
      descricao: null,
      quantidadeCriterios: 1,
      quantidadeProblemas: 0,
      criadoEm: '2026-09-01T10:00:00.000Z',
      atualizadoEm: '2026-09-01T10:00:00.000Z',
    },
  ];

  const mockDetails = {
    'mock-table-1': {
      id: 'mock-table-1',
      professorId: 'mock-prof-1',
      nome: 'Fórmula Padrão',
      descricao: 'Padrão',
      quantidadeProblemas: 0,
      isDefault: true,
      criadoEm: '2026-09-01T10:00:00.000Z',
      atualizadoEm: '2026-09-01T10:00:00.000Z',
      criterios: [
        { id: 'c1', nome: 'Seguimento', peso: 30, ordem: 1, descricao: null },
        { id: 'c2', nome: 'Comportamento', peso: 20, ordem: 2, descricao: null },
        { id: 'c3', nome: 'Participação', peso: 50, ordem: 3, descricao: null },
      ],
    },
    'mock-table-2': {
      id: 'mock-table-2',
      professorId: 'mock-prof-1',
      nome: 'Apenas participação',
      descricao: null,
      quantidadeProblemas: 0,
      criadoEm: '2026-09-01T10:00:00.000Z',
      atualizadoEm: '2026-09-01T10:00:00.000Z',
      criterios: [{ id: 'c4', nome: 'Participação', peso: 100, ordem: 1, descricao: null }],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    vi.mocked(performanceTableService.getById).mockImplementation((id: string) =>
      Promise.resolve(mockDetails[id as keyof typeof mockDetails]),
    );
  });

  const renderComponent = () =>
    render(
      <AuthContext.Provider
        value={{
          user: {
            id: 'mock-user',
            nome: 'Teste',
            email: 'teste@uefs.br',
            tipo: 'PROFESSOR',
            criadoEm: '2026',
            matricula: '123',
            possuiFoto: false,
            ativo: true,
          },
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <FormulasPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

  it('renders the formulas list', async () => {
    renderComponent();
    expect(await screen.findByText('Fórmula Padrão')).toBeInTheDocument();
    expect(screen.getByText('Apenas participação')).toBeInTheDocument();
  });

  it('filters the formulas using the search bar', async () => {
    renderComponent();
    await screen.findByText('Fórmula Padrão');

    const input = screen.getByPlaceholderText('Pesquisar fórmula');
    fireEvent.change(input, { target: { value: 'padrão' } });

    expect(screen.getByText('Fórmula Padrão')).toBeInTheDocument();
    expect(screen.queryByText('Apenas participação')).not.toBeInTheDocument();
  });

  it('expands a formula to show its criteria', async () => {
    renderComponent();
    const defaultFormula = await screen.findByText('Fórmula Padrão');
    fireEvent.click(defaultFormula);

    expect(await screen.findByText('Seguimento')).toBeInTheDocument();
    expect(screen.getByText('Comportamento')).toBeInTheDocument();
    expect(screen.getByText('Participação')).toBeInTheDocument();
  });

  it('does not allow editing the name of the default formula', async () => {
    renderComponent();
    const defaultFormula = await screen.findByText('Fórmula Padrão');
    fireEvent.click(defaultFormula);

    const editButtons = await screen.findAllByRole('button');
    const editBtn = editButtons.find(
      (b) => b.innerHTML.includes('path') && !b.innerHTML.includes('Trash'),
    );
    if (editBtn) fireEvent.click(editBtn);

    expect(screen.getByText('Fórmula Padrão')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nome da fórmula')).not.toBeInTheDocument();

    expect(screen.getByText('Seguimento')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nome do critério')).not.toBeInTheDocument();
  });

  it('allows editing weights and validates 100% sum', async () => {
    renderComponent();

    const defaultFormula = await screen.findByText('Fórmula Padrão');
    fireEvent.click(defaultFormula);
    await screen.findByText('Seguimento');

    const editBtns = screen.getAllByRole('button');
    fireEvent.click(editBtns[1]);

    const weightInputs = await screen.findAllByDisplayValue(/%/);
    expect(weightInputs).toHaveLength(3);

    fireEvent.change(weightInputs[0], { target: { value: '10%' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(
      await screen.findByText('A soma dos critérios deve ser igual a 100% para salvar.'),
    ).toBeInTheDocument();
  });
});
