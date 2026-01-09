import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class FabricOrganizationConfig {
  getMspIdByRole(role: Role): string {
    const mspIdMap: Record<Role, string> = {
      STUDENT: process.env.FABRIC_ALUNO_MSP_ID || 'AlunoMSP',
      ADVISOR: process.env.FABRIC_ORIENTADOR_MSP_ID || 'OrientadorMSP',
      COORDINATOR: process.env.FABRIC_COORDENACAO_MSP_ID || 'CoordenacaoMSP',
      ADMIN: process.env.FABRIC_COORDENACAO_MSP_ID || 'CoordenacaoMSP',
    };

    return mspIdMap[role];
  }

  getPeerEndpointByRole(role: Role): string {
    const endpointMap: Record<Role, string> = {
      STUDENT: process.env.FABRIC_ALUNO_PEER_ENDPOINT || 'localhost:9051',
      ADVISOR: process.env.FABRIC_ORIENTADOR_PEER_ENDPOINT || 'localhost:8051',
      COORDINATOR: process.env.FABRIC_COORDENACAO_PEER_ENDPOINT || 'localhost:7051',
      ADMIN: process.env.FABRIC_COORDENACAO_PEER_ENDPOINT || 'localhost:7051',
    };

    return endpointMap[role];
  }

  getPeerNameByRole(role: Role): string {
    const peerNameMap: Record<Role, string> = {
      STUDENT: process.env.FABRIC_ALUNO_PEER_NAME || 'peer0.aluno.ifal.local',
      ADVISOR: process.env.FABRIC_ORIENTADOR_PEER_NAME || 'peer0.orientador.ifal.local',
      COORDINATOR: process.env.FABRIC_COORDENACAO_PEER_NAME || 'peer0.coordenacao.ifal.local',
      ADMIN: process.env.FABRIC_COORDENACAO_PEER_NAME || 'peer0.coordenacao.ifal.local',
    };

    return peerNameMap[role];
  }
}
