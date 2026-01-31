import { Injectable } from '@nestjs/common';
import { EmailTemplate } from '../../domain/enums';

export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
}

@Injectable()
export class EmailTemplateService {
  generateTemplate(template: EmailTemplate, data: EmailTemplateData): EmailTemplateResult {
    switch (template) {
      case EmailTemplate.DEFENSE_SCHEDULED:
        return this.defenseScheduled(data);

      case EmailTemplate.DEFENSE_CANCELED:
        return this.defenseCanceled(data);

      case EmailTemplate.DEFENSE_RESCHEDULED:
        return this.defenseRescheduled(data);

      case EmailTemplate.DEFENSE_RESULT:
        return this.defenseResult(data);

      case EmailTemplate.DOCUMENT_APPROVAL_REQUEST:
        return this.documentApprovalRequest(data);

      case EmailTemplate.DOCUMENT_APPROVED:
        return this.documentApproved(data);

      case EmailTemplate.DOCUMENT_REJECTED:
        return this.documentRejected(data);

      case EmailTemplate.REJECTION_OVERRIDDEN:
        return this.rejectionOverridden(data);

      case EmailTemplate.USER_CREDENTIALS:
        return this.userCredentials(data);

      default:
        throw new Error(`Template não encontrado: ${template}`);
    }
  }

  private defenseScheduled(data: EmailTemplateData): EmailTemplateResult {
    const studentsNames = data.studentsNames || '';
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const location = data.location ? `<li><strong>Local:</strong> ${data.location}</li>` : '';

    return {
      subject: `Defesa agendada: ${data.defenseTitle}`,
      html: `
        <h2>Defesa Agendada</h2>
        <p>Olá,</p>
        <p>Uma defesa foi agendada:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          ${location}
          <li><strong>Aluno(s):</strong> ${studentsNames}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
        </ul>
        <p>Por favor, prepare-se para a defesa e certifique-se de que todos os materiais necessários estejam prontos.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseCanceled(data: EmailTemplateData): EmailTemplateResult {
    const studentsNames = data.studentsNames || '';
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return {
      subject: `Defesa cancelada: ${data.defenseTitle}`,
      html: `
        <h2>Defesa Cancelada</h2>
        <p>Olá,</p>
        <p>Informamos que a seguinte defesa foi cancelada:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Aluno(s):</strong> ${studentsNames}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
        </ul>
        <p>Em caso de dúvidas, entre em contato com a coordenação.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseRescheduled(data: EmailTemplateData): EmailTemplateResult {
    const studentsNames = data.studentsNames || '';
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const location = data.location ? `<li><strong>Local:</strong> ${data.location}</li>` : '';

    return {
      subject: `Defesa reagendada: ${data.defenseTitle}`,
      html: `
        <h2>Defesa Reagendada</h2>
        <p>Olá,</p>
        <p>Informamos que a seguinte defesa foi reagendada para uma nova data:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Nova Data:</strong> ${defenseDate}</li>
          ${location}
          <li><strong>Aluno(s):</strong> ${studentsNames}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
        </ul>
        <p>Por favor, atualize sua agenda e prepare-se para a nova data.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseResult(data: EmailTemplateData): EmailTemplateResult {
    const studentsNames = data.studentsNames || '';
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const isPassed = data.result === 'APPROVED';
    const resultText = isPassed ? 'APROVADO' : 'REPROVADO';
    const resultColor = isPassed ? '#22c55e' : '#ef4444';

    return {
      subject: `Resultado da defesa: ${data.defenseTitle}`,
      html: `
        <h2>Resultado da Defesa</h2>
        <p>Olá,</p>
        <p>O resultado da defesa foi publicado:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Aluno(s):</strong> ${studentsNames}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
          <li><strong>Nota Final:</strong> ${data.finalGrade}</li>
          <li><strong>Resultado:</strong> <span style="color: ${resultColor}; font-weight: bold;">${resultText}</span></li>
        </ul>
        ${isPassed
          ? '<p>Parabéns! O trabalho foi muito bem avaliado.</p>'
          : '<p>Infelizmente não foi atingida a nota mínima necessária. Entre em contato com a coordenação para mais informações.</p>'
        }
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private documentApprovalRequest(data: EmailTemplateData): EmailTemplateResult {
    const approvalUrl = data.approvalId
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${data.approvalId}`
      : '#';

    return {
      subject: `Solicitação de aprovação de documento - ${data.documentType}`,
      html: `
        <h2>Solicitação de Aprovação de Documento</h2>
        <p>Olá,</p>
        <p>Um novo documento foi submetido e aguarda sua aprovação:</p>
        <ul>
          <li><strong>Tipo:</strong> ${data.documentType}</li>
          <li><strong>Defesa:</strong> ${data.defenseTitle || 'N/A'}</li>
          <li><strong>Aluno(s):</strong> ${data.studentsNames || 'N/A'}</li>
          <li><strong>Data de Submissão:</strong> ${new Date(data.submittedAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</li>
        </ul>

        <div style="margin: 30px 0;">
          <a href="${approvalUrl}"
             style="background-color: #3b82f6; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;
                    display: inline-block;">
            Revisar e Aprovar Documento
          </a>
        </div>

        <p>Por favor, faça login no sistema e revise o documento para aprová-lo ou rejeitá-lo.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private documentApproved(data: EmailTemplateData): EmailTemplateResult {
    return {
      subject: `Documento aprovado - ${data.documentType}`,
      html: `
        <h2>Documento Aprovado</h2>
        <p>Olá,</p>
        <p>Seu documento foi aprovado pela coordenação:</p>
        <ul>
          <li><strong>Tipo:</strong> ${data.documentType}</li>
          <li><strong>Defesa:</strong> ${data.defenseTitle || 'N/A'}</li>
          <li><strong>Aprovado por:</strong> ${data.approvedBy}</li>
          <li><strong>Data de Aprovação:</strong> ${new Date(data.approvedAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</li>
        </ul>
        ${data.comments ? `<p><strong>Comentários:</strong> ${data.comments}</p>` : ''}
        <p>Parabéns! O processo foi concluído com sucesso.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private documentRejected(data: EmailTemplateData): EmailTemplateResult {
    return {
      subject: `Documento rejeitado - ${data.documentType}`,
      html: `
        <h2>Documento Rejeitado</h2>
        <p>Olá,</p>
        <p>Infelizmente seu documento foi rejeitado pela coordenação:</p>
        <ul>
          <li><strong>Tipo:</strong> ${data.documentType}</li>
          <li><strong>Defesa:</strong> ${data.defenseTitle || 'N/A'}</li>
          <li><strong>Rejeitado por:</strong> ${data.rejectedBy}</li>
          <li><strong>Data de Rejeição:</strong> ${new Date(data.rejectedAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</li>
        </ul>
        ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
        <p>Por favor, revise o documento e submeta novamente após as correções necessárias.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private rejectionOverridden(data: EmailTemplateData): EmailTemplateResult {
    const approvalUrl = data.approvalId
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${data.approvalId}`
      : '#';

    return {
      subject: `Rejeição desconsiderada - ${data.documentType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Rejeição Desconsiderada pelo Coordenador</h2>
          <p>Olá, ${data.approverName}!</p>

          <p>A coordenação analisou a rejeição que você fez e decidiu <strong>desconsiderar</strong> a mesma.</p>

          <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📋 Informações do Documento:</strong></p>
            <ul style="margin: 8px 0 0 0;">
              <li><strong>Tipo:</strong> ${data.documentType}</li>
              <li><strong>Defesa:</strong> ${data.defenseTitle || 'N/A'}</li>
              <li><strong>Aluno(s):</strong> ${data.studentsNames || 'N/A'}</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💬 Justificativa do Coordenador:</strong></p>
            <p style="margin: 8px 0 0 0; font-style: italic;">"${data.coordinatorReason}"</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">🔄 O que isso significa?</h3>
            <p style="margin: 0;">
              Sua rejeição foi analisada e considerada inválida ou inapropriada pelo coordenador.
              O status da aprovação foi <strong>resetado para PENDENTE</strong> e você está sendo
              solicitado(a) a <strong>revisar o documento novamente</strong>.
            </p>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${approvalUrl}"
               style="background-color: #3b82f6; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      display: inline-block;">
              Revisar Documento Novamente
            </a>
          </div>

          <p>Por favor, acesse o sistema e faça uma nova análise do documento considerando a justificativa do coordenador.</p>

          <p>Se você tiver dúvidas sobre esta decisão, entre em contato com a coordenação.</p>

          <br>
          <p style="color: #6b7280; font-size: 14px;">
            Atenciosamente,<br>
            <strong>Student Ledger</strong>
          </p>
        </div>
      `,
    };
  }

  private userCredentials(data: EmailTemplateData): EmailTemplateResult {
    const accessUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const roleLabel = this.getRoleLabel(data.role);

    return {
      subject: 'Bem-vindo ao Student Ledger - Credenciais de Acesso',
      html: `
        <h2>Bem-vindo ao Student Ledger!</h2>
        <p>Olá, ${data.name}!</p>
        <p>Sua conta foi criada com sucesso no sistema Student Ledger.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Suas Credenciais de Acesso</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Tipo de Usuário:</strong> ${roleLabel}</li>
            <li style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</li>
            <li style="margin: 10px 0;"><strong>Senha Temporária:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${data.temporaryPassword}</code></li>
          </ul>
        </div>

        <div style="margin: 30px 0;">
          <a href="${accessUrl}"
             style="background-color: #3b82f6; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;
                    display: inline-block;">
            Acessar o Sistema
          </a>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
          <p style="margin: 8px 0 0 0;">Por motivos de segurança, recomendamos que você altere sua senha no primeiro acesso ao sistema.</p>
        </div>

        <p>Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com o suporte.</p>
        <br>
        <p>Atenciosamente,<br>Equipe Student Ledger</p>
      `,
    };
  }

  private getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      STUDENT: 'Aluno',
      ADVISOR: 'Orientador',
      COORDINATOR: 'Coordenador',
      ADMIN: 'Administrador',
    };
    return roleLabels[role] || role;
  }
}
