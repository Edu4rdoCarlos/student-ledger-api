import { Approval, ApprovalRole, ApprovalStatus } from './approval.entity';

describe('Approval Entity', () => {
  describe('create', () => {
    it('deve criar uma aprovação com status PENDING por padrão', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      expect(approval.documentId).toBe('doc-123');
      expect(approval.role).toBe(ApprovalRole.COORDINATOR);
      expect(approval.status).toBe(ApprovalStatus.PENDING);
      expect(approval.approvedAt).toBeUndefined();
      expect(approval.approverId).toBeUndefined();
      expect(approval.justification).toBeUndefined();
    });

    it('deve criar aprovação com todos os campos opcionais', () => {
      const now = new Date();
      const approval = Approval.create({
        id: 'approval-123',
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
        status: ApprovalStatus.APPROVED,
        approverId: 'user-456',
        approvedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      expect(approval.id).toBe('approval-123');
      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.approverId).toBe('user-456');
      expect(approval.approvedAt).toBe(now);
    });

    it('deve definir createdAt e updatedAt automaticamente se não fornecidos', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.STUDENT,
      });

      expect(approval.createdAt).toBeInstanceOf(Date);
      expect(approval.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('approve', () => {
    it('deve aprovar uma aprovação pendente', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      const approverId = 'user-789';
      approval.approve(approverId);

      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.approverId).toBe(approverId);
      expect(approval.approvedAt).toBeInstanceOf(Date);
      expect(approval.updatedAt).toBeInstanceOf(Date);
    });

    it('deve lançar erro ao tentar aprovar aprovação já aprovada', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      approval.approve('user-1');

      expect(() => approval.approve('user-2')).toThrow(
        'Apenas aprovações pendentes podem ser aprovadas'
      );
    });

    it('deve lançar erro ao tentar aprovar aprovação rejeitada', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
      });

      approval.reject('user-1', 'Documento incompleto');

      expect(() => approval.approve('user-2')).toThrow(
        'Apenas aprovações pendentes podem ser aprovadas'
      );
    });

    it('deve atualizar updatedAt ao aprovar', async () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      const initialUpdatedAt = approval.updatedAt;

      // Aguarda 10ms para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      approval.approve('user-123');
      expect(approval.updatedAt?.getTime()).toBeGreaterThan(initialUpdatedAt!.getTime());
    });
  });

  describe('reject', () => {
    it('deve rejeitar uma aprovação pendente com justificativa', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
      });

      const approverId = 'user-456';
      const justification = 'Documento não atende aos requisitos mínimos';

      approval.reject(approverId, justification);

      expect(approval.status).toBe(ApprovalStatus.REJECTED);
      expect(approval.approverId).toBe(approverId);
      expect(approval.justification).toBe(justification);
      expect(approval.updatedAt).toBeInstanceOf(Date);
    });

    it('deve lançar erro ao rejeitar sem justificativa', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.STUDENT,
      });

      expect(() => approval.reject('user-123', '')).toThrow(
        'Justificativa é obrigatória para rejeição'
      );
    });

    it('deve lançar erro ao rejeitar com justificativa apenas com espaços', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      expect(() => approval.reject('user-123', '   ')).toThrow(
        'Justificativa é obrigatória para rejeição'
      );
    });

    it('deve lançar erro ao tentar rejeitar aprovação já aprovada', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
      });

      approval.approve('user-1');

      expect(() => approval.reject('user-2', 'Motivo qualquer')).toThrow(
        'Apenas aprovações pendentes podem ser rejeitadas'
      );
    });

    it('deve lançar erro ao tentar rejeitar aprovação já rejeitada', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.STUDENT,
      });

      approval.reject('user-1', 'Primeiro motivo');

      expect(() => approval.reject('user-2', 'Segundo motivo')).toThrow(
        'Apenas aprovações pendentes podem ser rejeitadas'
      );
    });
  });

  describe('getters', () => {
    it('deve retornar todos os campos via getters', () => {
      const now = new Date();
      const approval = Approval.create({
        id: 'approval-123',
        documentId: 'doc-456',
        role: ApprovalRole.COORDINATOR,
        status: ApprovalStatus.APPROVED,
        approverId: 'user-789',
        justification: 'Aprovado com ressalvas',
        approvedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      expect(approval.id).toBe('approval-123');
      expect(approval.documentId).toBe('doc-456');
      expect(approval.role).toBe(ApprovalRole.COORDINATOR);
      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.approverId).toBe('user-789');
      expect(approval.justification).toBe('Aprovado com ressalvas');
      expect(approval.approvedAt).toBe(now);
      expect(approval.createdAt).toBe(now);
      expect(approval.updatedAt).toBe(now);
    });
  });

  describe('cenários de aprovação por role', () => {
    it('deve permitir aprovação por COORDINATOR', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      approval.approve('coord-123');

      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.role).toBe(ApprovalRole.COORDINATOR);
    });

    it('deve permitir aprovação por ADVISOR', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
      });

      approval.approve('advisor-123');

      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.role).toBe(ApprovalRole.ADVISOR);
    });

    it('deve permitir aprovação por STUDENT', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.STUDENT,
      });

      approval.approve('student-123');

      expect(approval.status).toBe(ApprovalStatus.APPROVED);
      expect(approval.role).toBe(ApprovalRole.STUDENT);
    });
  });

  describe('validação de status', () => {
    it('deve validar transição de PENDING para APPROVED', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.COORDINATOR,
      });

      expect(approval.status).toBe(ApprovalStatus.PENDING);
      approval.approve('user-123');
      expect(approval.status).toBe(ApprovalStatus.APPROVED);
    });

    it('deve validar transição de PENDING para REJECTED', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.ADVISOR,
      });

      expect(approval.status).toBe(ApprovalStatus.PENDING);
      approval.reject('user-123', 'Motivo da rejeição');
      expect(approval.status).toBe(ApprovalStatus.REJECTED);
    });

    it('deve prevenir múltiplas transições de status', () => {
      const approval = Approval.create({
        documentId: 'doc-123',
        role: ApprovalRole.STUDENT,
      });

      approval.approve('user-1');

      expect(() => approval.approve('user-2')).toThrow();
      expect(() => approval.reject('user-2', 'motivo')).toThrow();
    });
  });
});
