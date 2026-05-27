import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { createApiEnv } from '@todam/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const env = createApiEnv();
    const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
    const app = await NestFactory.create(AppModule);

    app.enableCors({ origin: corsOrigins, credentials: true });

    await app.listen(env.PORT);

    console.log(`API server listening on http://localhost:${env.PORT}`);
}

void bootstrap();
