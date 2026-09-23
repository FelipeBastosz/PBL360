import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/components/layout/PageLoader';
import { ROUTES } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

const SplashPage = lazy(() => import('@/pages/splash/SplashPage'));
const ProfileSelectionPage = lazy(() => import('@/pages/profile-selection/ProfileSelectionPage'));
const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/register/RegisterPage'));
const VerifyAccountPage = lazy(() => import('@/pages/register/VerifyAccountPage'));
const RegisterSuccessPage = lazy(() => import('@/pages/register/RegisterSuccessPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/password-recovery/ForgotPasswordPage'));
const ResetCodePage = lazy(() => import('@/pages/password-recovery/ResetCodePage'));
const NewPasswordPage = lazy(() => import('@/pages/password-recovery/NewPasswordPage'));
const ResetSuccessPage = lazy(() => import('@/pages/password-recovery/ResetSuccessPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.splash} element={<SplashPage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.profileSelection} element={<ProfileSelectionPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.verifyAccount} element={<VerifyAccountPage />} />
          <Route path={ROUTES.registerSuccess} element={<RegisterSuccessPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetCode} element={<ResetCodePage />} />
          <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />
          <Route path={ROUTES.resetSuccess} element={<ResetSuccessPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.home} element={<HomePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
