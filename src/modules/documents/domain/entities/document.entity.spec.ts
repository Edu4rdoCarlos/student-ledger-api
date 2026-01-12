import { Document, DocumentStatus } from './document.entity';

describe('Document Entity', () => {
  describe('create', () => {
    it('deve criar um documento com status PENDING e versão 1 por padrão', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      expect(document.defenseId).toBe('defense-123');
      expect(document.status).toBe(DocumentStatus.PENDING);
      expect(document.version).toBe(1);
      expect(document.documentHash).toBeUndefined();
      expect(document.documentCid).toBeUndefined();
      expect(document.blockchainTxId).toBeUndefined();
      expect(document.blockchainRegisteredAt).toBeUndefined();
    });

    it('deve criar documento com campos opcionais', () => {
      const document = Document.create({
        
        defenseId: 'defense-456',
        version: 3,
        documentHash: 'abc123hash',
        documentCid: 'Qm...cid',
        status: DocumentStatus.APPROVED,
      });

      expect(document.version).toBe(3);
      expect(document.documentHash).toBe('abc123hash');
      expect(document.documentCid).toBe('Qm...cid');
      expect(document.status).toBe(DocumentStatus.APPROVED);
    });

    it('deve gerar ID automático', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      expect(document.id).toBeDefined();
      expect(typeof document.id).toBe('string');
    });

    it('deve definir createdAt e updatedAt automaticamente', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      expect(document.createdAt).toBeInstanceOf(Date);
      expect(document.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('approve', () => {
    it('deve aprovar um documento pendente', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      expect(document.isPending()).toBe(true);

      document.approve();

      expect(document.status).toBe(DocumentStatus.APPROVED);
      expect(document.isApproved()).toBe(true);
      expect(document.isPending()).toBe(false);
    });

    it('deve atualizar updatedAt ao aprovar', async () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.approve();
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('inactivate', () => {
    it('deve inativar um documento com razão', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const reason = 'Nova versão criada';
      document.inactivate(reason);

      expect(document.status).toBe(DocumentStatus.INACTIVE);
      expect(document.inactivationReason).toBe(reason);
      expect(document.inactivatedAt).toBeInstanceOf(Date);
      expect(document.isInactive()).toBe(true);
    });

    it('deve permitir inativar documento já inativo', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      document.inactivate('Primeira razão');
      const firstInactivatedAt = document.inactivatedAt;

      document.inactivate('Segunda razão');

      expect(document.status).toBe(DocumentStatus.INACTIVE);
      expect(document.inactivationReason).toBe('Segunda razão');
      expect(document.inactivatedAt).not.toBe(firstInactivatedAt);
    });
  });

  describe('registerOnBlockchain', () => {
    it('deve registrar informações da blockchain', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const txId = 'tx-123abc';
      document.registerOnBlockchain(txId);

      expect(document.blockchainTxId).toBe(txId);
      expect(document.blockchainRegisteredAt).toBeInstanceOf(Date);
    });

    it('deve atualizar updatedAt ao registrar na blockchain', async () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.registerOnBlockchain('tx-123');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('setDocumentHash', () => {
    it('deve definir hash do documento', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const hash = 'abc123hash456';
      document.setDocumentHash(hash);

      expect(document.documentHash).toBe(hash);
    });

    it('deve atualizar updatedAt ao definir hash', async () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setDocumentHash('hash123');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('setDocumentCid', () => {
    it('deve definir CID do documento', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const cid = 'QmExample123';
      document.setDocumentCid(cid);

      expect(document.documentCid).toBe(cid);
    });

    it('deve atualizar updatedAt ao definir CID', async () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setDocumentCid('QmCid123');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('createNewVersion', () => {
    it('deve criar nova versão incrementando version number', () => {
      const originalDocument = Document.create({
        
        defenseId: 'defense-123',
        version: 1,
        documentHash: 'old-hash',
      });

      const newVersion = originalDocument.createNewVersion('new-hash', 'Correção de nota');

      expect(newVersion.version).toBe(2);
      expect(newVersion.documentHash).toBe('new-hash');
      expect(newVersion.changeReason).toBe('Correção de nota');
      expect(newVersion.previousVersionId).toBe(originalDocument.id);
      expect(newVersion.defenseId).toBe(originalDocument.defenseId);
      expect(newVersion.type).toBe(originalDocument.type);
      expect(newVersion.status).toBe(DocumentStatus.PENDING);
    });

    it('deve criar nova versão com version number correto para versão 2', () => {
      const document = Document.create({
        
        defenseId: 'defense-456',
        version: 2,
      });

      const newVersion = document.createNewVersion('hash-v3', 'Atualização de dados');

      expect(newVersion.version).toBe(3);
      expect(newVersion.documentHash).toBe('hash-v3');
      expect(newVersion.changeReason).toBe('Atualização de dados');
    });

    it('deve criar nova versão mantendo o type do documento original', () => {
      const fichaDocument = Document.create({
        
        defenseId: 'defense-789',
      });

      const newVersion = fichaDocument.createNewVersion('hash-123', 'Revisão');

    });
  });

  describe('status helpers', () => {
    it('isPending deve retornar true para documento pendente', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      expect(document.isPending()).toBe(true);
      expect(document.isApproved()).toBe(false);
      expect(document.isInactive()).toBe(false);
    });

    it('isApproved deve retornar true para documento aprovado', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      document.approve();

      expect(document.isApproved()).toBe(true);
      expect(document.isPending()).toBe(false);
      expect(document.isInactive()).toBe(false);
    });

    it('isInactive deve retornar true para documento inativo', () => {
      const document = Document.create({
        
        defenseId: 'defense-123',
      });

      document.inactivate('Nova versão');

      expect(document.isInactive()).toBe(true);
      expect(document.isPending()).toBe(false);
      expect(document.isApproved()).toBe(false);
    });
  });

  describe('getters', () => {
    it('deve retornar todos os campos via getters', () => {
      const now = new Date();
      const document = Document.create({
        
        defenseId: 'defense-abc',
        version: 5,
        documentHash: 'hash-xyz',
        documentCid: 'QmCid-xyz',
        status: DocumentStatus.APPROVED,
        previousVersionId: 'doc-prev-123',
        changeReason: 'Motivo da mudança',
        inactivationReason: 'Inativado por erro',
        inactivatedAt: now,
        blockchainTxId: 'tx-blockchain-123',
        blockchainRegisteredAt: now,
        createdAt: now,
        updatedAt: now,
      }, 'custom-id-123');

      expect(document.id).toBe('custom-id-123');
      expect(document.defenseId).toBe('defense-abc');
      expect(document.version).toBe(5);
      expect(document.documentHash).toBe('hash-xyz');
      expect(document.documentCid).toBe('QmCid-xyz');
      expect(document.status).toBe(DocumentStatus.APPROVED);
      expect(document.previousVersionId).toBe('doc-prev-123');
      expect(document.changeReason).toBe('Motivo da mudança');
      expect(document.inactivationReason).toBe('Inativado por erro');
      expect(document.inactivatedAt).toBe(now);
      expect(document.blockchainTxId).toBe('tx-blockchain-123');
      expect(document.blockchainRegisteredAt).toBe(now);
      expect(document.createdAt).toBe(now);
      expect(document.updatedAt).toBe(now);
    });
  });
});
