import type { ProblemDelivery } from '../entities/problem-delivery.entity';

export const PROBLEM_DELIVERY_REPOSITORY = Symbol('PROBLEM_DELIVERY_REPOSITORY');

export interface DeliveryAuthor {
  id: string;
  name: string;
}

export interface ProblemDeliverySummary {
  id: string;
  url: string;
  submittedBy: DeliveryAuthor;
  submittedAt: Date;
}

export interface ProblemDeliveryRepository {
  registerForStudent(delivery: ProblemDelivery): Promise<ProblemDeliverySummary>;
  listActiveByProblem(problemId: string): Promise<ProblemDeliverySummary[]>;
  findActiveByProblemAndStudent(
    problemId: string,
    studentId: string,
  ): Promise<ProblemDeliverySummary | null>;
}
