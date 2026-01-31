import { Role } from '@prisma/client';

export const CERTIFICATE_GENERATION_QUEUE = 'certificate:generation';

export interface CertificateGenerationJobData {
  userId: string;
  email: string;
  role: Role;
  approvalId?: string;
}
