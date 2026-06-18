import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class QueryServiceArticleDto extends PaginationQueryDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    service_id: number;
}
