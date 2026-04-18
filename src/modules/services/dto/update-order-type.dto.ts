import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderTypeDto } from './create-order-type.dto';

export class UpdateOrderTypeDto extends PartialType(CreateOrderTypeDto) {}
