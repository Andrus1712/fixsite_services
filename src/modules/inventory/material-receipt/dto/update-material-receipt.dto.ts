import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialReceiptDto } from './create-material-receipt.dto';

export class UpdateMaterialReceiptDto extends PartialType(CreateMaterialReceiptDto) { }
