import { Injectable } from '@nestjs/common';
import { Document as PrismaDocument } from '@prisma/client';
import { PrismaService } from '../../../../../database/prisma';
import { Document } from '../../domain/entities';
import { IDocumentRepository, DocumentFilters } from '../../application/ports';
import { DocumentMapper } from './document.mapper';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: Document): Promise<Document> {
    const data = DocumentMapper.toPrisma(document);
    const created = await this.prisma.document.create({ data });
    return DocumentMapper.toDomain(created);
  }

  async findById(id: string): Promise<Document | null> {
    const found = await this.prisma.document.findUnique({ where: { id } });
    return found ? DocumentMapper.toDomain(found) : null;
  }

  async findByCid(cid: string): Promise<Document | null> {
    const found = await this.prisma.document.findFirst({
      where: {
        OR: [
          { minutesCid: cid },
          { evaluationCid: cid },
        ],
      },
      orderBy: { version: 'desc' },
    });
    return found ? DocumentMapper.toDomain(found) : null;
  }

  async findByDefenseId(defenseId: string): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: { defenseId },
      orderBy: { version: 'desc' },
    });
    return documents.map(DocumentMapper.toDomain);
  }

  async findAll(filters?: DocumentFilters): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        status: filters?.status,
        defenseId: filters?.defenseId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(DocumentMapper.toDomain);
  }

  async update(document: Document): Promise<Document> {
    const data = DocumentMapper.toPrisma(document);
    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data,
    });
    return DocumentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } });
  }

  async existsByHash(hash: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: {
        OR: [
          { minutesHash: hash },
          { evaluationHash: hash },
        ],
      },
    });
    return count > 0;
  }

  async getSummary() {
    const [totalDocuments, pendingDocuments, approvedDocuments, totalStudents] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.document.count({ where: { status: 'PENDING' } }),
      this.prisma.document.count({ where: { status: 'APPROVED' } }),
      this.prisma.student.count(),
    ]);

    return {
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      totalStudents,
    };
  }
}
