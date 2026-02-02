import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

export type OrgName = 'coordenacao' | 'orientador' | 'aluno';
type UserRole = 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

interface OrgInfo {
  orgName: OrgName;
  mspId: string;
  affiliation: string;
}

export interface PeerConfig {
  name: OrgName;
  mspId: string;
  peerEndpoint: string;
  peerName: string;
  tlsCaCert: string;
}

@Injectable()
export class FabricOrganizationConfig {
  private readonly orgMap: Record<Role, OrgInfo> = {
    ADMIN: {
      orgName: 'coordenacao',
      mspId: 'CoordenacaoMSP',
      affiliation: 'coordenacao.department1',
    },
    COORDINATOR: {
      orgName: 'coordenacao',
      mspId: 'CoordenacaoMSP',
      affiliation: 'coordenacao.department1',
    },
    ADVISOR: {
      orgName: 'orientador',
      mspId: 'OrientadorMSP',
      affiliation: 'orientador.department1',
    },
    STUDENT: {
      orgName: 'aluno',
      mspId: 'AlunoMSP',
      affiliation: 'aluno.department1',
    },
  };

  private readonly roleToOrgMap: Record<UserRole, OrgName> = {
    ADMIN: 'coordenacao',
    COORDINATOR: 'coordenacao',
    ADVISOR: 'orientador',
    STUDENT: 'aluno',
  };

  getOrgInfo(role: Role): OrgInfo {
    return this.orgMap[role];
  }

  getMspIdByRole(role: Role): string {
    return this.orgMap[role].mspId;
  }

  getOrgNameByUserRole(userRole: UserRole): OrgName {
    return this.roleToOrgMap[userRole];
  }

  getPeerConfig(orgName: OrgName): PeerConfig {
    const configs: Record<OrgName, PeerConfig> = {
      coordenacao: {
        name: 'coordenacao',
        mspId: this.configService.get<string>('FABRIC_COORDENACAO_MSP_ID', 'CoordenacaoMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_COORDENACAO_PEER_ENDPOINT', 'localhost:7051'),
        peerName: this.configService.get<string>('FABRIC_COORDENACAO_PEER_NAME', 'peer0.coordenacao.ifal.local'),
        tlsCaCert: this.configService.get<string>('FABRIC_COORDENACAO_TLS_CA_CERT', ''),
      },
      orientador: {
        name: 'orientador',
        mspId: this.configService.get<string>('FABRIC_ORIENTADOR_MSP_ID', 'OrientadorMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_ORIENTADOR_PEER_ENDPOINT', 'localhost:8051'),
        peerName: this.configService.get<string>('FABRIC_ORIENTADOR_PEER_NAME', 'peer0.orientador.ifal.local'),
        tlsCaCert: this.configService.get<string>('FABRIC_ORIENTADOR_TLS_CA_CERT', ''),
      },
      aluno: {
        name: 'aluno',
        mspId: this.configService.get<string>('FABRIC_ALUNO_MSP_ID', 'AlunoMSP'),
        peerEndpoint: this.configService.get<string>('FABRIC_ALUNO_PEER_ENDPOINT', 'localhost:9051'),
        peerName: this.configService.get<string>('FABRIC_ALUNO_PEER_NAME', 'peer0.aluno.ifal.local'),
        tlsCaCert: this.configService.get<string>('FABRIC_ALUNO_TLS_CA_CERT', ''),
      },
    };

    return configs[orgName];
  }

  extractOrgNameFromIdentifier(identifier: string): OrgName {
    if (identifier.includes('coordenacao')) return 'coordenacao';
    if (identifier.includes('orientador')) return 'orientador';
    if (identifier.includes('aluno')) return 'aluno';
    return 'aluno';
  }

  getMspIdByOrgName(orgName: OrgName): string {
    return `${orgName.charAt(0).toUpperCase()}${orgName.slice(1)}MSP`;
  }

  constructor(private readonly configService: ConfigService) {}
}
