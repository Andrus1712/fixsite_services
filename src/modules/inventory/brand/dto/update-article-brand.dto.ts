import { PartialType } from '@nestjs/mapped-types';
import { CreateArticleBrandDto } from './create-article-brand.dto';

export class UpdateArticleBrandDto extends PartialType(CreateArticleBrandDto) { }