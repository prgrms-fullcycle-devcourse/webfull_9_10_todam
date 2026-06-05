import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { ValidationError, ValidationPipeOptions } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';

export interface BusinessValidationPipeOptions extends ValidationPipeOptions {
    errorCode: string;
    fallbackMessage: string;
}

export class BusinessValidationPipe extends ValidationPipe {
    constructor({ errorCode, fallbackMessage, ...options }: BusinessValidationPipeOptions) {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: false },
            ...options,
            exceptionFactory: (errors: ValidationError[]) =>
                new BusinessException(
                    errorCode,
                    firstValidationMessage(errors) ?? fallbackMessage,
                    HttpStatus.BAD_REQUEST,
                ),
        });
    }
}

function firstValidationMessage(errors: ValidationError[]): string | null {
    for (const error of errors) {
        if (error.constraints) {
            const first = Object.values(error.constraints)[0];
            if (first) {
                return first;
            }
        }
    }
    return null;
}
