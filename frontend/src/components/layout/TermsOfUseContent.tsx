import { PROJECT_EMAIL } from '@/content/projectInfo';

function TermsHeader() {
  return (
    <div className="border-b border-border-subtle pb-3">
      <p className="text-xs font-medium text-muted">
        Versão 1.1 (MVP Acadêmico) &bull; Atualizado em 16 de novembro de 2026
      </p>
      <p className="mt-2 text-sm text-muted">
        O <strong className="text-brand-accent">PBL360</strong> é uma aplicação web experimental
        desenvolvida na disciplina EXA613 – Engenharia de Software na Universidade Estadual de Feira
        de Santana (UEFS), sob tutoria da Profa. Dra. Larissa Rocha Soares Bastos. O sistema possui
        caráter estritamente acadêmico e sem fins lucrativos.
      </p>
    </div>
  );
}

function TermsScope() {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-brand-accent">1. Objeto e Condições de Acesso</h3>
      <p className="text-xs leading-relaxed text-muted">
        O sistema destina-se ao registro, acompanhamento e avaliação de sessões tutoriais baseadas
        na metodologia PBL, bem como à comunicação direta via chat entre alunos e professores. O
        acesso é restrito a estudantes, tutores e docentes autorizados pela coordenação da
        disciplina. Cada usuário é responsável pela veracidade dos dados cadastrais e pela guarda de
        suas credenciais de acesso.
      </p>
    </section>
  );
}

function TermsLiability() {
  return (
    <section className="flex flex-col gap-1.5 rounded-xl border border-warning-line bg-warning-soft p-3 text-xs">
      <h3 className="font-semibold uppercase tracking-wide text-warning">
        2. Limitação de Responsabilidade (Leia com Atenção)
      </h3>
      <p className="font-medium leading-relaxed text-warning">
        O PBL360 é fornecido &ldquo;no estado em que se encontra&rdquo; (as-is), sujeito a falhas,
        instabilidades ou manutenções sem aviso prévio. O sistema tem caráter auxiliar e NÃO
        substitui os sistemas acadêmicos oficiais da UEFS. A equipe desenvolvedora e a universidade
        não respondem por indisponibilidades técnicas ou eventuais perdas de dados transitórios.
      </p>
    </section>
  );
}

function TermsChatRules() {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-brand-accent">
        3. Sistema de Chat entre Aluno e Professor
      </h3>
      <p className="text-xs leading-relaxed text-muted">
        O canal de mensagens e chat integrado destina-se exclusivamente ao suporte pedagógico,
        orientação acadêmica e esclarecimento de dúvidas entre estudantes e docentes da disciplina.
        As comunicações não são anônimas e ficam vinculadas às respectivas contas institucionais. É
        vedado utilizar o chat para envio de conteúdos ilícitos, ofensivos, assédio, spam ou
        compartilhamento desnecessário de dados sensíveis.
      </p>
    </section>
  );
}

function TermsRules() {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-brand-accent">
        4. Regras de Uso e Condutas Proibidas
      </h3>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
        <li>É proibido usar identidade falsa ou se passar por outro estudante ou docente.</li>
        <li>
          São vedadas tentativas de invasão, varreduras automatizadas, exploração de
          vulnerabilidades ou injeção de código.
        </li>
        <li>
          É expressamente vedado inserir comentários ofensivos, difamatórios ou que configurem
          assédio nas avaliações, feedbacks ou no chat.
        </li>
      </ul>
    </section>
  );
}

function TermsIntellectualPropertyAndContact() {
  return (
    <section className="flex flex-col gap-1.5 border-t border-border-subtle pt-3">
      <h3 className="text-sm font-semibold text-brand-accent">
        5. Propriedade Intelectual, Posse e Contato
      </h3>
      <p className="text-xs leading-relaxed text-muted">
        A autoria moral da propriedade intelectual do software e código-fonte pertence aos
        estudantes desenvolvedores, enquanto a posse institucional e patrimonial do projeto é da
        Universidade Estadual de Feira de Santana (UEFS). Feedbacks, avaliações e mensagens
        pertencem aos seus autores, licenciados para o processamento pedagógico no sistema.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        Para dúvidas, notificações ou suporte acadêmico, entre em contato pelo e-mail:{' '}
        <a
          href={`mailto:${PROJECT_EMAIL}`}
          className="font-medium text-brand-accent underline underline-offset-2 hover:text-brand-accent"
        >
          {PROJECT_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}

export function TermsOfUseContent() {
  return (
    <div className="flex flex-col gap-4 text-left">
      <TermsHeader />
      <TermsScope />
      <TermsLiability />
      <TermsChatRules />
      <TermsRules />
      <TermsIntellectualPropertyAndContact />
    </div>
  );
}

export default TermsOfUseContent;
