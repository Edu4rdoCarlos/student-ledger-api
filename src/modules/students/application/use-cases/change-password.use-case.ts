import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { ChangePasswordDto } from '../../../../shared/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(matricula: string, dto: ChangePasswordDto): Promise<void> {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new NotFoundException(`Aluno não encontrado: ${matricula}`);
    }

    const user = await this.userRepository.findById(student.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.changePassword(user.id, hashedPassword);
  }
}
