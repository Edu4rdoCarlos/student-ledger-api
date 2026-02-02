export interface IpfsUploadResult {
  cid: string;
  name: string;
  size: number;
}

export interface IpfsHealthStatus {
  status: 'ok' | 'error';
  peerId?: string;
}

export interface IIpfsStorage {
  healthCheck(): Promise<IpfsHealthStatus>;
  uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult>;
  calculateCid(file: Buffer): Promise<string>;
  downloadFile(cid: string): Promise<Buffer>;
}

export const IPFS_STORAGE = Symbol('IIpfsStorage');
