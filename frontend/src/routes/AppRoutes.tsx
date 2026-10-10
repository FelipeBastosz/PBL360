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
const MemberSessionPage = lazy(() => import('@/pages/sessions/MemberSessionPage'));
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));
const RoomsPage = lazy(() => import('@/pages/rooms/RoomsPage'));
const CreateRoomPage = lazy(() => import('@/pages/rooms/CreateRoomPage'));
const CreateRoomSuccessPage = lazy(() => import('@/pages/rooms/CreateRoomSuccessPage'));
const ManageRoomsPage = lazy(() => import('@/pages/rooms/ManageRoomsPage'));
const EditRoomPage = lazy(() => import('@/pages/rooms/EditRoomPage'));
const RoomMembersPage = lazy(() => import('@/pages/rooms/members/RoomMembersPage'));
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
const ProblemFormulaPage = lazy(() => import('@/pages/formulas/ProblemFormulaPage'));
const SessionEvaluationsListPage = lazy(
  () => import('@/pages/evaluations/SessionEvaluationsListPage'),
);
const StudentEvaluationPage = lazy(() => import('@/pages/evaluations/StudentEvaluationPage'));
const StudentSelfEvaluationPage = lazy(() => import('@/pages/sessions/StudentSelfEvaluationPage'));
const StudentObservationTagsPage = lazy(
  () => import('@/pages/evaluations/StudentObservationTagsPage'),
);

const publicRoutes = (
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
);

const protectedRoutes = (
  <Route element={<ProtectedRoute />}>
    <Route path={ROUTES.rooms} element={<RoomsPage />} />
    <Route path={ROUTES.createRoom} element={<CreateRoomPage />} />
    <Route path={ROUTES.createRoomSuccess} element={<CreateRoomSuccessPage />} />
    <Route path={ROUTES.manageRooms} element={<ManageRoomsPage />} />
    <Route path={ROUTES.editRoom} element={<EditRoomPage />} />
    <Route path={ROUTES.roomProblems} element={<RoomProblemsPage />} />
    <Route path={ROUTES.roomMembers} element={<RoomMembersPage />} />
    <Route path={ROUTES.manageProblems} element={<ManageProblemsPage />} />
    <Route path={ROUTES.performanceTables} element={<PerformanceTablesPage />} />
    <Route path={ROUTES.createPerformanceTable} element={<CreatePerformanceTablePage />} />
    <Route path={ROUTES.performanceTableDetail} element={<PerformanceTableDetailPage />} />
    <Route path={ROUTES.managePerformanceTables} element={<ManagePerformanceTablesPage />} />
    <Route path={ROUTES.editPerformanceTable} element={<EditPerformanceTablePage />} />
    <Route path={ROUTES.problemSessions} element={<ProblemSessionsPage />} />
    <Route path={ROUTES.manageSessions} element={<ManageSessionsPage />} />
    <Route path={ROUTES.sessionHub} element={<SessionHubPage />} />
    <Route path={ROUTES.sessionFormulas} element={<ProblemFormulaPage />} />
    <Route path={ROUTES.rollCall} element={<RollCallPage />} />
    <Route path={ROUTES.memberSession} element={<MemberSessionPage />} />
    <Route path={ROUTES.sessionRollCall} element={<RollCallPage />} />
    <Route path={ROUTES.sessionEvaluationsList} element={<SessionEvaluationsListPage />} />
    <Route path={ROUTES.studentEvaluation} element={<StudentEvaluationPage />} />
    <Route path={ROUTES.sessionStudentEvaluation} element={<StudentEvaluationPage />} />
    <Route path={ROUTES.studentSelfEvaluation} element={<StudentSelfEvaluationPage />} />
    <Route path={ROUTES.studentObservationTags} element={<StudentObservationTagsPage />} />
    <Route path={ROUTES.sessionStudentObservationTags} element={<StudentObservationTagsPage />} />
  </Route>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.splash} element={<SplashPage />} />
        {publicRoutes}
        {protectedRoutes}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
