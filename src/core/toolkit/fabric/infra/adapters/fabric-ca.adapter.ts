import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as FabricCAServices from 'fabric-ca-client';
import { User } from 'fabric-common';
import {
  IFabricCAService,
  EnrollmentResult,
} from '../../application/ports/fabric-ca.port';
import { FabricCAConfig, CAConfig } from '../config/fabric-ca.config';
import { FabricOrganizationConfig, OrgName } from '../config/fabric-organization.config';

@Injectable()
export class FabricCAAdapter implements IFabricCAService, OnModuleInit {
  private readonly logger = new Logger(FabricCAAdapter.name);
  private readonly caClients: Map<string, FabricCAServices> = new Map();
  private readonly adminIdentities: Map<string, User> = new Map();

  constructor(
    private readonly fabricCAConfig: FabricCAConfig,
    private readonly fabricOrgConfig: FabricOrganizationConfig,
  ) {}

  async onModuleInit() {
    const caConfigs = this.fabricCAConfig.getCAConfigs();
    for (const [orgName, config] of Object.entries(caConfigs)) {
      const caClient = new FabricCAServices(config.url, { trustedRoots: [], verify: false }, config.name);
      this.caClients.set(orgName, caClient);
      this.logger.log(`Fabric CA client initialized for ${orgName} at ${config.url}`);
    }
  }

  async register(enrollmentId: string, affiliation: string, role: string): Promise<string> {
    const orgName = this.fabricOrgConfig.extractOrgNameFromIdentifier(affiliation);
    const caClient = this.getCAClient(orgName);
    const adminUser = await this.enrollAdmin(orgName);
    const secret = this.generateSecret();

    await caClient.register(
      {
        enrollmentID: enrollmentId,
        enrollmentSecret: secret,
        role: 'client',
        affiliation: '',
        attrs: [{ name: 'role', value: role, ecert: true }],
      },
      adminUser,
    );

    this.logger.log(`Registered ${enrollmentId} in ${orgName}`);
    return secret;
  }

  async enroll(enrollmentId: string, secret: string): Promise<EnrollmentResult> {
    const orgName = this.fabricOrgConfig.extractOrgNameFromIdentifier(enrollmentId);
    const caClient = this.getCAClient(orgName);

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
    const orgName = this.fabricOrgConfig.extractOrgNameFromIdentifier(enrollmentId);
    const caClient = this.getCAClient(orgName);
    const adminIdentity = await this.enrollAdmin(orgName);

    await caClient.revoke({ enrollmentID: enrollmentId, reason }, adminIdentity);

    this.logger.log(`Revoked ${enrollmentId}`);
  }

  private async enrollAdmin(orgName: OrgName): Promise<User> {
    const cached = this.adminIdentities.get(orgName);
    if (cached) return cached;

    const config = this.fabricCAConfig.getCAConfig(orgName);
    const caClient = this.getCAClient(orgName);

    const enrollment = await caClient.enroll({
      enrollmentID: config.adminUser,
      enrollmentSecret: config.adminPassword,
    });

    const adminUser = User.createUser(
      config.adminUser,
      config.adminPassword,
      this.fabricOrgConfig.getMspIdByOrgName(orgName),
      enrollment.certificate,
      enrollment.key.toBytes(),
    );

    this.adminIdentities.set(orgName, adminUser);
    this.logger.log(`Admin enrolled for ${orgName}`);
    return adminUser;
  }

  private getCAClient(orgName: OrgName): FabricCAServices {
    const caClient = this.caClients.get(orgName);
    if (!caClient) {
      throw new Error(`CA client not found for org: ${orgName}`);
    }
    return caClient;
  }

  private generateSecret(): string {
    return crypto.randomBytes(18).toString('base64').substring(0, 24);
  }
}
