import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

@Injectable()
export class MongoStorageService {
  private client: MongoClient;
  private bucket: GridFSBucket;

  constructor(private configService: ConfigService) {
    const mongoUri = this.configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017');
    const dbName = this.configService.get<string>('MONGODB_DATABASE', 'student-ledger');

    this.client = new MongoClient(mongoUri);
    this.client.connect();

    const db = this.client.db(dbName);
    this.bucket = new GridFSBucket(db, { bucketName: 'documents' });
  }

  async uploadFile(fileId: string, buffer: Buffer, filename: string): Promise<void> {
    const uploadStream = this.bucket.openUploadStreamWithId(new ObjectId(fileId), filename, {
      metadata: { uploadedAt: new Date() },
    });

    return new Promise<void>((resolve, reject) => {
      uploadStream.end(buffer, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const downloadStream = this.bucket.openDownloadStream(new ObjectId(fileId));

      const chunks: Buffer[] = [];

      return new Promise<Buffer>((resolve, reject) => {
        downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        downloadStream.on('error', (error: Error) => reject(error));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      throw new NotFoundException(`Arquivo não encontrado no MongoDB: ${fileId}`);
    }
  }

  async fileExists(fileId: string): Promise<boolean> {
    try {
      const files = await this.bucket.find({ _id: new ObjectId(fileId) }).toArray();
      return files.length > 0;
    } catch {
      return false;
    }
  }
}
