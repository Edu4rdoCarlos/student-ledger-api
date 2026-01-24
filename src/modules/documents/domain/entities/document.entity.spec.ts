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
      expect(document.minutesHash).toBeUndefined();
      expect(document.minutesCid).toBeUndefined();
      expect(document.evaluationHash).toBeUndefined();
      expect(document.evaluationCid).toBeUndefined();
      expect(document.blockchainTxId).toBeUndefined();
      expect(document.blockchainRegisteredAt).toBeUndefined();
    });

    it('deve criar documento com campos opcionais', () => {
      const document = Document.create({
        defenseId: 'defense-456',
        version: 3,
        minutesHash: 'minutes-hash-123',
        minutesCid: 'QmMinutesCid',
        evaluationHash: 'evaluation-hash-456',
        evaluationCid: 'bafyEvaluationCid',
        status: DocumentStatus.APPROVED,
      });

      expect(document.version).toBe(3);
      expect(document.minutesHash).toBe('minutes-hash-123');
      expect(document.minutesCid).toBe('QmMinutesCid');
      expect(document.evaluationHash).toBe('evaluation-hash-456');
      expect(document.evaluationCid).toBe('bafyEvaluationCid');
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

  describe('setMinutesHash', () => {
    it('deve definir hash do documento de ata', () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const hash = 'minutes-hash-abc123';
      document.setMinutesHash(hash);

      expect(document.minutesHash).toBe(hash);
    });

    it('deve atualizar updatedAt ao definir hash', async () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setMinutesHash('hash123');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('setMinutesCid', () => {
    it('deve definir CID do documento de ata', () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const cid = 'QmMinutesExample123';
      document.setMinutesCid(cid);

      expect(document.minutesCid).toBe(cid);
    });

    it('deve atualizar updatedAt ao definir CID', async () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setMinutesCid('QmCid123');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('setEvaluationHash', () => {
    it('deve definir hash do documento de avaliação', () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const hash = 'evaluation-hash-xyz789';
      document.setEvaluationHash(hash);

      expect(document.evaluationHash).toBe(hash);
    });

    it('deve atualizar updatedAt ao definir hash', async () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setEvaluationHash('hash789');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('setEvaluationCid', () => {
    it('deve definir CID do documento de avaliação', () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const cid = 'bafyEvaluationExample456';
      document.setEvaluationCid(cid);

      expect(document.evaluationCid).toBe(cid);
    });

    it('deve atualizar updatedAt ao definir CID', async () => {
      const document = Document.create({
        defenseId: 'defense-123',
      });

      const initialUpdatedAt = document.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      document.setEvaluationCid('bafyCid456');
      expect(document.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('createNewVersion', () => {
    it('deve criar nova versão incrementando version number para minutes', () => {
      const originalDocument = Document.create({
        defenseId: 'defense-123',
        version: 1,
        minutesHash: 'old-minutes-hash',
        evaluationHash: 'old-evaluation-hash',
      });

      const newVersion = originalDocument.createNewVersion('minutes', 'new-minutes-hash', 'Correção de nota');

      expect(newVersion.version).toBe(2);
      expect(newVersion.minutesHash).toBe('new-minutes-hash');
      expect(newVersion.minutesCid).toBeUndefined(); // Will be filled when uploaded to IPFS
      expect(newVersion.evaluationHash).toBe('old-evaluation-hash'); // Keeps old evaluation hash
      expect(newVersion.changeReason).toBe('Correção de nota');
      expect(newVersion.previousVersionId).toBe(originalDocument.id);
      expect(newVersion.defenseId).toBe(originalDocument.defenseId);
      expect(newVersion.status).toBe(DocumentStatus.PENDING);
    });

    it('deve criar nova versão incrementando version number para evaluation', () => {
      const originalDocument = Document.create({
        defenseId: 'defense-123',
        version: 1,
        minutesHash: 'old-minutes-hash',
        evaluationHash: 'old-evaluation-hash',
      });

      const newVersion = originalDocument.createNewVersion('evaluation', 'new-evaluation-hash', 'Atualização de avaliação');

      expect(newVersion.version).toBe(2);
      expect(newVersion.minutesHash).toBe('old-minutes-hash'); // Keeps old minutes hash
      expect(newVersion.evaluationHash).toBe('new-evaluation-hash');
      expect(newVersion.evaluationCid).toBeUndefined(); // Will be filled when uploaded to IPFS
      expect(newVersion.changeReason).toBe('Atualização de avaliação');
    });

    it('deve criar nova versão com version number correto para versão 2', () => {
      const document = Document.create({
        defenseId: 'defense-456',
        version: 2,
      });

      const newVersion = document.createNewVersion('minutes', 'hash-v3', 'Atualização de dados');

      expect(newVersion.version).toBe(3);
      expect(newVersion.minutesHash).toBe('hash-v3');
      expect(newVersion.changeReason).toBe('Atualização de dados');
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
        minutesHash: 'minutes-hash-xyz',
        minutesCid: 'QmMinutesCid-xyz',
        evaluationHash: 'evaluation-hash-xyz',
        evaluationCid: 'bafyEvaluationCid-xyz',
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
      expect(document.minutesHash).toBe('minutes-hash-xyz');
      expect(document.minutesCid).toBe('QmMinutesCid-xyz');
      expect(document.evaluationHash).toBe('evaluation-hash-xyz');
      expect(document.evaluationCid).toBe('bafyEvaluationCid-xyz');
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
