import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CAConfig {
  url: string;
  name: string;
  adminUser: string;
  adminPassword: string;
}

@Injectable()
export class FabricCAConfig {
  constructor(private readonly configService: ConfigService) {}

  getCAConfigs(): Record<string, CAConfig> {
    return {
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

  getCAConfig(orgName: string): CAConfig {
    const configs = this.getCAConfigs();
    return configs[orgName];
  }
}
