import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthProvider';
import { PreferencesProvider } from '@/contexts/PreferencesProvider';
import { ToastProvider } from '@/contexts/ToastProvider';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <PreferencesProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </PreferencesProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
