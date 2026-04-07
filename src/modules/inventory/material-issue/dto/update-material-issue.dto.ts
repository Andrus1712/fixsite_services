import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialIssueDto } from './create-material-issue.dto';

export class UpdateMaterialIssueDto extends PartialType(CreateMaterialIssueDto) { }
