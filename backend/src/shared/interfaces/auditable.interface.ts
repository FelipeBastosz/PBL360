export interface Auditable {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt?: Date | null;
}

export interface AuditActionContext {
  authorId: string;
}
