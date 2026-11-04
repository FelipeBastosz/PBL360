import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProblemTopActions } from './ProblemTopActions';

describe('ProblemTopActions', () => {
  it('renders both Relatório Final and Fórmulas when user is professor', () => {
    render(
      <MemoryRouter>
        <ProblemTopActions isProfessor={true} roomId="room-123" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /relatório final/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fórmulas/i })).toBeInTheDocument();
  });

  it('renders nothing when user is not professor', () => {
    const { container } = render(
      <MemoryRouter>
        <ProblemTopActions isProfessor={false} roomId="room-123" problemId="prob-1" />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
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
