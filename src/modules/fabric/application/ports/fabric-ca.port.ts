export interface EnrollmentResult {
  certificate: string;
  privateKey: string;
  enrollmentId: string;
}

export interface IFabricCAService {
  register(
    enrollmentId: string,
    affiliation: string,
    role: string,
  ): Promise<string>;

  enroll(enrollmentId: string, secret: string): Promise<EnrollmentResult>;

  revoke(enrollmentId: string, reason: string): Promise<void>;
}

export const FABRIC_CA_SERVICE = Symbol('IFabricCAService');
