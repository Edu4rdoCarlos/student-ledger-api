import { Inject, Injectable } from '@nestjs/common';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { CoordinatorResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';

export interface ListCoordinatorsQuery {
  page?: number;
  perPage?: number;
}

export interface ListCoordinatorsResponse {
  data: CoordinatorResponseDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListCoordinatorsUseCase {
  constructor(
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
  ) {}

  async execute(query: ListCoordinatorsQuery = {}): Promise<ListCoordinatorsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    const { items, total } = await this.coordinatorRepository.findAllPaginated({
      skip,
      take: perPage,
    });

    return {
      data: items.map(coordinator => CoordinatorResponseDto.fromEntity(coordinator)),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
