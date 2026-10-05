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
const RollCallPage = lazy(() => import('@/pages/roll-call/RollCallPage'));
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const RoomsPage = lazy(() => import('@/pages/rooms/RoomsPage'));
const CreateRoomPage = lazy(() => import('@/pages/rooms/CreateRoomPage'));
const CreateRoomSuccessPage = lazy(() => import('@/pages/rooms/CreateRoomSuccessPage'));
const ManageRoomsPage = lazy(() => import('@/pages/rooms/ManageRoomsPage'));
const EditRoomPage = lazy(() => import('@/pages/rooms/EditRoomPage'));
const RoomProblemsPage = lazy(() => import('@/pages/problems/RoomProblemsPage'));
const ManageProblemsPage = lazy(() => import('@/pages/problems/ManageProblemsPage'));
const PerformanceTablesPage = lazy(
  () => import('@/pages/performance-tables/PerformanceTablesPage'),
);
const CreatePerformanceTablePage = lazy(
  () => import('@/pages/performance-tables/CreatePerformanceTablePage'),
);
const PerformanceTableDetailPage = lazy(
  () => import('@/pages/performance-tables/PerformanceTableDetailPage'),
);
const ManagePerformanceTablesPage = lazy(
  () => import('@/pages/performance-tables/ManagePerformanceTablesPage'),
);
const EditPerformanceTablePage = lazy(
  () => import('@/pages/performance-tables/EditPerformanceTablePage'),
);
const ProblemSessionsPage = lazy(() => import('@/pages/sessions/ProblemSessionsPage'));
const ManageSessionsPage = lazy(() => import('@/pages/sessions/ManageSessionsPage'));
const SessionHubPage = lazy(() => import('@/pages/sessions/SessionHubPage'));

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
          <Route path={ROUTES.editRoom} element={<EditRoomPage />} />
          <Route path={ROUTES.roomProblems} element={<RoomProblemsPage />} />
          <Route path={ROUTES.manageProblems} element={<ManageProblemsPage />} />
          <Route path={ROUTES.performanceTables} element={<PerformanceTablesPage />} />
          <Route path={ROUTES.createPerformanceTable} element={<CreatePerformanceTablePage />} />
          <Route path={ROUTES.performanceTableDetail} element={<PerformanceTableDetailPage />} />
          <Route path={ROUTES.managePerformanceTables} element={<ManagePerformanceTablesPage />} />
          <Route path={ROUTES.editPerformanceTable} element={<EditPerformanceTablePage />} />
          <Route path={ROUTES.problemSessions} element={<ProblemSessionsPage />} />
          <Route path={ROUTES.manageSessions} element={<ManageSessionsPage />} />
          <Route path={ROUTES.sessionHub} element={<SessionHubPage />} />
          <Route path={ROUTES.rollCall} element={<RollCallPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
