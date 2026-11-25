import { ROUTES } from '@/routes/paths';

export const studentPerformancePath = (roomId: string, studentId: string) =>
  ROUTES.studentPerformance.replace(':roomId', roomId).replace(':studentId', studentId);
