import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { BrandHero } from './BrandHero';

type ErrorBoundaryProps = {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-dvh items-center justify-center px-6 bg-surface">
        <div role="alert" className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <BrandHero />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-ink">Algo deu errado</h1>
            <p className="text-muted">
              Ocorreu um erro inesperado. Recarregue a página para continuar.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        </div>
      </main>
    );
  }
}
