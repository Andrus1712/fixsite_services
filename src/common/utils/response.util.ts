import { HttpStatus } from '@nestjs/common';

export interface ApiResponse<T = any> {
  success: boolean;
  status: HttpStatus;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string,
    status: HttpStatus = HttpStatus.OK
  ): ApiResponse<T> {
    return {
      success: true,
      status,
      message,
      data
    };
  }

  static successWithPagination<T>(
    data: T,
    message: string,
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
    status: HttpStatus = HttpStatus.OK
  ): ApiResponse<T> {
    return {
      success: true,
      status,
      message,
      data,
      pagination
    };
  }
}