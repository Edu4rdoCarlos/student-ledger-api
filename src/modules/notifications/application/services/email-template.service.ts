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
}
