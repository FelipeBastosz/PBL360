import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AboutProjectContent, TeamMembersContent } from '@/components/layout/AdditionalInfoDetails';
import { TermsAndPrivacyContent } from '@/components/layout/TermsAndPrivacyContent';
import { BrandHero } from '@/components/layout/BrandHero';
import { Button } from '@/components/ui/Button';
import { LegalDocumentModal } from '@/components/ui/LegalDocumentModal';
import {
  LEGAL_PRIVACY_TITLE,
  LEGAL_TERMS_AND_PRIVACY_TITLE,
  LEGAL_TERMS_TITLE,
} from '@/content/legal';
import { ABOUT_PROJECT_TITLE, TEAM_MEMBERS_TITLE } from '@/content/projectInfo';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export type AdditionalInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AdditionalInfoLinksProps = {
  onSelect: (title: string) => void;
};

function AdditionalInfoHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
      <h2 id="additional-info-modal-title" className="text-lg font-semibold text-ink text-left">
        Informações adicionais
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar informações adicionais"
        className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-subtle active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-accent"
      >
        <XMarkIcon className="size-6" />
      </button>
    </div>
  );
}

const INFO_LINKS = [
  { label: 'Sobre o Projeto', title: ABOUT_PROJECT_TITLE },
  { label: 'Desenvolvedores', title: TEAM_MEMBERS_TITLE },
  { label: 'Termos de Uso e Política de Privacidade', title: LEGAL_TERMS_AND_PRIVACY_TITLE },
];

function AdditionalInfoLinks({ onSelect }: AdditionalInfoLinksProps) {
  return (
    <div className="mt-2 flex flex-col items-center gap-2.5 border-t border-border-subtle pt-4">
      {INFO_LINKS.map(({ label, title }) => (
        <button
          key={title}
          type="button"
          onClick={() => onSelect(title)}
          className="text-base font-semibold text-brand-accent underline underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-brand-accent"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function renderDocContent(activeDoc: string | null) {
  if (activeDoc === ABOUT_PROJECT_TITLE) return <AboutProjectContent />;
  if (activeDoc === TEAM_MEMBERS_TITLE) return <TeamMembersContent />;
  if (
    activeDoc === LEGAL_TERMS_AND_PRIVACY_TITLE ||
    activeDoc === LEGAL_TERMS_TITLE ||
    activeDoc === LEGAL_PRIVACY_TITLE
  ) {
    return <TermsAndPrivacyContent />;
  }
  return undefined;
}

function getModalMaxWidth(activeDoc: string | null) {
  if (activeDoc === TEAM_MEMBERS_TITLE) return 'max-w-lg';
  if (
    activeDoc === LEGAL_TERMS_AND_PRIVACY_TITLE ||
    activeDoc === LEGAL_TERMS_TITLE ||
    activeDoc === LEGAL_PRIVACY_TITLE
  ) {
    return 'max-w-2xl';
  }
  return 'max-w-md';
}

export function AdditionalInfoModal({ isOpen, onClose }: AdditionalInfoModalProps) {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  useEscapeKey(isOpen, onClose, activeDoc !== null);

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="additional-info-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in"
      >
        <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col rounded-3xl border border-border-subtle bg-elevated p-6 shadow-2xl animate-pop-in">
          <AdditionalInfoHeader onClose={onClose} />

          <div className="my-4 flex flex-col items-center justify-center">
            <BrandHero markClassName="size-20" className="my-2" />
          </div>

          <AdditionalInfoLinks onSelect={setActiveDoc} />

          <div className="mt-6 border-t border-border-subtle pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="w-full shadow-none hover:shadow-none active:shadow-none"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>

      <LegalDocumentModal
        isOpen={activeDoc !== null}
        title={activeDoc ?? ''}
        onClose={() => setActiveDoc(null)}
        zIndex="z-[60]"
        maxWidth={getModalMaxWidth(activeDoc)}
      >
        {renderDocContent(activeDoc)}
      </LegalDocumentModal>
    </>
  );
}
