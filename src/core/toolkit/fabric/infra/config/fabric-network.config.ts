import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NetworkTimeouts {
  evaluate: number;
  endorse: number;
  submit: number;
  commitStatus: number;
}

@Injectable()
export class FabricNetworkConfig {
  constructor(private readonly configService: ConfigService) {}

  getChannelName(): string {
    return this.configService.get<string>('FABRIC_CHANNEL', 'studentchannel');
  }

  getChaincodeName(): string {
    return this.configService.get<string>('FABRIC_CHAINCODE', 'student-ledger');
  }

  getContractName(): string {
    return 'DocumentContract';
  }

  getReadTimeouts(): NetworkTimeouts {
    return {
      evaluate: 5000,
      endorse: 15000,
      submit: 5000,
      commitStatus: 60000,
    };
  }

  getWriteTimeouts(): NetworkTimeouts {
    return {
      evaluate: 5000,
      endorse: 30000,
      submit: 10000,
      commitStatus: 120000,
    };
  }

  getHealthCheckTimeout(): number {
    return 5000;
  }
}
