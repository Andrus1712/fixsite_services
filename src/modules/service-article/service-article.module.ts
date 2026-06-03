import { Module } from '@nestjs/common';
import { ServiceArticleController } from './service-article.controller';
import { ServiceArticleService } from './service-article.service';

@Module({
    controllers: [ServiceArticleController],
    providers: [ServiceArticleService],
    exports: [ServiceArticleService],
})
export class ServiceArticleModule { }
