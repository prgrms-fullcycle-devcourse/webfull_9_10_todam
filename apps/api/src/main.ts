import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { createApiEnv } from '@todam/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const env = createApiEnv();
    const app = await NestFactory.create(AppModule);

    await app.listen(env.PORT);

    console.log(`API server listening on http://localhost:${env.PORT}`);
}

void bootstrap();
