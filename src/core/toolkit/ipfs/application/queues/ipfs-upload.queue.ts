export const IPFS_UPLOAD_QUEUE = 'ipfs:upload';

export interface IpfsUploadJobData {
  file: Buffer;
  filename: string;
  attemptNumber: number;
  originalRequestId?: string;
}

export interface IpfsUploadJobResult {
  cid: string;
  name: string;
  size: number;
}
