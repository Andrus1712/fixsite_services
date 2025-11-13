import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class UploadService {
  
  getMulterConfig(destination: string) {
    return {
      storage: diskStorage({
        destination: `./uploads/${destination}`,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    };
  }

  processUploadedFiles(files: Express.Multer.File[]): string[] {
    return files.map(file => `/uploads/images/${file.filename}`);
  }
}