import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitmentTermsService } from '@/services/commitmentTerms.service';
import { TermsAndPrivacyContent } from './TermsAndPrivacyContent';

vi.mock('@/services/commitmentTerms.service');

describe('TermsAndPrivacyContent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders fallback content and fetches current term from backend', async () => {
    const mockTerm = {
      versao: '1.2',
      titulo: 'Termos de Uso e Política de Privacidade – PBL360',
      texto: `# Termos de Uso e Política de Privacidade – PBL360

**Versão 1.2 (MVP Acadêmico e Conformidade LGPD – Lei nº 13.709/2018)** • *Atualizado em 17 de novembro de 2026*

O **PBL360** é uma aplicação web experimental da UEFS.

---

### 1. Objeto e Condições de Acesso

O sistema destina-se ao registro pedagógico.

> ### 3. Limitação de Responsabilidade (Leia com Atenção)
> O PBL360 é fornecido no estado em que se encontra.

### 7. Propriedade Intelectual e Canal de Atendimento

Para dúvidas contate contato.pbl360@gmail.com.`,
    };
    vi.mocked(commitmentTermsService.getCurrentTerm).mockResolvedValueOnce(mockTerm);

    render(<TermsAndPrivacyContent />);

    const versionElements = await screen.findAllByText(
      /Versão 1.2 \(MVP Acadêmico e Conformidade LGPD/i,
    );
    expect(versionElements.length).toBeGreaterThan(0);
    expect(screen.getByText('1. Objeto e Condições de Acesso')).toBeInTheDocument();
    expect(
      screen.getByText('3. Limitação de Responsabilidade (Leia com Atenção)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contato.pbl360@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:contato.pbl360@gmail.com',
    );
  });
});
