import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https';
import * as FormData from 'form-data';
import {
  IIpfsStorage,
  IpfsUploadResult,
  IpfsHealthStatus,
} from '../../application/ports';
import {
  IpfsConnectionError,
  IpfsUploadError,
  IpfsFileNotFoundError,
} from '../../domain/errors';
import { IpfsConfigService } from '../config';

@Injectable()
export class IpfsHttpAdapter implements IIpfsStorage {
  private readonly logger = new Logger(IpfsHttpAdapter.name);
  private readonly client: AxiosInstance | null;
  private readonly isConfigured: boolean;

  constructor(private readonly ipfsConfig: IpfsConfigService) {
    const config = this.ipfsConfig.getConfiguration();
    const hasCertificates = config.tls.ca && config.tls.cert && config.tls.key;

    if (hasCertificates) {
      this.client = this.createHttpsClient(config);
      this.isConfigured = true;
    } else {
      this.client = null;
      this.isConfigured = false;
      this.logger.error('IPFS indisponível - certificados mTLS não configurados');
    }
  }

  private createHttpsClient(config: ReturnType<IpfsConfigService['getConfiguration']>): AxiosInstance {
    const httpsAgent = new Agent({
      ca: config.tls.ca || undefined,
      cert: config.tls.cert || undefined,
      key: config.tls.key || undefined,
      rejectUnauthorized: config.tls.rejectUnauthorized,
    });

    return axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout,
      httpsAgent,
    });
  }


  async healthCheck(): Promise<IpfsHealthStatus> {
    this.ensureConfigured();
    try {
      const response = await this.client!.post('/api/v0/id');
      return { status: 'ok', peerId: response.data.ID };
    } catch (error) {
      this.handleConnectionError(error, 'Falha ao conectar ao IPFS');
    }
  }

  async uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult> {
    this.ensureConfigured();
    try {
      const formData = this.createFormData(file, filename);
      const response = await this.client!.post('/api/v0/add', formData, {
        params: { pin: true },
        headers: formData.getHeaders(),
      });

      return this.parseUploadResponse(response.data);
    } catch (error) {
      this.handleUploadError(error, filename);
    }
  }

  async calculateCid(file: Buffer): Promise<string> {
    this.ensureConfigured();
    try {
      const formData = this.createFormData(file, 'temp');
      const response = await this.client!.post('/api/v0/add', formData, {
        params: { 'only-hash': true },
        headers: formData.getHeaders(),
      });

      return response.data.Hash;
    } catch (error) {
      this.handleConnectionError(error, 'Erro ao calcular CID');
    }
  }

  async downloadFile(cid: string): Promise<Buffer> {
    this.ensureConfigured();
    try {
      const response = await this.client!.post('/api/v0/cat', null, {
        params: { arg: cid },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.handleFileNotFound(error, cid);
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.client) {
      throw new IpfsConnectionError('IPFS indisponível - certificados mTLS não configurados');
    }
  }

  private createFormData(file: Buffer, filename: string): FormData {
    const formData = new FormData();
    formData.append('file', file, { filename });
    return formData;
  }

  private parseUploadResponse(data: any): IpfsUploadResult {
    return {
      cid: data.Hash,
      name: data.Name,
      size: parseInt(data.Size, 10),
    };
  }

  private getErrorMessage(error: any): string {
    return error.response?.data?.Message || error.message;
  }

  private handleConnectionError(error: any, context: string): never {
    const message = this.getErrorMessage(error);
    this.logger.error(`${context}: ${message}`);
    throw new IpfsConnectionError(message);
  }

  private handleUploadError(error: any, filename: string): never {
    const message = this.getErrorMessage(error);
    this.logger.error(`Erro no upload IPFS: ${message}`);
    throw new IpfsUploadError(filename, message);
  }

  private handleFileNotFound(error: any, cid: string): never {
    const message = this.getErrorMessage(error);
    this.logger.error(`Arquivo não encontrado: ${message}`);
    throw new IpfsFileNotFoundError(cid);
  }
}
