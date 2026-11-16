import { PROJECT_EMAIL } from '@/content/projectInfo';

function PrivacyHeader() {
  return (
    <div className="border-b border-black/5 pb-3">
      <p className="text-xs font-medium text-muted">
        Versão 1.1 (Conformidade LGPD - Lei nº 13.709/2018) &bull; Atualizado em 16 de novembro de
        2026
      </p>
      <p className="mt-2 text-sm text-muted">
        Esta política detalha como tratamos seus dados pessoais no{' '}
        <strong className="text-brand-900">PBL360</strong> para fins estritamente pedagógicos e de
        pesquisa acadêmica, sob controle da equipe de desenvolvimento da disciplina EXA613 –
        Engenharia de Software na Universidade Estadual de Feira de Santana (UEFS).
      </p>
    </div>
  );
}

function PrivacyDataSummary() {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-brand-900">1. Dados Coletados e Finalidades</h3>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
        <li>
          <strong className="text-ink">Identificação:</strong> Nome completo, e-mail institucional e
          tipo de perfil (para autenticação e identificação na turma).
        </li>
        <li>
          <strong className="text-ink">Segurança:</strong> Senha de acesso armazenada exclusivamente
          como hash criptográfico irreversível (com salt).
        </li>
        <li>
          <strong className="text-ink">Dados Acadêmicos:</strong> Notas, autoavaliações, avaliações
          de pares e feedbacks de sessões tutoriais (para cálculo de médias e acompanhamento).
        </li>
        <li>
          <strong className="text-ink">Mensagens de Chat:</strong> Conteúdo textual, data/hora e
          identificação de remetente/destinatário nas conversas entre aluno e professor para fins de
          orientação acadêmica.
        </li>
        <li>
          <strong className="text-ink">Registros de Conexão:</strong> Endereço IP, data/hora e rotas
          de acesso para segurança e cumprimento legal do Art. 15 do Marco Civil da Internet.
        </li>
      </ul>
      <p className="text-[11px] italic text-muted">
        * O sistema não coleta nem processa dados pessoais sensíveis.
      </p>
    </section>
  );
}

function PrivacySecurityAndSharing() {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-brand-900">
        2. Segurança, Sigilo do Chat e Não Comercialização
      </h3>
      <p className="text-xs leading-relaxed text-muted">
        Os dados e mensagens trafegam via conexão criptografada (HTTPS/TLS) e são armazenados em
        provedores de nuvem certificados (Vercel, Render e Supabase/PostgreSQL).
      </p>
      <p className="text-xs leading-relaxed text-muted">
        O acesso às mensagens do chat é restrito aos interlocutores da conversa (aluno e professor),
        com acesso da equipe técnica apenas em caso de auditoria acadêmica justificada. Nenhum dado
        é vendido, alugado ou repassado a terceiros para fins comerciais.
      </p>
    </section>
  );
}

function PrivacyRightsAndLifecycle() {
  return (
    <section className="flex flex-col gap-1.5 border-t border-black/5 pt-3">
      <h3 className="text-sm font-semibold text-brand-900">
        3. Retenção e Direitos do Titular (LGPD)
      </h3>
      <p className="text-xs leading-relaxed text-muted">
        Os dados cadastrais, notas e mensagens do chat são mantidos durante o semestre letivo. Ao
        término do período, os dados identificáveis serão definitivamente excluídos ou anonimizados
        para pesquisa acadêmica da UEFS.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        Nos termos do Art. 18 da LGPD, você pode confirmar o tratamento, solicitar acesso, correção
        ou exclusão de sua conta a qualquer momento pelo e-mail do Encarregado:{' '}
        <a
          href={`mailto:${PROJECT_EMAIL}`}
          className="font-medium text-brand-900 underline underline-offset-2 hover:text-brand-700"
        >
          {PROJECT_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}

export function PrivacyPolicyContent() {
  return (
    <div className="flex flex-col gap-4 text-left">
      <PrivacyHeader />
      <PrivacyDataSummary />
      <PrivacySecurityAndSharing />
      <PrivacyRightsAndLifecycle />
    </div>
  );
}

export default PrivacyPolicyContent;
