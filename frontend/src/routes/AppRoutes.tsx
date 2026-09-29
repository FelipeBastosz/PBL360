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
const ForgotPasswordPage = lazy(() => import('@/pages/password-reset/ForgotPasswordPage'));
const ResetPasswordCodePage = lazy(() => import('@/pages/password-reset/ResetPasswordCodePage'));
const ResetPasswordPage = lazy(() => import('@/pages/password-reset/ResetPasswordPage'));
const ResetPasswordSuccessPage = lazy(
  () => import('@/pages/password-reset/ResetPasswordSuccessPage'),
);
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const RoomsPage = lazy(() => import('@/pages/rooms/RoomsPage'));
const CreateRoomPage = lazy(() => import('@/pages/rooms/CreateRoomPage'));
const CreateRoomSuccessPage = lazy(() => import('@/pages/rooms/CreateRoomSuccessPage'));
const ManageRoomsPage = lazy(() => import('@/pages/rooms/ManageRoomsPage'));

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
          <Route path={ROUTES.resetPasswordCode} element={<ResetPasswordCodePage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
          <Route path={ROUTES.resetPasswordSuccess} element={<ResetPasswordSuccessPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.rooms} element={<RoomsPage />} />
          <Route path={ROUTES.createRoom} element={<CreateRoomPage />} />
          <Route path={ROUTES.createRoomSuccess} element={<CreateRoomSuccessPage />} />
          <Route path={ROUTES.manageRooms} element={<ManageRoomsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
