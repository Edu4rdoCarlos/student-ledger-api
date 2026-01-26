import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FabricCAServices from 'fabric-ca-client';
import { User } from 'fabric-common';
import {
  IFabricCAService,
  EnrollmentResult,
} from '../../application/ports/fabric-ca.port';

interface CAConfig {
  url: string;
  name: string;
  adminUser: string;
  adminPassword: string;
}

@Injectable()
export class FabricCAAdapter implements IFabricCAService, OnModuleInit {
  private readonly logger = new Logger(FabricCAAdapter.name);
  private readonly caConfigs: Record<string, CAConfig>;
  private readonly caClients: Map<string, FabricCAServices> = new Map();
  private readonly adminIdentities: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.caConfigs = {
      coordenacao: {
        url: this.configService.get('FABRIC_CA_COORDENACAO_URL', 'https://localhost:7054'),
        name: 'ca-coordenacao',
        adminUser: 'admin',
        adminPassword: 'adminpw',
      },
      orientador: {
        url: this.configService.get('FABRIC_CA_ORIENTADOR_URL', 'https://localhost:8054'),
        name: 'ca-orientador',
        adminUser: 'admin',
        adminPassword: 'adminpw',
      },
      aluno: {
        url: this.configService.get('FABRIC_CA_ALUNO_URL', 'https://localhost:9054'),
        name: 'ca-aluno',
        adminUser: 'admin',
        adminPassword: 'adminpw',
      },
    };
  }

  async onModuleInit() {
    for (const [orgName, config] of Object.entries(this.caConfigs)) {
      const tlsOptions = {
        trustedRoots: [],
        verify: false,
      };

      const caClient = new FabricCAServices(
        config.url,
        tlsOptions,
        config.name,
      );

      this.caClients.set(orgName, caClient);
      this.logger.log(`Fabric CA client initialized for ${orgName} at ${config.url}`);
    }
  }

  private async enrollAdmin(orgName: string): Promise<any> {
    const cached = this.adminIdentities.get(orgName);
    if (cached) return cached;

    const config = this.caConfigs[orgName];
    const caClient = this.caClients.get(orgName);
    if (!caClient) {
      throw new Error(`CA client not found for org: ${orgName}`);
    }

    const enrollment = await caClient.enroll({
      enrollmentID: config.adminUser,
      enrollmentSecret: config.adminPassword,
    });

    const mspId = `${orgName.charAt(0).toUpperCase() + orgName.slice(1)}MSP`;

    const adminUser = User.createUser(
      config.adminUser,
      config.adminPassword,
      mspId,
      enrollment.certificate,
      enrollment.key.toBytes(),
    );

    this.adminIdentities.set(orgName, adminUser);
    this.logger.log(`Admin enrolled for ${orgName}`);
    return adminUser;
  }

  private getOrgFromAffiliation(affiliation: string): string {
    if (affiliation.includes('coordenacao')) return 'coordenacao';
    if (affiliation.includes('orientador')) return 'orientador';
    if (affiliation.includes('aluno')) return 'aluno';
    throw new Error(`Unknown affiliation: ${affiliation}`);
  }

  private getOrgFromEnrollmentId(enrollmentId: string): string {
    // Check for org name anywhere in the enrollmentId (works for both original and versioned IDs)
    if (enrollmentId.includes('coordenacao')) return 'coordenacao';
    if (enrollmentId.includes('orientador')) return 'orientador';
    if (enrollmentId.includes('aluno')) return 'aluno';

    // Fallback to aluno if nothing matches
    return 'aluno';
  }

  async register(
    enrollmentId: string,
    affiliation: string,
    role: string,
  ): Promise<string> {
    const orgName = this.getOrgFromAffiliation(affiliation);
    const caClient = this.caClients.get(orgName);
    if (!caClient) {
      throw new Error(`CA client not found for org: ${orgName}`);
    }

    const config = this.caConfigs[orgName];
    const secret = this.generateSecret();

    const enrollment = await caClient.enroll({
      enrollmentID: config.adminUser,
      enrollmentSecret: config.adminPassword,
    });

    const adminUser = User.createUser(
      config.adminUser,
      config.adminPassword,
      `${orgName.charAt(0).toUpperCase() + orgName.slice(1)}MSP`,
      enrollment.certificate,
      enrollment.key.toBytes(),
    );

    const registerRequest = {
      enrollmentID: enrollmentId,
      enrollmentSecret: secret,
      role: 'client',
      affiliation: '', // Empty affiliation to avoid database lookup errors
      attrs: [{ name: 'role', value: role, ecert: true }],
    };

    await caClient.register(registerRequest, adminUser);

    this.logger.log(`Registered ${enrollmentId} in ${orgName}`);
    return secret;
  }

  async enroll(enrollmentId: string, secret: string): Promise<EnrollmentResult> {
    const orgName = this.getOrgFromEnrollmentId(enrollmentId);
    const caClient = this.caClients.get(orgName);
    if (!caClient) {
      throw new Error(`CA client not found for org: ${orgName}`);
    }

    const enrollment = await caClient.enroll({
      enrollmentID: enrollmentId,
      enrollmentSecret: secret,
    });

    this.logger.log(`Enrolled ${enrollmentId}`);

    return {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
      enrollmentId,
    };
  }

  async revoke(enrollmentId: string, reason: string): Promise<void> {
    const orgName = this.getOrgFromEnrollmentId(enrollmentId);
    const caClient = this.caClients.get(orgName);
    if (!caClient) {
      throw new Error(`CA client not found for org: ${orgName}`);
    }

    const adminIdentity = await this.enrollAdmin(orgName);

    const revokeRequest = {
      enrollmentID: enrollmentId,
      reason,
    };

    await caClient.revoke(revokeRequest, adminIdentity);

    this.logger.log(`Revoked ${enrollmentId}`);
  }

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 24; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}
