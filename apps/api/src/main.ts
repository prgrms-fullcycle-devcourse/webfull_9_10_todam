import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createApiEnv } from '@todam/config';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
    const env = createApiEnv();
    const corsOrigins = env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const isDev = env.NODE_ENV !== 'production';
    // dev 한정: 폰 실기 테스트용 cloudflare quick tunnel(*.trycloudflare.com) 동적 origin 허용.
    const devTunnelOrigin = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
        ) => {
            // origin 없는 요청(서버간·curl·동일출처)은 통과.
            if (!origin) return callback(null, true);
            if (corsOrigins.includes(origin)) return callback(null, true);
            if (isDev && devTunnelOrigin.test(origin)) return callback(null, true);
            return callback(null, false);
        },
        credentials: true,
    });
    app.use(cookieParser());

    // 검증: DTO에 정의되지 않은 값 제거, 타입 변환, 미허용 필드 거부
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    // 응답 표준: 성공 응답을 공통 봉투로 래핑
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    // 예외 표준: 모든 예외를 공통 봉투로 변환
    app.useGlobalFilters(new AllExceptionsFilter());

    // Swagger 문서: /docs 에서 확인
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Todam API')
        .setDescription('토담 API 명세서')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    // nestjs-zod createZodDto 스키마를 OpenAPI 문서에 반영(zod → swagger).
    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig));
    SwaggerModule.setup('docs', app, document);

    await app.listen(env.PORT);

    console.warn(`API server listening on http://localhost:${env.PORT}`);
}

void bootstrap();
