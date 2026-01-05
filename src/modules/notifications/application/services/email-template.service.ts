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
      case EmailTemplate.DEFENSE_SCHEDULED_ADVISOR:
        return this.defenseScheduledAdvisor(data);

      case EmailTemplate.DEFENSE_SCHEDULED_STUDENT:
        return this.defenseScheduledStudent(data);

      case EmailTemplate.DEFENSE_RESULT_STUDENT:
        return this.defenseResultStudent(data);

      case EmailTemplate.DEFENSE_RESULT_ADVISOR:
        return this.defenseResultAdvisor(data);

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

  private defenseScheduledAdvisor(data: EmailTemplateData): EmailTemplateResult {
    const studentsNames = data.studentsNames || '';
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return {
      subject: `Defesa agendada: ${data.defenseTitle}`,
      html: `
        <h2>Defesa Agendada</h2>
        <p>Olá,</p>
        <p>Uma defesa sob sua orientação foi agendada:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Aluno(s):</strong> ${studentsNames}</li>
        </ul>
        <p>Por favor, prepare-se para a defesa e certifique-se de que todos os materiais necessários estejam prontos.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseScheduledStudent(data: EmailTemplateData): EmailTemplateResult {
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return {
      subject: `Sua defesa foi agendada: ${data.defenseTitle}`,
      html: `
        <h2>Sua Defesa Foi Agendada</h2>
        <p>Olá,</p>
        <p>Sua defesa foi agendada com sucesso:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
        </ul>
        <p>Por favor, prepare sua apresentação e esteja pronto para a data agendada.</p>
        <p>Boa sorte!</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseResultStudent(data: EmailTemplateData): EmailTemplateResult {
    const defenseDate = new Date(data.defenseDate).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const isPassed = data.result === 'APPROVED';
    const resultText = isPassed ? 'APROVADO' : 'REPROVADO';
    const resultColor = isPassed ? '#22c55e' : '#ef4444';

    return {
      subject: `Resultado da sua defesa: ${data.defenseTitle}`,
      html: `
        <h2>Resultado da Sua Defesa</h2>
        <p>Olá,</p>
        <p>O resultado da sua defesa foi publicado:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Orientador:</strong> ${data.advisorName}</li>
          <li><strong>Nota Final:</strong> ${data.finalGrade}</li>
          <li><strong>Resultado:</strong> <span style="color: ${resultColor}; font-weight: bold;">${resultText}</span></li>
        </ul>
        ${isPassed
          ? '<p>Parabéns pela aprovação! Seu trabalho foi muito bem avaliado.</p>'
          : '<p>Infelizmente você não atingiu a nota mínima necessária. Entre em contato com seu orientador para mais informações.</p>'
        }
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private defenseResultAdvisor(data: EmailTemplateData): EmailTemplateResult {
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
        <p>O resultado da defesa sob sua orientação foi registrado:</p>
        <ul>
          <li><strong>Título:</strong> ${data.defenseTitle}</li>
          <li><strong>Data:</strong> ${defenseDate}</li>
          <li><strong>Aluno(s):</strong> ${data.studentsNames}</li>
          <li><strong>Nota Final:</strong> ${data.finalGrade}</li>
          <li><strong>Resultado:</strong> <span style="color: ${resultColor}; font-weight: bold;">${resultText}</span></li>
        </ul>
        <p>O documento da defesa foi anexado e enviado para aprovação da coordenação.</p>
        <br>
        <p>Atenciosamente,<br>Student Ledger</p>
      `,
    };
  }

  private documentApprovalRequest(data: EmailTemplateData): EmailTemplateResult {
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
        <p>Por favor, acesse o sistema para revisar e aprovar/rejeitar o documento.</p>
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
