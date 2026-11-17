import { useEffect, useState, type ReactNode } from 'react';
import {
  commitmentTermsService,
  type CurrentCommitmentTerm,
} from '@/services/commitmentTerms.service';
import { PROJECT_EMAIL } from '@/content/projectInfo';

const FALLBACK_TERM_1_2: CurrentCommitmentTerm = {
  versao: '1.2',
  titulo: 'Termos de Uso e Política de Privacidade – PBL360',
  texto: `# Termos de Uso e Política de Privacidade – PBL360

**Versão 1.2 (MVP Acadêmico e Conformidade LGPD – Lei nº 13.709/2018)** • *Atualizado em 17 de novembro de 2026*

O **PBL360** é uma aplicação web experimental, sem fins lucrativos, desenvolvida na disciplina **EXA613 – Engenharia de Software** da Universidade Estadual de Feira de Santana (UEFS), sob tutoria da Profa. Dra. Larissa Rocha Soares Bastos. Este documento estabelece as regras de utilização da plataforma e detalha como os seus dados pessoais são tratados para fins estritamente pedagógicos e de pesquisa acadêmica.

---

### 1. Objeto e Condições de Acesso

O sistema destina-se ao registro, acompanhamento e avaliação de sessões tutoriais baseadas na metodologia *Problem-Based Learning* (PBL), além de disponibilizar um canal de comunicação direta via chat entre alunos e professores.

* **Público Autorizado:** O acesso é restrito a estudantes, tutores e docentes devidamente autorizados pela coordenação da disciplina.
* **Responsabilidade da Conta:** Cada usuário é integralmente responsável pela veracidade das informações fornecidas no cadastro e pela guarda sigilosa de suas credenciais de acesso.

### 2. Regras de Uso, Chat e Condutas Proibidas

O chat integrado destina-se exclusivamente ao suporte pedagógico, orientação acadêmica e esclarecimento de dúvidas. As comunicações não são anônimas e permanecem vinculadas às respectivas contas institucionais. Ao utilizar o PBL360, o usuário compromete-se a não praticar as seguintes condutas:

* Utilizar identidade falsa ou passar-se por outro estudante, tutor ou docente;
* Realizar tentativas de invasão, varreduras automatizadas, exploração de vulnerabilidades ou injeção de código;
* Enviar ou publicar conteúdos ilícitos, ofensivos, difamatórios, spam, assédio ou compartilhar desnecessariamente dados sensíveis nas avaliações, feedbacks ou no chat.

> ### 3. Limitação de Responsabilidade (Leia com Atenção)
> 
> **O PBL360 é fornecido “no estado em que se encontra” (*as-is*), estando sujeito a falhas, instabilidades ou manutenções sem aviso prévio. A plataforma possui caráter estritamente auxiliar e NÃO substitui os sistemas acadêmicos oficiais da UEFS. A equipe desenvolvedora e a universidade não se responsabilizam por indisponibilidades técnicas ou eventuais perdas de dados transitórios.**

---

### 4. Dados Pessoais Coletados e Finalidades

Para viabilizar o funcionamento pedagógico da plataforma e cumprir exigências legais, coletamos e tratamos as seguintes categorias de dados:

* **Identificação:** Nome completo, e-mail institucional e tipo de perfil (para autenticação, controle de acesso e identificação nas turmas).
* **Segurança:** Senha de acesso, armazenada exclusivamente sob a forma de *hash* criptográfico irreversível (com *salt*).
* **Dados Acadêmicos:** Notas, autoavaliações, avaliações de pares e feedbacks das sessões tutoriais (para cálculo de médias e acompanhamento de desempenho).
* **Mensagens de Chat:** Conteúdo textual, data/hora e identificação de remetente e destinatário nas conversas entre aluno e professor (para fins de orientação acadêmica).
* **Registros de Conexão:** Endereço IP, data/hora e rotas de acesso (para segurança da aplicação e cumprimento obrigatório do Art. 15 do Marco Civil da Internet).

* Nota: O sistema não coleta nem processa dados pessoais sensíveis.

### 5. Segurança, Sigilo e Compartilhamento de Dados

* **Infraestrutura e Criptografia:** Todos os dados e mensagens trafegam em conexão criptografada (HTTPS/TLS) e são armazenados em provedores de nuvem certificados (Vercel, Render e Supabase/PostgreSQL).
* **Sigilo das Comunicações:** O acesso às mensagens do chat é restrito aos interlocutores envolvidos (aluno e professor), sendo permitido o acesso pela equipe técnica apenas em casos de auditoria acadêmica devidamente justificada.
* **Não Comercialização:** Nenhum dado pessoal ou acadêmico é vendido, alugado ou repassado a terceiros para fins comerciais ou publicitários.

### 6. Retenção, Direitos do Titular (LGPD) e Contato

Os dados cadastrais, registros acadêmicos e mensagens do chat são mantidos ativos durante o semestre letivo vigente. Ao término do período, os dados identificáveis serão definitivamente excluídos ou devidamente anonimizados para fins exclusivos de pesquisa acadêmica na UEFS.

Nos termos do **Art. 18 da Lei Geral de Proteção de Dados (LGPD)**, você pode confirmar a existência de tratamento, solicitar acesso, corrigir informações ou requerer a exclusão de sua conta a qualquer momento.

---

### 7. Propriedade Intelectual e Canal de Atendimento

A autoria moral do software e do código-fonte pertence aos estudantes desenvolvedores da disciplina, enquanto a posse institucional e patrimonial do projeto pertence à Universidade Estadual de Feira de Santana (UEFS). Os conteúdos inseridos (feedbacks, avaliações e mensagens) pertencem aos seus respectivos autores, sendo licenciados à plataforma apenas para o processamento pedagógico.

Para dúvidas, suporte acadêmico ou solicitações referentes aos seus dados pessoais, entre em contato com a equipe e o Encarregado de Dados pelo e-mail: [${PROJECT_EMAIL}](mailto:${PROJECT_EMAIL}).`,
};

function renderToken(token: string, key: number): ReactNode {
  if (token.startsWith('[') && token.includes('](mailto:')) {
    const label = token.slice(1, token.indexOf(']'));
    const mailto = token.slice(token.indexOf('](mailto:') + 9, -1);
    return (
      <a
        key={key}
        href={`mailto:${mailto}`}
        className="font-medium text-brand-900 underline underline-offset-2 hover:text-brand-700"
      >
        {label}
      </a>
    );
  }
  if (token.startsWith('**') && token.endsWith('**')) {
    return (
      <strong key={key} className="text-brand-900 font-semibold">
        {token.slice(2, -2)}
      </strong>
    );
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return (
      <em key={key} className="italic">
        {token.slice(1, -1)}
      </em>
    );
  }
  if (token.includes('@') && !token.startsWith('http')) {
    return (
      <a
        key={key}
        href={`mailto:${token}`}
        className="font-medium text-brand-900 underline underline-offset-2 hover:text-brand-700"
      >
        {token}
      </a>
    );
  }
  return token;
}

function renderInlineText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex =
    /(\[.*?\]\(mailto:.*?\)|\*\*.*?\*\*|\*.*?\*|https?:\/\/[^\s)]+|[\w.-]+@[\w.-]+\.\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(renderToken(match[0], match.index));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderBlock(block: string, index: number): ReactNode {
  const trimmed = block.trim();
  if (!trimmed || trimmed.startsWith('# ')) return null;

  if (trimmed === '---') {
    return <hr key={index} className="border-black/5 my-1" />;
  }

  if (trimmed.startsWith('>')) {
    const cleanContent = trimmed
      .split('\n')
      .map((line) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();
    const titleMatch = cleanContent.match(/^###\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '';
    const body = cleanContent.replace(/^###\s+.*$/m, '').trim();

    return (
      <section
        key={index}
        className="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs"
      >
        {title ? (
          <h3 className="font-semibold uppercase tracking-wide text-amber-950">{title}</h3>
        ) : null}
        <p className="font-medium leading-relaxed text-amber-900">{renderInlineText(body)}</p>
      </section>
    );
  }

  if (trimmed.startsWith('### ')) {
    const lines = trimmed.split('\n');
    const header = lines[0].replace('### ', '').trim();
    const rest = lines.slice(1).join('\n').trim();

    return (
      <section key={index} className="flex flex-col gap-1.5 text-left">
        <h3 className="text-sm font-semibold text-brand-900">{header}</h3>
        {rest ? renderSectionBody(rest) : null}
      </section>
    );
  }

  return renderSectionBody(trimmed, index);
}

function renderSectionBody(text: string, key?: number): ReactNode {
  const lines = text.split('\n');
  const listItems: string[] = [];
  const paragraphs: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      paragraphs.push(
        <ul
          key={`ul-${paragraphs.length}`}
          className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineText(item)}</li>
          ))}
        </ul>,
      );
      listItems.length = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('* ') || line.startsWith('- ')) {
      listItems.push(line.slice(2));
    } else if (line) {
      flushList();
      paragraphs.push(
        <p key={`p-${paragraphs.length}`} className="text-xs leading-relaxed text-muted">
          {renderInlineText(line)}
        </p>,
      );
    }
  }
  flushList();

  return (
    <div key={key} className="flex flex-col gap-2">
      {paragraphs}
    </div>
  );
}

export function TermsAndPrivacyContent() {
  const [term, setTerm] = useState<CurrentCommitmentTerm>(FALLBACK_TERM_1_2);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    commitmentTermsService
      .getCurrentTerm()
      .then((data) => {
        if (isMounted && data) {
          setTerm(data);
        }
      })
      .catch(() => {
        // Keeps fallback if API is unreachable
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const blocks = term.texto.split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="border-b border-black/5 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted">
            Versão {term.versao} (MVP Acadêmico e Conformidade LGPD – Lei nº 13.709/2018)
          </p>
          {isLoading && (
            <span className="text-[10px] text-brand-700 animate-pulse">Atualizando...</span>
          )}
        </div>
      </div>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export default TermsAndPrivacyContent;
