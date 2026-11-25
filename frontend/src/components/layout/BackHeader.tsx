import { AppHeader } from '@/components/layout/AppHeader';

type BackHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export function BackHeader({ title, subtitle, onBack }: BackHeaderProps) {
  return <AppHeader title={title} subtitle={subtitle} onBack={onBack} backAriaLabel="Voltar" />;
}
