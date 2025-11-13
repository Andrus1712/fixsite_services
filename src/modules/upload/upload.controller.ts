import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    return {
      message: 'Imagen subida exitosamente',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/images/${file.filename}`
    };
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/)) {
        return cb(new BadRequestException('Solo se permiten documentos PDF, Word, Excel o TXT'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    return {
      message: 'Documento subido exitosamente',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/documents/${file.filename}`
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/)) {
        return cb(new BadRequestException('Tipo de archivo no permitido'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }
    return {
      message: 'Archivos subidos exitosamente',
      files: files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        url: `/uploads/images/${file.filename}`
      }))
    };
  }
}