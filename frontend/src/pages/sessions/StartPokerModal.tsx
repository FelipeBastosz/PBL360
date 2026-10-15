import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { PokerOrder } from '@/types/planningPoker';
import { cn } from '@/utils/cn';
import { TextLink } from '../planning-poker/PokerCard';
import { PokerModal } from '../planning-poker/PokerModal';

type Option<T> = { value: T; title: string; description: string; isDefault?: boolean };

const MODES: Option<boolean>[] = [
  {
    value: true,
    title: 'Anônimo',
    description: 'Lugares sem nome e sem foto. As posições são embaralhadas a cada rodada.',
    isDefault: true,
  },
  {
    value: false,
    title: 'Com nomes',
    description: 'A mesa mostra quem votou e o nome em cada carta revelada.',
  },
];

const ORDERS: Option<PokerOrder>[] = [
  {
    value: 'SEQUENCIAL',
    title: 'Sequencial',
    description: 'O sistema passa aluno por aluno, na ordem da mesa.',
  },
  {
    value: 'MANUAL',
    title: 'Eu escolho',
    description: 'Você toca no aluno na mesa a cada rodada.',
  },
];

function RadioCard<T>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left text-ink',
        selected ? 'border-2 border-brand-900 bg-brand-50' : 'border border-black/10 bg-white',
      )}
    >
      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand-900">
        <span className={cn('size-2.5 rounded-full bg-brand-900', !selected && 'opacity-0')} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{option.title}</span>
          {option.isDefault && (
            <span className="rounded-full border border-brand-200 bg-brand-100 px-2 text-[11px] leading-[18px] font-semibold text-brand-900">
              Padrão
            </span>
          )}
        </span>
        <span className="text-[13px] leading-snug text-muted">{option.description}</span>
      </span>
    </button>
  );
}

function RadioCards<T>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      {options.map((option) => (
        <RadioCard
          key={option.title}
          option={option}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </fieldset>
  );
}

type StartPokerModalProps = {
  presentStudents: number;
  isLoading: boolean;
  onStart: (anonimo: boolean, ordem: PokerOrder) => void;
  onClose: () => void;
};

export function StartPokerModal({
  presentStudents,
  isLoading,
  onStart,
  onClose,
}: StartPokerModalProps) {
  const [anonymous, setAnonymous] = useState(true);
  const [order, setOrder] = useState<PokerOrder>('SEQUENCIAL');

  return (
    <PokerModal isOpen label="Iniciar planning poker" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="pr-8">
          <h2 className="text-lg font-bold text-brand-900">Iniciar planning poker</h2>
          <p className="mt-1 text-[13px] leading-normal text-muted">
            Avaliação coletiva sobre a mesa da chamada. {presentStudents} alunos presentes.
          </p>
        </div>
        <RadioCards legend="Modo" options={MODES} value={anonymous} onChange={setAnonymous} />
        <RadioCards legend="Ordem" options={ORDERS} value={order} onChange={setOrder} />
        <div className="mt-1 flex flex-col gap-2">
          <Button onClick={() => onStart(anonymous, order)} isLoading={isLoading}>
            Iniciar
          </Button>
          <TextLink onClick={onClose}>Cancelar</TextLink>
        </div>
      </div>
    </PokerModal>
  );
}
