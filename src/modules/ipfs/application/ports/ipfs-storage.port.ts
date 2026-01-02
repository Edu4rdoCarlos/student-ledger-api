export interface IpfsUploadResult {
  cid: string;
  name: string;
  size: number;
}

export interface IpfsFileInfo {
  cid: string;
  size: number;
  type: 'file' | 'directory';
}

export interface IpfsHealthStatus {
  status: 'ok' | 'error';
  peerId?: string;
}

export interface IIpfsStorage {
  healthCheck(): Promise<IpfsHealthStatus>;
  uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult>;
  downloadFile(cid: string): Promise<Buffer>;
  exists(cid: string): Promise<boolean>;
  getFileInfo(cid: string): Promise<IpfsFileInfo>;
  pin(cid: string): Promise<void>;
  unpin(cid: string): Promise<void>;
  isValidCid(cid: string): boolean;
}

export const IPFS_STORAGE = Symbol('IIpfsStorage');
