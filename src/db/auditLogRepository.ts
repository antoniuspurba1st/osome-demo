import { query } from "./pool";

export interface AuditLogMetadata {
  [key: string]: unknown;
}

interface AuditLogInsertParams {
  entityType: string;
  entityId: number;
  action: string;
  metadata: AuditLogMetadata;
}

export const insertAuditLog = async ({ entityType, entityId, action, metadata }: AuditLogInsertParams) => {
  await query(
    `
      INSERT INTO audit_logs (entity_type, entity_id, action, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [entityType, entityId, action, JSON.stringify(metadata)],
  );
};
