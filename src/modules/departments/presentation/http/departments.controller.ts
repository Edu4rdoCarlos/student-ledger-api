import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  GetDepartmentUseCase,
  ListDepartmentsUseCase,
  ListDepartmentsQuery,
  UpdateDepartmentUseCase,
} from '../../application/use-cases';
import { UpdateDepartmentDto, DepartmentResponseDto } from '../dtos';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';
import { Roles } from '../../../../shared/decorators';
import { ApiDepartmentOkResponse, ApiDepartmentListResponse } from '../docs/responses/success.response';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly getDepartment: GetDepartmentUseCase,
    private readonly listDepartments: ListDepartmentsUseCase,
    private readonly updateDepartment: UpdateDepartmentUseCase,
  ) {}

  @Get()
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Listar departamentos' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Quantidade de itens por página' })
  @ApiDepartmentListResponse()
  async findAll(@Query() query: ListDepartmentsQuery) {
    return this.listDepartments.execute(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Buscar departamento por ID' })
  @ApiDepartmentOkResponse()
  async findOne(@Param('id') id: string): Promise<HttpResponse<DepartmentResponseDto>> {
    const department = await this.getDepartment.execute(id);
    return HttpResponseSerializer.serialize(department);
  }

  @Put(':id')
  @Roles('ADMIN', 'COORDINATOR')
  @ApiOperation({ summary: 'Atualizar departamento' })
  @ApiDepartmentOkResponse()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<HttpResponse<DepartmentResponseDto>> {
    const department = await this.updateDepartment.execute(id, dto);
    return HttpResponseSerializer.serialize(department);
  }
}
