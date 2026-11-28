import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProblemTopActions } from './ProblemTopActions';

describe('ProblemTopActions', () => {
  it('renders Relatório Final, Fórmulas, and Relatórios de Mesa when user is professor', () => {
    render(
      <MemoryRouter>
        <ProblemTopActions isProfessor={true} roomId="room-123" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fórmulas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /relatórios de mesa/i })).toBeInTheDocument();
  });

  it('renders only Relatórios de Mesa when user is not professor', () => {
    render(
      <MemoryRouter>
        <ProblemTopActions isProfessor={false} roomId="room-123" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: /relatório final/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fórmulas/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /relatórios de mesa/i })).toBeInTheDocument();
  });

  it('navigates to table reports when clicking Relatórios de Mesa', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/turmas/room-123/problemas/prob-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId"
            element={<ProblemTopActions isProfessor={false} roomId="room-123" problemId="prob-1" />}
          />
          <Route
            path="/turmas/:roomId/problemas/:problemId/relatorios-mesa"
            element={<p>Tela de Relatórios de Mesa</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /relatórios de mesa/i }));

    expect(await screen.findByText('Tela de Relatórios de Mesa')).toBeInTheDocument();
  });

  it('navigates to problem formula when clicking Fórmulas', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/turmas/room-123/problemas/prob-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId"
            element={<ProblemTopActions isProfessor={true} roomId="room-123" problemId="prob-1" />}
          />
          <Route
            path="/turmas/:roomId/problemas/:problemId/formula"
            element={<p>Tela da Fórmula</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const formulaBtn = screen.getByRole('button', { name: /fórmulas/i });
    await user.click(formulaBtn);

    expect(await screen.findByText('Tela da Fórmula')).toBeInTheDocument();
  });

  it('navigates to final report when clicking Relatório Final', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/turmas/room-123/problemas/prob-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId"
            element={<ProblemTopActions isProfessor={true} roomId="room-123" problemId="prob-1" />}
          />
          <Route
            path="/turmas/:roomId/problemas/:problemId/notas"
            element={<p>Tela do Relatório</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const reportBtn = screen.getByRole('button', { name: /relatório final/i });
    await user.click(reportBtn);

    expect(await screen.findByText('Tela do Relatório')).toBeInTheDocument();
  });
});
