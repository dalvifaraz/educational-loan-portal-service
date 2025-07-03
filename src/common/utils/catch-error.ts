import { HTTPSTATUS, HttpStatusCode } from '../../config/http.config';
import { ErrorCode } from '../enums/error-code.enum';
import { AppError } from './AppError';

export class NotFoundException extends AppError {
  constructor(message = 'Resource Not Found', errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.NOT_FOUND,
      errorCode || ErrorCode.RESOURCE_NOT_FOUND,
    );
  }
}

export class BadRequestException extends AppError {
  constructor(message = 'Bad Request', errorCode?: ErrorCode) {
    super(message, HTTPSTATUS.BAD_REQUEST, errorCode);
  }
}

export class UnAuthorizedException extends AppError {
  constructor(message = 'UnAuthorized Exception', errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.BAD_REQUEST,
      errorCode || ErrorCode.ACCESS_UNAUTHORIZED,
    );
  }
}

export class InternalServerException extends AppError {
  constructor(message = 'Internal Server Exception', errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.BAD_REQUEST,
      errorCode || ErrorCode.INTERNAL_SERVER_ERROR,
    );
  }
}

export class HttpException extends AppError {
  constructor(
    message = 'Http Exception Error',
    statusCode: HttpStatusCode,
    errorCode?: ErrorCode,
  ) {
    super(message, statusCode, errorCode || ErrorCode.RESOURCE_NOT_FOUND);
  }
}
