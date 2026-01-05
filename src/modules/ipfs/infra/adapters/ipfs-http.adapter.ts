import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import {
  IIpfsStorage,
  IpfsUploadResult,
  IpfsFileInfo,
  IpfsHealthStatus,
} from '../../application/ports';
import {
  IpfsConnectionError,
  IpfsUploadError,
  IpfsFileNotFoundError,
  IpfsPinError,
} from '../../domain/errors';

/**
 * Implementação HTTP do adapter IPFS
 * Conecta via API REST do nó IPFS (porta 5001)
 *
 * SEGURANÇA: O IPFS deve estar configurado para aceitar conexões
 * apenas da rede interna (localhost ou rede Docker).
 * NÃO expor a porta 5001 publicamente.
 */
@Injectable()
export class IpfsHttpAdapter implements IIpfsStorage {
  private readonly logger = new Logger(IpfsHttpAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const apiUrl = this.configService.get<string>('IPFS_API_URL', 'http://localhost:5001');
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
    });
  }

  async healthCheck(): Promise<IpfsHealthStatus> {
    try {
      this.logger.log('Verificando conexão com o IPFS...');

      const response = await this.client.post('/api/v0/id');
      this.logger.log(`IPFS conectado. Peer ID: ${response.data.ID}`);

      return { status: 'ok', peerId: response.data.ID };
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Falha ao conectar ao IPFS: ${message}`);
      throw new IpfsConnectionError(message);
    }
  }

  async uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult> {
    try {
      this.logger.log(`Fazendo upload do arquivo: ${filename}`);

      const formData = new FormData();
      formData.append('file', file, { filename });

      const response = await this.client.post('/api/v0/add', formData, {
        params: { pin: true },
        headers: formData.getHeaders(),
      });

      this.logger.log(`Arquivo enviado. CID: ${response.data.Hash}`);

      return {
        cid: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size, 10),
      };
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro no upload IPFS: ${message}`);
      throw new IpfsUploadError(filename, message);
    }
  }

  async calculateCid(file: Buffer): Promise<string> {
    try {
      this.logger.log('Calculando CID do arquivo...');

      const formData = new FormData();
      formData.append('file', file, { filename: 'temp' });

      const response = await this.client.post('/api/v0/add', formData, {
        params: { 'only-hash': true },
        headers: formData.getHeaders(),
      });

      this.logger.log(`CID calculado: ${response.data.Hash}`);

      return response.data.Hash;
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro ao calcular CID: ${message}`);
      throw new IpfsConnectionError(message);
    }
  }

  async downloadFile(cid: string): Promise<Buffer> {
    try {
      this.logger.log(`Baixando arquivo: ${cid}`);

      const response = await this.client.post('/api/v0/cat', null, {
        params: { arg: cid },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro no download IPFS: ${message}`);
      throw new IpfsFileNotFoundError(cid);
    }
  }

  async exists(cid: string): Promise<boolean> {
    try {
      await this.client.post('/api/v0/object/stat', null, {
        params: { arg: cid },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(cid: string): Promise<IpfsFileInfo> {
    try {
      const response = await this.client.post('/api/v0/object/stat', null, {
        params: { arg: cid },
      });

      return {
        cid,
        size: response.data.CumulativeSize,
        type: response.data.NumLinks > 0 ? 'directory' : 'file',
      };
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro ao obter info do arquivo: ${message}`);
      throw new IpfsFileNotFoundError(cid);
    }
  }

  async pin(cid: string): Promise<void> {
    try {
      await this.client.post('/api/v0/pin/add', null, {
        params: { arg: cid },
      });

      this.logger.log(`CID fixado: ${cid}`);
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro ao fixar CID: ${message}`);
      throw new IpfsPinError(cid, 'pin');
    }
  }

  async unpin(cid: string): Promise<void> {
    try {
      await this.client.post('/api/v0/pin/rm', null, {
        params: { arg: cid },
      });

      this.logger.log(`Fixação removida: ${cid}`);
    } catch (error) {
      const message = error.response?.data?.Message || error.message;
      this.logger.error(`Erro ao remover fixação: ${message}`);
      throw new IpfsPinError(cid, 'unpin');
    }
  }

  isValidCid(cid: string): boolean {
    const cidV0Regex = /^Qm[a-zA-Z0-9]{44}$/;
    const cidV1Regex = /^bafy[a-z2-7]{55,}$/;
    return cidV0Regex.test(cid) || cidV1Regex.test(cid);
  }
}
